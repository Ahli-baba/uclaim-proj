const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Item = require("../models/Item");
const adminMiddleware = require("../middleware/admin");
const Settings = require("../models/Settings");

// ─────────────────────────────────────────────────────────────
// HELPER: convert empty string → null for Date fields
// Without this, Mongoose throws a CastError when the frontend
// sends maintenanceStart / maintenanceEnd as "" (empty string).
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
// Public-ish: authMiddleware (in index.js) already ran and set
// req.user.  We just check the role here — no need to re-decode
// the JWT manually.
// ─────────────────────────────────────────────────────────────
router.get("/settings", async (req, res) => {
    try {
        const settings = await Settings.getSettings();

        // req.user is already populated by authMiddleware in index.js
        const isAdmin = req.user && req.user.role === "admin";

        if (isAdmin) {
            // Return FULL settings to admin
            return res.json({ settings: settings.toObject() });
        }

        // Return only public settings for regular users / unauthenticated
        return res.json({
            settings: {
                // Appearance
                darkModeDefault: settings.darkModeDefault,
                compactMode: settings.compactMode,
                reducedMotion: settings.reducedMotion,
                showSidebarLabels: settings.showSidebarLabels,
                borderRadius: settings.borderRadius,

                // General (safe to expose)
                siteName: settings.siteName,
                siteDescription: settings.siteDescription,
                universityName: settings.universityName,

                // Maintenance (frontend needs this to show maintenance page)
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

        // Sanitize date fields BEFORE touching the document
        const body = sanitizeDateFields({ ...req.body });

        const allowedFields = [
            // General
            "siteName", "siteDescription", "contactEmail", "universityName",
            // Appearance
            "darkModeDefault", "compactMode", "reducedMotion", "showSidebarLabels", "borderRadius",
            // Notifications
            "emailNotifications", "adminAlerts", "newItemAlert", "newClaimAlert", "newUserAlert", "dailyDigest",
            // Security
            "requireEmailVerification", "maxLoginAttempts", "lockoutDuration",
            "sessionTimeout", "passwordMinLength", "requireStrongPassword",
            // System
            "autoArchiveDays", "maxImageSize", "maxImagesPerItem", "itemsPerPage",
            "enableComments", "requireApproval",
            // Maintenance
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

        console.log(
            "Settings updated by admin:",
            req.user.id,
            "| Fields:",
            Object.keys(req.body).join(", ")
        );

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

        console.log("Settings reset by admin:", req.user.id);
        res.json({ message: "Settings reset to defaults", settings: newSettings.toObject() });
    } catch (err) {
        console.error("POST /settings/reset error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// Everything below is unchanged — stats, users, items, etc.
// ─────────────────────────────────────────────────────────────

router.get("/stats", adminMiddleware, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalItems = await Item.countDocuments();
        const lostItems = await Item.countDocuments({ type: "lost" });
        const foundItems = await Item.countDocuments({ type: "found" });
        const claimedItems = await Item.countDocuments({ status: "claimed" });
        const pendingItems = await Item.countDocuments({ status: "active" });

        const students = await User.countDocuments({ role: "student" });
        const faculty = await User.countDocuments({ role: "faculty" });
        const staff = await User.countDocuments({ role: "staff" });

        const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentItems = await Item.countDocuments({ createdAt: { $gte: lastWeek } });

        res.json({
            overview: {
                totalUsers, totalItems, lostItems, foundItems,
                claimedItems, pendingItems, recentItems,
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

router.get("/stats/:range", adminMiddleware, async (req, res) => {
    try {
        const { range } = req.params;
        const now = new Date();

        let days = 7;
        switch (range) {
            case "7": days = 7; break;
            case "30": days = 30; break;
            case "90": days = 90; break;
            case "365": days = 365; break;
            default: days = 7;
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const totalUsers = await User.countDocuments();
        const totalItems = await Item.countDocuments();
        const lostItems = await Item.countDocuments({ type: "lost" });
        const foundItems = await Item.countDocuments({ type: "found" });
        const totalClaimed = await Item.countDocuments({ status: "claimed" });
        const activeItems = await Item.countDocuments({ status: "active" });

        const newItems = await Item.countDocuments({ createdAt: { $gte: startDate, $lte: now } });
        const newUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: now } });

        const dailyData = await Item.aggregate([
            { $match: { createdAt: { $gte: startDate, $lte: now } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    lost: { $sum: { $cond: [{ $eq: ["$type", "lost"] }, 1, 0] } },
                    found: { $sum: { $cond: [{ $eq: ["$type", "found"] }, 1, 0] } },
                    claimed: { $sum: { $cond: [{ $eq: ["$status", "claimed"] }, 1, 0] } },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const chartData = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split("T")[0];
            const displayDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const dayData = dailyData.find((item) => item._id === dateStr) || { lost: 0, found: 0, claimed: 0 };
            chartData.push({ date: displayDate, lost: dayData.lost, found: dayData.found, claimed: dayData.claimed });
        }

        res.json({
            overview: {
                totalUsers, totalItems, lostItems, foundItems,
                claimedItems: totalClaimed, pendingItems: activeItems,
                recentItems: newItems, newUsers,
            },
            chartData,
            timeRange: range,
            periodStart: startDate,
            periodEnd: now,
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.get("/users", adminMiddleware, async (req, res) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });
        res.json(users);
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

router.get("/items", adminMiddleware, async (req, res) => {
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
            .populate("reportedBy", "name email role")
            .populate("claimedBy", "name email")
            .populate("currentClaim", "status createdAt")
            .sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.put("/items/:id/status", adminMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const item = await Item.findByIdAndUpdate(req.params.id, { status }, { new: true })
            .populate("reportedBy", "name email");
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.delete("/items/:id", adminMiddleware, async (req, res) => {
    try {
        await Item.findByIdAndDelete(req.params.id);
        res.json({ message: "Item deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ✅ PATCH /api/admin/items/:id/sao-status — toggle isAtSAO (admin only)
router.patch("/items/:id/sao-status", adminMiddleware, async (req, res) => {
    try {
        const { isAtSAO } = req.body;
        if (typeof isAtSAO !== "boolean") {
            return res.status(400).json({ message: "isAtSAO must be a boolean" });
        }
        const item = await Item.findByIdAndUpdate(
            req.params.id,
            {
                isAtSAO,
                isAtSAOUpdatedAt: new Date()
            },
            { new: true }
        ).populate("reportedBy", "name email");
        if (!item) return res.status(404).json({ message: "Item not found" });
        res.json({ message: `Item marked as ${isAtSAO ? "at SAO" : "not at SAO"}`, item });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.get("/notifications", adminMiddleware, async (req, res) => {
    try {
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const newItems = await Item.countDocuments({ createdAt: { $gte: last24Hours } });
        const newUsers = await User.countDocuments({ createdAt: { $gte: lastWeek } });
        const activeItems = await Item.countDocuments({ status: "active" });
        const lostItems = await Item.countDocuments({ type: "lost", status: "active" });

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

        const searchRegex = new RegExp(q, "i");

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

module.exports = router;