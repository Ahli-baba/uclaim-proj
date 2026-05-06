const express = require("express");
const router = express.Router();
const User = require("../models/User");
const adminMiddleware = require("../middleware/admin");
const Settings = require("../models/Settings");
const Item = require("../models/Item");
const Claim = require("../models/Claim");
const Category = require("../models/Category");

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
router.get("/stats/:range", adminMiddleware, async (req, res) => {
    try {
        const { range } = req.params;
        const now = new Date();

        // ✅ FIX 1 — accept word and numeric range values
        let days = 7;
        switch (range) {
            case "today": case "1": days = 1; break;
            case "week": case "7": days = 7; break;
            case "month": case "30": days = 30; break;
            case "year": case "365": days = 365; break;
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

        // ✅ FIX 2 — fetch role breakdown so User Distribution renders
        const students = await User.countDocuments({ role: "student" });
        const faculty = await User.countDocuments({ role: "faculty" });
        const staff = await User.countDocuments({ role: "staff" });

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
            // ✅ FIX 2 — now included in every ranged response
            usersByRole: {
                students, faculty, staff,
                admin: totalUsers - students - faculty - staff,
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
        await Claim.deleteMany({ item: req.params.id });
        await Item.findByIdAndDelete(req.params.id);
        res.json({ message: "Item and associated claims deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.patch("/items/:id/sao-status", adminMiddleware, async (req, res) => {
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

// ─────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────

// GET /api/admin/categories — public-ish, used by dropdowns
router.get("/categories", async (req, res) => {
    try {
        await Category.seedDefaults();
        const categories = await Category.find({ isActive: true }).sort({ order: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// GET /api/admin/categories/all — admin sees inactive ones too
router.get("/categories/all", adminMiddleware, async (req, res) => {
    try {
        await Category.seedDefaults();
        const categories = await Category.find().sort({ order: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// POST /api/admin/categories — create new category
router.post("/categories", adminMiddleware, async (req, res) => {
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
router.put("/categories/:id", adminMiddleware, async (req, res) => {
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
router.delete("/categories/:id", adminMiddleware, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: "Category not found" });
        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: "Category deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;