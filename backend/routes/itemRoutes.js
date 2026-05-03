const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Item = require('../models/Item');
const Claim = require("../models/Claim");
const { authMiddleware } = require("../middleware/auth");

// 🔥 HELPER: Check if string is valid MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ==========================================
// EXISTING ROUTES (keep all your current ones)
// ==========================================

// CREATE item (Protected)
router.post("/add", authMiddleware, async (req, res) => {
    try {
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

        const [lost, found, claimed] = await Promise.all([
            Item.countDocuments({ reportedBy: userId, ...dateFilter, type: "lost", status: "active" }),
            Item.countDocuments({ reportedBy: userId, ...dateFilter, type: "found", status: "active" }),
            Claim.countDocuments({ claimant: userId, type: { $ne: "finder_report" } })
        ]);

        res.json({ lost, found, claimed });
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
            .limit(10);

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

// Notifications endpoint
router.get("/notifications", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const userItems = await Item.find({ reportedBy: userId })
            .sort({ createdAt: -1 })
            .limit(5);

        const pendingClaimsOnMyItems = await Claim.countDocuments({
            item: { $in: userItems.map(i => i._id) },
            status: "pending",
            reporterNotified: false
        });

        const notifications = userItems.map(item => ({
            id: item._id,
            message: `Your ${item.type} item "${item.title}" is currently ${item.status}`,
            date: item.updatedAt || item.createdAt,
            type: "item"
        }));

        if (pendingClaimsOnMyItems > 0) {
            notifications.unshift({
                id: "claim-alert",
                message: `${pendingClaimsOnMyItems} pending claim${pendingClaimsOnMyItems > 1 ? 's' : ''} on your items need review`,
                date: new Date(),
                type: "claim",
                urgent: true
            });
        }

        res.json(notifications);
    } catch (err) {
        console.error("Notifications error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Get all items (Public)
router.get("/all", async (req, res) => {
    try {
        const items = await Item.find()
            .populate("reportedBy", "name email")
            .sort({ createdAt: -1 });
        res.json(items);
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
        if (images !== undefined) item.images = images; // full array replacement

        const updated = await item.save();
        await updated.populate("reportedBy", "name email");

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

// Submit a claim for an item
router.post("/:id/claim", authMiddleware, async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid item ID" });
    }

    try {
        const itemId = req.params.id;
        const userId = req.user.id;

        const item = await Item.findById(itemId);
        if (!item) return res.status(404).json({ message: "Item not found" });
        if (item.status === "claimed") return res.status(400).json({ message: "This item has already been claimed" });
        if (item.status === "resolved") return res.status(400).json({ message: "This item has been resolved" });
        if (item.reportedBy.toString() === userId) return res.status(400).json({ message: "You cannot claim your own item" });

        const existingClaim = await Claim.findOne({ item: itemId, claimant: userId, status: "pending" });
        if (existingClaim) return res.status(400).json({ message: "You already have a pending claim for this item" });

        const { proofDescription, contactPhone, contactEmail, proofImages } = req.body;
        if (!proofDescription || !contactPhone || !contactEmail) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const claim = new Claim({
            item: itemId,
            claimant: userId,
            proofDescription,
            contactPhone,
            contactEmail,
            proofImages: proofImages || []
        });

        await claim.save();
        item.claims.push(claim._id);
        item.claimCount = item.claims.length;
        await item.save();

        res.status(201).json({ message: "Claim submitted successfully! An admin will review your request.", claim });
    } catch (err) {
        console.error("Submit claim error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Get my claims (for logged in user)
router.get("/my/claims", authMiddleware, async (req, res) => {
    try {
        const claims = await Claim.find({ claimant: req.user.id })
            .populate("item", "title type status images location")
            .sort({ createdAt: -1 });
        res.json(claims);
    } catch (err) {
        console.error("Get my claims error:", err);
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
            .sort({ createdAt: -1 });
        res.json(claims);
    } catch (err) {
        console.error("Get item claims error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;