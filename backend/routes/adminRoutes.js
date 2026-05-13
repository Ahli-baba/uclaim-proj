const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { adminMiddleware, staffOrAdminMiddleware } = require("../middleware/admin");
const Settings = require("../models/Settings");
const Item = require("../models/Item");
const Claim = require("../models/Claim");
const Category = require("../models/Category");
const bcrypt = require("bcryptjs");
// ─────────────────────────────────────────────────────────────
// HELPER: convert empty string → null for Date fields
// ─────────────────────────────────────────────────────────────
const sanitizeDateFields = (body) => {
    const dateFields = ["maintenanceStart", "maintenanceEnd"];
    dateFields.forEach((field) => {
        if (body[field] === "" || body[field] === undefined) {
            body[field] = null;
        }
    });
    return body;
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/settings
// ─────────────────────────────────────────────────────────────
router.get("/settings", async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        const isAdmin = req.user && req.user.role === "admin";

        if (isAdmin) {
            return res.json({ settings: settings.toObject() });
        }

        return res.json({
            settings: {
                darkModeDefault: settings.darkModeDefault,
                compactMode: settings.compactMode,
                reducedMotion: settings.reducedMotion,
                showSidebarLabels: settings.showSidebarLabels,
                borderRadius: settings.borderRadius,
                siteName: settings.siteName,
                siteDescription: settings.siteDescription,
                universityName: settings.universityName,
                maintenanceMode: settings.maintenanceMode,
                maintenanceMessage: settings.maintenanceMessage,
                maintenanceStart: settings.maintenanceStart,
                maintenanceEnd: settings.maintenanceEnd,
            },
        });
    } catch (err) {
        console.error("GET /settings error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/settings  (admin only)
// ─────────────────────────────────────────────────────────────
router.put("/settings", adminMiddleware, async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        const body = sanitizeDateFields({ ...req.body });

        const allowedFields = [
            "siteName", "siteDescription", "contactEmail", "universityName",
            "darkModeDefault", "compactMode", "reducedMotion", "showSidebarLabels", "borderRadius",
            "emailNotifications", "adminAlerts", "newItemAlert", "newClaimAlert", "newUserAlert", "dailyDigest",
            "requireEmailVerification", "maxLoginAttempts", "lockoutDuration",
            "sessionTimeout", "passwordMinLength", "requireStrongPassword",
            "autoArchiveDays", "maxImageSize", "maxImagesPerItem", "itemsPerPage",
            "enableComments", "requireApproval",
            "maintenanceMode", "maintenanceMessage", "maintenanceStart", "maintenanceEnd",
        ];

        let hasUpdates = false;
        allowedFields.forEach((field) => {
            if (body[field] !== undefined) {
                settings[field] = body[field];
                hasUpdates = true;
            }
        });

        if (!hasUpdates) {
            return res.status(400).json({ message: "No valid fields to update" });
        }

        settings.updatedBy = req.user.id;
        await settings.save();

        res.json({ message: "Settings saved successfully", settings: settings.toObject() });
    } catch (err) {
        console.error("PUT /settings error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// POST /api/admin/settings/reset  (admin only)
// ─────────────────────────────────────────────────────────────
router.post("/settings/reset", adminMiddleware, async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        await Settings.deleteOne({ _id: settings._id });
        const newSettings = await Settings.create({ updatedBy: req.user.id });
        res.json({ message: "Settings reset to defaults", settings: newSettings.toObject() });
    } catch (err) {
        console.error("POST /settings/reset error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/stats  (fallback — no range filter)
// ─────────────────────────────────────────────────────────────
router.get("/stats", staffOrAdminMiddleware, async (req, res) => {
    try {
        const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [
            totalUsers, totalItems, lostItems, foundItems,
            claimedItems, pendingItems, students, faculty, staff,
            recentItems, itemsAtSAO, resolvedItems, newUsers,
            claimReqPending, finderPending
        ] = await Promise.all([
            User.countDocuments(),
            Item.countDocuments(),
            Item.countDocuments({ type: "lost" }),
            Item.countDocuments({ type: "found" }),
            Item.countDocuments({ status: "claimed" }),
            Item.countDocuments({ status: "active" }),
            User.countDocuments({ role: "student" }),
            User.countDocuments({ role: "faculty" }),
            User.countDocuments({ role: "staff" }),
            Item.countDocuments({ createdAt: { $gte: lastWeek } }),
            Item.countDocuments({ isAtSAO: true }),
            Item.countDocuments({ status: "resolved" }),
            User.countDocuments({ createdAt: { $gte: lastWeek } }),
            Claim.countDocuments({ type: "claim", status: "pending" }),
            Claim.countDocuments({ type: "finder_report", status: "pending" }),
        ]);

        res.json({
            overview: {
                totalUsers, totalItems, lostItems, foundItems,
                claimedItems, pendingItems, recentItems,
                itemsAtSAO, resolvedItems, newUsers,
            },
            claims: {
                claimReqPending,
                finderPending,
            },
            usersByRole: {
                students, faculty, staff,
                admin: totalUsers - students - faculty - staff,
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/stats/:range
//
// FIX 1: Accept both word-based ("today","week","month","year")
//         AND numeric ("1","7","30","365") range values so the
//         dashboard time-filter buttons actually work.
//
// FIX 2: Include usersByRole in the response so the User
//         Distribution widget is populated on every call, not
//         just on the fallback /stats endpoint.
// ─────────────────────────────────────────────────────────────
router.get("/stats/:range", staffOrAdminMiddleware, async (req, res) => {
    try {
        const { range } = req.params;
        const now = new Date();

        // ── Determine granularity ─────────────────────────────────────────
        let days, groupFormat, granularity;
        switch (range) {
            case "today": case "1": days = 1; groupFormat = "%Y-%m-%d"; granularity = "daily"; break;
            case "week": case "7": days = 7; groupFormat = "%Y-%m-%d"; granularity = "daily"; break;
            case "month": case "30": days = 30; groupFormat = "%Y-%m-%d"; granularity = "daily"; break;
            case "3months": case "90": days = 90; groupFormat = "%Y-%m-%d"; granularity = "weekly"; break;
            case "year": case "365": days = 365; groupFormat = "%Y-%m"; granularity = "monthly"; break;
            default: days = 7; groupFormat = "%Y-%m-%d"; granularity = "daily";
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // ── Lifetime totals (not range-filtered) ──────────────────────────
        const rangeFilter = { createdAt: { $gte: startDate, $lte: now } };

        const [
            totalUsers, totalItems, lostItems, foundItems,
            totalItemsInRange, itemsAtSAO, resolvedItems, newUsers
        ] = await Promise.all([
            User.countDocuments(),
            Item.countDocuments(),
            Item.countDocuments({ type: "lost", ...rangeFilter }),
            Item.countDocuments({ type: "found", ...rangeFilter }),
            Item.countDocuments(rangeFilter),
            Item.countDocuments({ isAtSAO: true }),
            Item.countDocuments({ status: "resolved" }),
            User.countDocuments(rangeFilter),
        ]);

        const claimDateFilter = rangeFilter;

        const [
            students, faculty, staff,
            claimReqPending, claimReqApproved, claimReqRejected, claimReqPickedUp, claimReqTotal,
            finderPending, finderApproved, finderRejected, finderPickedUp, finderTotal,
        ] = await Promise.all([
            User.countDocuments({ role: "student" }),
            User.countDocuments({ role: "faculty" }),
            User.countDocuments({ role: "staff" }),
            Claim.countDocuments({ ...claimDateFilter, type: "claim", status: "pending" }),
            Claim.countDocuments({ ...claimDateFilter, type: "claim", status: "approved" }),
            Claim.countDocuments({ ...claimDateFilter, type: "claim", status: "rejected" }),
            Claim.countDocuments({ ...claimDateFilter, type: "claim", status: "picked_up" }),
            Claim.countDocuments({ ...claimDateFilter, type: "claim" }),
            Claim.countDocuments({ ...claimDateFilter, type: "finder_report", status: "pending" }),
            Claim.countDocuments({ ...claimDateFilter, type: "finder_report", status: "approved" }),
            Claim.countDocuments({ ...claimDateFilter, type: "finder_report", status: "rejected" }),
            Claim.countDocuments({ ...claimDateFilter, type: "finder_report", status: "picked_up" }),
            Claim.countDocuments({ ...claimDateFilter, type: "finder_report" }),
        ]);

        // ── Item trends (range-filtered) ──────────────────────────────────
        const itemMatch = { createdAt: { $gte: startDate, $lte: now } };
        const trendData = await Item.aggregate([
            { $match: itemMatch },
            {
                $group: {
                    _id: { $dateToString: { format: groupFormat, date: "$createdAt", timezone: "UTC" } },
                    lost: { $sum: { $cond: [{ $eq: ["$type", "lost"] }, 1, 0] } },
                    found: { $sum: { $cond: [{ $eq: ["$type", "found"] }, 1, 0] } },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // ── Build chart data ──────────────────────────────────────────────
        const chartData = [];
        const labelMap = new Map(trendData.map(d => [d._id, d]));

        if (granularity === "daily") {
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const key = d.toISOString().split("T")[0];
                const display = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                const data = labelMap.get(key) || { lost: 0, found: 0 };
                chartData.push({ date: display, lost: data.lost, found: data.found });
            }
        } else if (granularity === "weekly") {
            // Build 12 weeks of data
            for (let i = 11; i >= 0; i--) {
                const now = new Date();
                // Get the Sunday of week i weeks ago
                const weekSunday = new Date(now);
                weekSunday.setDate(now.getDate() - (i * 7) - now.getDay());
                weekSunday.setHours(0, 0, 0, 0);

                // Get the Saturday of that week
                const weekSaturday = new Date(weekSunday);
                weekSaturday.setDate(weekSunday.getDate() + 6);
                weekSaturday.setHours(23, 59, 59, 999);

                // Calculate ISO week number
                const tmpDate = new Date(weekSunday);
                tmpDate.setHours(0, 0, 0, 0);
                tmpDate.setDate(tmpDate.getDate() + 3 - ((tmpDate.getDay() + 6) % 7));
                const week1 = new Date(tmpDate.getFullYear(), 0, 4);
                week1.setDate(week1.getDate() + 3 - ((week1.getDay() + 6) % 7));
                const weekNum = 1 + Math.ceil((tmpDate - week1) / 604800000);

                const display = `W${weekNum}`;

                // Sum all daily data points within this week
                const weekData = trendData.reduce((acc, curr) => {
                    // curr._id is "YYYY-MM-DD" from MongoDB $dateToString
                    const parts = curr._id.split("-");
                    const tDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    // tDate is local midnight, weekSunday is local midnight
                    if (tDate >= weekSunday && tDate <= weekSaturday) {
                        return { lost: acc.lost + (curr.lost || 0), found: acc.found + (curr.found || 0) };
                    }
                    return acc;
                }, { lost: 0, found: 0 });

                chartData.push({ date: display, lost: weekData.lost, found: weekData.found });
            }
        } else if (granularity === "monthly") {
            for (let i = 11; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const year = d.getFullYear();
                const month = (d.getMonth() + 1).toString().padStart(2, "0");
                const key = `${year}-${month}`;
                const display = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
                const data = labelMap.get(key) || { lost: 0, found: 0 };
                chartData.push({ date: display, lost: data.lost || 0, found: data.found || 0 });
            }
        }

        // ── Categories (range-filtered) ───────────────────────────────────
        const categories = await Item.aggregate([
            { $match: itemMatch },
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 6 },
        ]);

        res.json({
            overview: {
                totalUsers,
                totalItems,
                totalItemsInRange,
                lostItems,
                foundItems,
                itemsAtSAO,
                resolvedItems,
                newUsers,
            },
            claims: {
                // Claim Requests
                claimReqPending,
                claimReqApproved,
                claimReqRejected,
                claimReqPickedUp,
                claimReqTotal,
                claimReqApprovalRate: (claimReqApproved + claimReqPickedUp + claimReqRejected) > 0 ? Math.round(((claimReqApproved + claimReqPickedUp) / (claimReqApproved + claimReqPickedUp + claimReqRejected)) * 100) : 0,
                claimReqPickupRate: (claimReqApproved + claimReqPickedUp) > 0 ? Math.round((claimReqPickedUp / (claimReqApproved + claimReqPickedUp)) * 100) : 0,
                // Finder Reports
                finderPending,
                finderApproved,
                finderRejected,
                finderPickedUp,
                finderTotal,
                finderResolutionRate: (finderPickedUp + finderRejected) > 0 ? Math.round((finderPickedUp / (finderPickedUp + finderRejected)) * 100) : 0,
            },
            usersByRole: {
                students, faculty, staff,
                admin: totalUsers - students - faculty - staff,
            },
            chartData,
            categories: categories.map(c => ({ _id: c._id || "Uncategorized", count: c.count })),
            timeRange: range,
            periodStart: startDate,
            periodEnd: now,
        });
    } catch (err) {
        console.error("Stats range error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────────────────────
router.get("/users", adminMiddleware, async (req, res) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.post("/users/create", adminMiddleware, async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required." });
        }
        const allowedRoles = ["staff", "admin"];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: "Only staff or admin accounts can be created manually." });
        }
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: "An account with this email already exists." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            isVerified: true,
        });
        const { password: _, ...userData } = user.toObject();
        res.status(201).json(userData);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.put("/users/:id", adminMiddleware, async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }
        const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.put("/users/:id/role", adminMiddleware, async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.delete("/users/:id", adminMiddleware, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// Items
// ─────────────────────────────────────────────────────────────
router.get("/items", staffOrAdminMiddleware, async (req, res) => {
    try {
        const { status, type, search } = req.query;
        let query = {};
        if (status) query.status = status;
        if (type) query.type = type;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }
        const items = await Item.find(query)
            .populate("reportedBy", "name email role avatar")
            .populate("claimedBy", "name email")
            .populate("currentClaim", "status createdAt")
            .sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.put("/items/:id/status", staffOrAdminMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const item = await Item.findByIdAndUpdate(req.params.id, { status }, { new: true })
            .populate("reportedBy", "name email");
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.delete("/items/:id", staffOrAdminMiddleware, async (req, res) => {
    try {
        await Claim.deleteMany({ item: req.params.id });
        await Item.findByIdAndDelete(req.params.id);
        res.json({ message: "Item and associated claims deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.patch("/items/:id/sao-status", staffOrAdminMiddleware, async (req, res) => {
    try {
        const { isAtSAO } = req.body;
        if (typeof isAtSAO !== "boolean") {
            return res.status(400).json({ message: "isAtSAO must be a boolean" });
        }

        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: "Item not found" });

        if (!isAtSAO) {
            const approvedClaim = await Claim.findOne({ item: req.params.id, status: "approved" });
            if (approvedClaim) {
                return res.status(400).json({
                    message: "Cannot remove SAO status — a claim has already been approved for this item."
                });
            }
        }

        item.isAtSAO = isAtSAO;
        item.isAtSAOUpdatedAt = new Date();
        await item.save();

        // Notify watchers when item arrives at SAO
        if (isAtSAO && item.watchers && item.watchers.length > 0) {
            await User.updateMany(
                { _id: { $in: item.watchers } },
                {
                    $push: {
                        notifications: {
                            type: "item_available",
                            itemId: item._id,
                            itemTitle: item.title,
                            message: `"${item.title}" is now at the SAO and available to claim!`,
                            read: false,
                            createdAt: new Date()
                        }
                    }
                }
            );
        }

        await item.populate("reportedBy", "name email");
        res.json({ message: `Item marked as ${isAtSAO ? "at SAO" : "not at SAO"}`, item });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// Notifications, Search, Reports
// ─────────────────────────────────────────────────────────────
router.get("/badge-counts", staffOrAdminMiddleware, async (req, res) => {
    try {
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const [pendingClaims, newItems] = await Promise.all([
            Claim.countDocuments({ status: "pending" }),
            Item.countDocuments({ createdAt: { $gte: last24Hours } })
        ]);
        res.json({ pendingClaims, newItems });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.get("/notifications", adminMiddleware, async (req, res) => {
    try {
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [newItems, newUsers, activeItems, lostItems] = await Promise.all([
            Item.countDocuments({ createdAt: { $gte: last24Hours } }),
            User.countDocuments({ createdAt: { $gte: lastWeek } }),
            Item.countDocuments({ status: "active" }),
            Item.countDocuments({ type: "lost", status: "active" }),
        ]);

        const notifications = [
            ...(newItems > 0 ? [{ id: 1, type: "items", message: `${newItems} new item${newItems > 1 ? "s" : ""} reported today`, date: new Date(), read: false }] : []),
            ...(newUsers > 0 ? [{ id: 2, type: "users", message: `${newUsers} new user${newUsers > 1 ? "s" : ""} this week`, date: new Date(Date.now() - 86400000), read: false }] : []),
            ...(activeItems > 0 ? [{ id: 3, type: "claims", message: `${activeItems} active item${activeItems > 1 ? "s" : ""} need attention`, date: new Date(), read: false }] : []),
            ...(lostItems > 0 ? [{ id: 4, type: "lost", message: `${lostItems} lost item${lostItems > 1 ? "s" : ""} awaiting resolution`, date: new Date(Date.now() - 172800000), read: true }] : []),
        ];

        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.get("/search", adminMiddleware, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) return res.json({ users: [], items: [] });

        const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const searchRegex = new RegExp(escapedQ, "i");

        const users = await User.find({
            $or: [{ name: searchRegex }, { email: searchRegex }],
        }).select("-password").limit(5);

        const items = await Item.find({
            $or: [{ title: searchRegex }, { description: searchRegex }, { location: searchRegex }],
        }).populate("reportedBy", "name email").limit(5);

        res.json({ users, items });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.get("/reports", adminMiddleware, async (req, res) => {
    try {
        const { period } = req.query;

        let startDate = new Date();
        let groupBy = {};

        if (period === "daily") {
            startDate.setDate(startDate.getDate() - 30);
            groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        } else if (period === "weekly") {
            startDate.setDate(startDate.getDate() - 84);
            groupBy = { $dateToString: { format: "%Y-W%U", date: "$createdAt" } };
        } else if (period === "monthly") {
            startDate.setMonth(startDate.getMonth() - 12);
            groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
        }

        const itemsTrend = await Item.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: groupBy,
                    lost: { $sum: { $cond: [{ $eq: ["$type", "lost"] }, 1, 0] } },
                    found: { $sum: { $cond: [{ $eq: ["$type", "found"] }, 1, 0] } },
                    claimed: { $sum: { $cond: [{ $eq: ["$status", "claimed"] }, 1, 0] } },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const categories = await Item.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        const locations = await Item.aggregate([
            { $group: { _id: "$location", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);

        res.json({
            period,
            itemsTrend,
            categories,
            locations,
            summary: {
                totalInPeriod: itemsTrend.reduce((acc, curr) => acc + curr.lost + curr.found, 0),
                claimedInPeriod: itemsTrend.reduce((acc, curr) => acc + curr.claimed, 0),
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// Announcements
// ─────────────────────────────────────────────────────────────

// GET all announcements
router.get("/announcements", async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        res.json(settings.announcements || []);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// POST create announcement
router.post("/announcements", staffOrAdminMiddleware, async (req, res) => {
    try {
        const { title, message, type } = req.body;
        if (!title?.trim() || !message?.trim()) {
            return res.status(400).json({ message: "Title and message are required." });
        }
        const settings = await Settings.getSettings();
        settings.announcements.push({ title: title.trim(), message: message.trim(), type: type || "info" });
        await settings.save();
        res.status(201).json(settings.announcements);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// PUT toggle or update announcement
router.put("/announcements/:announcementId", staffOrAdminMiddleware, async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        const ann = settings.announcements.id(req.params.announcementId);
        if (!ann) return res.status(404).json({ message: "Announcement not found" });
        const { title, message, type, isActive } = req.body;
        if (title !== undefined) ann.title = title;
        if (message !== undefined) ann.message = message;
        if (type !== undefined) ann.type = type;
        if (isActive !== undefined) ann.isActive = isActive;
        await settings.save();
        res.json(settings.announcements);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// DELETE announcement
router.delete("/announcements/:announcementId", staffOrAdminMiddleware, async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        settings.announcements = settings.announcements.filter(
            a => a._id.toString() !== req.params.announcementId
        );
        await settings.save();
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────

// GET /api/admin/categories — public-ish, used by dropdowns
router.get("/categories", async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).sort({ order: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// GET /api/admin/categories/all — admin sees inactive ones too
router.get("/categories/all", staffOrAdminMiddleware, async (req, res) => {
    try {
        const categories = await Category.find().sort({ order: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// POST /api/admin/categories — create new category
router.post("/categories", staffOrAdminMiddleware, async (req, res) => {
    try {
        const { name, value, order } = req.body;
        if (!name || !value) {
            return res.status(400).json({ message: "Name and value are required" });
        }
        const existing = await Category.findOne({
            $or: [{ name }, { value }],
        });
        if (existing) {
            return res.status(400).json({ message: "Category with that name or value already exists" });
        }
        const lastCat = await Category.findOne().sort({ order: -1 });
        const newOrder = order ?? (lastCat ? lastCat.order + 1 : 1);
        const category = await Category.create({ name, value, order: newOrder });
        res.status(201).json(category);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// PUT /api/admin/categories/:id — update name, value, order, or isActive
router.put("/categories/:id", staffOrAdminMiddleware, async (req, res) => {
    try {
        const { name, value, order, isActive } = req.body;
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: "Category not found" });

        if (name !== undefined) category.name = name;
        if (value !== undefined) category.value = value;
        if (order !== undefined) category.order = order;
        if (isActive !== undefined) category.isActive = isActive;

        await category.save();
        res.json(category);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// DELETE /api/admin/categories/:id
router.delete("/categories/:id", staffOrAdminMiddleware, async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ message: "Category not found" });
        res.json({ message: "Category deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;