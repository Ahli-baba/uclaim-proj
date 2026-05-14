const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Item = require('../models/Item');
const Claim = require("../models/Claim");
const { authMiddleware } = require("../middleware/auth");
const { staffOrAdminMiddleware } = require("../middleware/admin");

// 🔥 HELPER: Check if string is valid MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ==========================================
// EXISTING ROUTES (keep all your current ones)
// ==========================================

// CREATE item (Protected)
router.post("/add", authMiddleware, async (req, res) => {
    try {
        const Settings = require("../models/Settings");
        const settings = await Settings.getSettings();
        const images = req.body.images || [];

        if (images.length > settings.maxImagesPerItem) {
            return res.status(400).json({
                message: `Maximum ${settings.maxImagesPerItem} images allowed per item.`
            });
        }

        const newItem = new Item({
            ...req.body,
            reportedBy: req.user.id
        });
        await newItem.save();
        res.status(201).json(newItem);
    } catch (err) {
        console.error("Add item error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Stats endpoint — USER-SPECIFIC with optional period filter
router.get("/stats/dashboard", authMiddleware, async (req, res) => {
    try {
        const { period } = req.query;
        const userId = req.user.id;

        let dateFilter = {};
        if (period && period !== "all") {
            const now = new Date();
            let startDate = new Date(now);
            if (period === "today") {
                startDate.setHours(0, 0, 0, 0);
            } else if (period === "week") {
                startDate.setDate(startDate.getDate() - startDate.getDay());
                startDate.setHours(0, 0, 0, 0);
            } else if (period === "month") {
                startDate.setDate(1);
                startDate.setHours(0, 0, 0, 0);
            }
            dateFilter = { createdAt: { $gte: startDate } };
        }

        const [lost, found, resolvedPosts, resolvedClaims, resolvedFinds, awaitingClaims, awaitingFinds] = await Promise.all([
            Item.countDocuments({ reportedBy: userId, ...dateFilter, type: "lost", status: "active" }),
            Item.countDocuments({ reportedBy: userId, ...dateFilter, type: "found", status: "active" }),
            Item.countDocuments({ reportedBy: userId, status: { $in: ["claimed", "resolved"] } }),
            Claim.countDocuments({ claimant: userId, type: { $ne: "finder_report" }, status: "picked_up" }),
            Claim.countDocuments({ claimant: userId, type: "finder_report", status: "picked_up" }),
            Claim.countDocuments({ claimant: userId, type: { $ne: "finder_report" }, status: "pending" }),
            Claim.countDocuments({ claimant: userId, type: "finder_report", status: "pending" }),
        ]);

        res.json({
            lost,
            found,
            resolved: resolvedPosts + resolvedClaims + resolvedFinds,
            awaitingReview: awaitingClaims + awaitingFinds
        });
    } catch (err) {
        console.error("Dashboard stats error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Recent items endpoint — USER-SPECIFIC with optional period filter
router.get("/recent", authMiddleware, async (req, res) => {
    try {
        const { period } = req.query;
        const userId = req.user.id;

        let dateFilter = {};
        if (period && period !== "all") {
            const now = new Date();
            let startDate = new Date(now);
            if (period === "today") {
                startDate.setHours(0, 0, 0, 0);
            } else if (period === "week") {
                startDate.setDate(startDate.getDate() - startDate.getDay());
                startDate.setHours(0, 0, 0, 0);
            } else if (period === "month") {
                startDate.setDate(1);
                startDate.setHours(0, 0, 0, 0);
            }
            dateFilter = { createdAt: { $gte: startDate } };
        }

        const items = await Item.find({ reportedBy: userId, ...dateFilter })
            .populate("reportedBy", "name email")
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        const activities = items.map(item => ({
            id: item._id,
            title: item.title,
            type: item.type?.toLowerCase() || "lost",
            location: item.location || "Unknown location",
            status: item.status?.toLowerCase() || "active",
            user: item.reportedBy?.name || "Unknown",
            date: item.createdAt,
            images: item.images || [],
            image: item.images && item.images.length > 0 ? item.images[0] : null,
            category: item.category || "Uncategorized"
        }));

        res.json(activities);
    } catch (err) {
        console.error("Recent activity error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Get all items (Public)
router.get("/all", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            Item.find()
                .populate("reportedBy", "name email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Item.countDocuments()
        ]);

        res.json({ items, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        console.error("Get items error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Get single item by ID (Public)
router.get("/:id", async (req, res, next) => {
    if (!isValidObjectId(req.params.id)) return next();
    try {
        const item = await Item.findById(req.params.id)
            .populate("reportedBy", "name email")
            .populate("claimedBy", "name email");
        if (!item) return res.status(404).json({ message: "Item not found" });
        res.json(item);
    } catch (err) {
        console.error("Get item error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ==========================================
// ✅ NEW: UPDATE item (owner only)
// ==========================================
router.put("/:id", authMiddleware, async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid item ID" });
    }

    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: "Item not found" });

        // Only the owner can edit
        if (item.reportedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to edit this item" });
        }

        // Only allow editing these fields (status/type not editable here for safety)
        const { title, description, location, category, date, images } = req.body;

        if (title !== undefined) item.title = title.trim();
        if (description !== undefined) item.description = description;
        if (location !== undefined) item.location = location;
        if (category !== undefined) item.category = category;
        if (date !== undefined) item.date = new Date(date);
        if (images !== undefined) {
            const Settings = require("../models/Settings");
            const settings = await Settings.getSettings();
            if (images.length > settings.maxImagesPerItem) {
                return res.status(400).json({
                    message: `Maximum ${settings.maxImagesPerItem} images allowed per item.`
                });
            }
            item.images = images;
        }

        const updated = await item.save();
        await updated.populate("reportedBy", "name email avatar");

        res.json(updated);
    } catch (err) {
        console.error("Update item error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ==========================================
// ✅ NEW: DELETE item (owner only)
// ==========================================
router.delete("/:id", authMiddleware, async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid item ID" });
    }

    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: "Item not found" });

        // Only the owner can delete
        if (item.reportedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to delete this item" });
        }

        // Delete all associated claims first
        await Claim.deleteMany({ item: req.params.id });

        // Delete the item
        await item.deleteOne();

        res.json({ message: "Item and all associated claims deleted successfully" });
    } catch (err) {
        console.error("Delete item error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ==========================================
// EXISTING CLAIM ROUTES
// ==========================================

// Update item status (Protected)
router.patch("/:id/status", authMiddleware, async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid item ID" });
    }

    try {
        const { status } = req.body;
        const validStatuses = ["active", "claimed", "resolved"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const item = await Item.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!item) return res.status(404).json({ message: "Item not found" });
        res.json(item);
    } catch (err) {
        console.error("Update status error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Check if user has already claimed a specific item
router.get("/:id/claim/status", authMiddleware, async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid item ID" });
    }
    try {
        const claim = await Claim.findOne({ item: req.params.id, claimant: req.user.id }).select("status");
        res.json({ hasClaimed: !!claim, status: claim?.status || null });
    } catch (err) {
        console.error("Check claim status error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Get claims for a specific item (for item owner)
router.get("/:id/claims", authMiddleware, async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid item ID" });
    }
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: "Item not found" });
        if (item.reportedBy.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to view these claims" });
        }
        const claims = await Claim.find({ item: req.params.id })
            .populate("claimant", "name email")
            .sort({ createdAt: -1 })
            .lean();
        res.json(claims);
    } catch (err) {
        console.error("Get item claims error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ==========================================
// WATCH / UNWATCH a found item
// ==========================================

// Toggle watch status
router.post("/:id/watch", authMiddleware, async (req, res) => {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid item ID" });
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: "Item not found" });

        const userId = req.user.id;
        const isWatching = item.watchers.some(w => w.toString() === userId);

        if (isWatching) {
            item.watchers = item.watchers.filter(w => w.toString() !== userId);
        } else {
            item.watchers.push(userId);
        }
        await item.save();
        res.json({ watching: !isWatching });
    } catch (err) {
        console.error("Watch toggle error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Get watch status for current user on a specific item
router.get("/:id/watch", authMiddleware, async (req, res) => {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid item ID" });
    try {
        const item = await Item.findById(req.params.id).select("watchers");
        if (!item) return res.status(404).json({ message: "Item not found" });
        const watching = item.watchers.some(w => w.toString() === req.user.id);
        res.json({ watching });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ==========================================
// USER DB NOTIFICATIONS
// ==========================================

// Get current user's DB notifications
router.get("/user/db-notifications", authMiddleware, async (req, res) => {
    try {
        const User = require("../models/User");
        const user = await User.findById(req.user.id).select("notifications");
        if (!user) return res.status(404).json({ message: "User not found" });
        const sorted = [...user.notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(sorted);
    } catch (err) {
        console.error("Get DB notifications error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Mark all DB notifications as read
router.patch("/user/db-notifications/read", authMiddleware, async (req, res) => {
    try {
        const User = require("../models/User");
        await User.findByIdAndUpdate(req.user.id, {
            $set: { "notifications.$[].read": true }
        });
        res.json({ success: true });
    } catch (err) {
        console.error("Mark notifications read error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Update SAO status (Staff only)
router.patch("/:id/sao-status", staffOrAdminMiddleware, async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid item ID" });
    }
    try {
        const { isAtSAO } = req.body;
        const User = require("../models/User");
        const { sendItemAtSAOEmail } = require("../utils/emailService");

        // Fetch BEFORE update so we can check if this is a new toggle
        const existingItem = await Item.findById(req.params.id)
            .populate("watchers", "name email");

        if (!existingItem) return res.status(404).json({ message: "Item not found" });

        const wasAlreadyAtSAO = existingItem.isAtSAO;

        const item = await Item.findByIdAndUpdate(
            req.params.id,
            { isAtSAO, isAtSAOUpdatedAt: new Date() },
            { new: true }
        );

        // Only notify if this is a fresh "At SAO" toggle (not a re-toggle)
        if (isAtSAO && !wasAlreadyAtSAO && existingItem.watchers.length > 0) {
            await Promise.all(existingItem.watchers.map(async (watcher) => {
                await User.findByIdAndUpdate(watcher._id, {
                    $push: {
                        notifications: {
                            message: `"${item.title}" is now at the SAO and available to claim!`,
                            type: "item_at_sao",
                            itemId: item._id,
                            itemTitle: item.title,
                            read: false,
                            createdAt: new Date()
                        }
                    }
                });

                if (watcher.email) {
                    sendItemAtSAOEmail(
                        watcher.email,
                        watcher.name,
                        item.title,
                        null,
                        item.saoPickupDeadline
                    ).catch(err =>
                        console.error(`SAO email failed for ${watcher.email}:`, err)
                    );
                }
            }));
            console.log(`✅ Notified ${existingItem.watchers.length} watcher(s) that "${item.title}" is now at SAO`);
        }

        res.json(item);
    } catch (err) {
        console.error("SAO status update error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});
// ==========================================
// NOTIFY OWNER (Staff only)
// ==========================================
router.post("/:id/notify-owner", staffOrAdminMiddleware, async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid item ID" });
    }
    try {
        const User = require("../models/User");
        const { sendItemFoundNotificationEmail } = require("../utils/emailService");

        const item = await Item.findById(req.params.id).populate("reportedBy", "name email");
        if (!item) return res.status(404).json({ message: "Item not found" });
        if (item.type !== "lost") return res.status(400).json({ message: "Can only notify owner of lost items" });

        const owner = item.reportedBy;
        if (!owner) return res.status(404).json({ message: "Item owner not found" });

        const { message } = req.body;
        const notificationMessage = message?.trim() || `Staff found a possible match for your lost item "${item.title}". Please visit the SAO office with your school ID to verify.`;

        // Track notification on the item itself
        await Item.findByIdAndUpdate(req.params.id, {
            ownerNotified: true,
            ownerNotifiedAt: new Date()
        });

        // In-platform notification
        await User.findByIdAndUpdate(owner._id, {
            $push: {
                notifications: {
                    message: notificationMessage,
                    type: "item_found_match",
                    itemId: item._id,
                    itemTitle: item.title,
                    read: false,
                    createdAt: new Date()
                }
            }
        });

        if (owner.email) {
            await sendItemFoundNotificationEmail(owner.email, owner.name, item.title, notificationMessage);
        }

        res.json({ success: true, message: "Owner notified successfully" });
    } catch (err) {
        console.error("Notify owner error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// RESOLVE item (Staff only) — notifies reporter based on type
router.patch("/:id/resolve", staffOrAdminMiddleware, async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid item ID" });
    }
    try {
        const User = require("../models/User");

        const item = await Item.findByIdAndUpdate(
            req.params.id,
            { status: "resolved" },
            { new: true }
        ).populate("reportedBy", "name email");

        if (!item) return res.status(404).json({ message: "Item not found" });

        const reporter = item.reportedBy;

        if (reporter) {
            const isLost = item.type === "lost";

            const message = isLost
                ? `Great news! Your lost item "${item.title}" has been marked as resolved. We hope it's back in your hands!`
                : `The found item "${item.title}" you reported has been resolved by staff. Thank you for helping return it to its owner!`;

            const type = isLost ? "lost_item_resolved" : "found_item_resolved";

            await User.findByIdAndUpdate(reporter._id, {
                $push: {
                    notifications: {
                        message,
                        type,
                        itemId: item._id,
                        itemTitle: item.title,
                        read: false,
                        createdAt: new Date()
                    }
                }
            });
        }

        res.json({ success: true, item });
    } catch (err) {
        console.error("Resolve item error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;