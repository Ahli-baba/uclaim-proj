const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Item = require("../models/Item");
const adminMiddleware = require("../middleware/admin");

// Settings Management - MUST BE BEFORE OTHER /admin routes
let adminSettings = {}; // In-memory storage (use database in production)

// GET settings
router.get("/settings", adminMiddleware, async (req, res) => {
    try {
        res.json({ settings: adminSettings });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// PUT settings - update
router.put("/settings", adminMiddleware, async (req, res) => {
    try {
        // Merge existing settings with new ones
        adminSettings = { ...adminSettings, ...req.body };
        console.log("Settings updated:", adminSettings);
        res.json({ message: "Settings saved successfully", settings: adminSettings });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// POST reset - must be after PUT to avoid conflict
router.post("/settings/reset", adminMiddleware, async (req, res) => {
    try {
        adminSettings = {};
        console.log("Settings reset");
        res.json({ message: "Settings reset to defaults", settings: adminSettings });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Get dashboard statistics (original - for backward compatibility)
router.get("/stats", adminMiddleware, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalItems = await Item.countDocuments();
        const lostItems = await Item.countDocuments({ type: "lost" });
        const foundItems = await Item.countDocuments({ type: "found" });
        const claimedItems = await Item.countDocuments({ status: "claimed" });
        const pendingItems = await Item.countDocuments({ status: "active" });

        // Users by role
        const students = await User.countDocuments({ role: "student" });
        const faculty = await User.countDocuments({ role: "faculty" });
        const staff = await User.countDocuments({ role: "staff" });

        // Recent activity (last 7 days)
        const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentItems = await Item.countDocuments({ createdAt: { $gte: lastWeek } });

        res.json({
            overview: {
                totalUsers,
                totalItems,
                lostItems,
                foundItems,
                claimedItems,
                pendingItems,
                recentItems
            },
            usersByRole: {
                students,
                faculty,
                staff,
                admin: totalUsers - students - faculty - staff
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Get stats by time range with REAL daily chart data
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

        // Get total counts (overall)
        const totalUsers = await User.countDocuments();
        const totalItems = await Item.countDocuments();
        const lostItems = await Item.countDocuments({ type: "lost" });
        const foundItems = await Item.countDocuments({ type: "found" });
        const totalClaimed = await Item.countDocuments({ status: "claimed" });
        const activeItems = await Item.countDocuments({ status: "active" });

        // Get new items/users in this period
        const newItems = await Item.countDocuments({
            createdAt: { $gte: startDate, $lte: now }
        });
        const newUsers = await User.countDocuments({
            createdAt: { $gte: startDate, $lte: now }
        });

        // Get REAL daily data for chart (grouped by date)
        const dailyData = await Item.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: now }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    lost: { $sum: { $cond: [{ $eq: ["$type", "lost"] }, 1, 0] } },
                    found: { $sum: { $cond: [{ $eq: ["$type", "found"] }, 1, 0] } },
                    claimed: { $sum: { $cond: [{ $eq: ["$status", "claimed"] }, 1, 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill in missing dates with zeros
        const chartData = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            const dayData = dailyData.find(item => item._id === dateStr) || {
                lost: 0,
                found: 0,
                claimed: 0
            };

            chartData.push({
                date: displayDate,
                lost: dayData.lost,
                found: dayData.found,
                claimed: dayData.claimed
            });
        }

        res.json({
            overview: {
                totalUsers,
                totalItems,
                lostItems,
                foundItems,
                claimedItems: totalClaimed,
                pendingItems: activeItems,
                recentItems: newItems,
                newUsers: newUsers
            },
            chartData,
            timeRange: range,
            periodStart: startDate,
            periodEnd: now
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Get all users
router.get("/users", adminMiddleware, async (req, res) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Update user role
router.put("/users/:id/role", adminMiddleware, async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select("-password");
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Delete user
router.delete("/users/:id", adminMiddleware, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Get all items (with filters)
router.get("/items", adminMiddleware, async (req, res) => {
    try {
        const { status, type, search } = req.query;
        let query = {};

        if (status) query.status = status;
        if (type) query.type = type;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
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

// Update item status (admin override)
router.put("/items/:id/status", adminMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const item = await Item.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate("reportedBy", "name email");
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Delete item
router.delete("/items/:id", adminMiddleware, async (req, res) => {
    try {
        await Item.findByIdAndDelete(req.params.id);
        res.json({ message: "Item deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// GET admin notifications (system-wide)
router.get("/notifications", adminMiddleware, async (req, res) => {
    try {
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const newItems = await Item.countDocuments({ createdAt: { $gte: last24Hours } });
        const newUsers = await User.countDocuments({ createdAt: { $gte: lastWeek } });
        const activeItems = await Item.countDocuments({ status: "active" });
        const lostItems = await Item.countDocuments({ type: "lost", status: "active" });

        const notifications = [
            ...(newItems > 0 ? [{
                id: 1,
                type: "items",
                message: `${newItems} new item${newItems > 1 ? 's' : ''} reported today`,
                date: new Date(),
                read: false
            }] : []),
            ...(newUsers > 0 ? [{
                id: 2,
                type: "users",
                message: `${newUsers} new user${newUsers > 1 ? 's' : ''} this week`,
                date: new Date(Date.now() - 86400000),
                read: false
            }] : []),
            ...(activeItems > 0 ? [{
                id: 3,
                type: "claims",
                message: `${activeItems} active item${activeItems > 1 ? 's' : ''} need attention`,
                date: new Date(),
                read: false
            }] : []),
            ...(lostItems > 0 ? [{
                id: 4,
                type: "lost",
                message: `${lostItems} lost item${lostItems > 1 ? 's' : ''} awaiting resolution`,
                date: new Date(Date.now() - 172800000),
                read: true
            }] : [])
        ];

        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Global Search (Users + Items)
router.get("/search", adminMiddleware, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json({ users: [], items: [] });
        }

        const searchRegex = new RegExp(q, 'i');

        const users = await User.find({
            $or: [
                { name: searchRegex },
                { email: searchRegex }
            ]
        }).select("-password").limit(5);

        const items = await Item.find({
            $or: [
                { title: searchRegex },
                { description: searchRegex },
                { location: searchRegex }
            ]
        }).populate("reportedBy", "name email").limit(5);

        res.json({ users, items });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Get reports data
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
                    claimed: { $sum: { $cond: [{ $eq: ["$status", "claimed"] }, 1, 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const categories = await Item.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const locations = await Item.aggregate([
            { $group: { _id: "$location", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            period,
            itemsTrend,
            categories,
            locations,
            summary: {
                totalInPeriod: itemsTrend.reduce((acc, curr) => acc + curr.lost + curr.found, 0),
                claimedInPeriod: itemsTrend.reduce((acc, curr) => acc + curr.claimed, 0)
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;