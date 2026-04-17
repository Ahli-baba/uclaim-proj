const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Claim = require("../models/Claim");
const Item = require("../models/Item");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");

// 🔥 HELPER: Check if string is valid MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// SUBMIT a claim request (User)
router.post("/submit", authMiddleware, async (req, res) => {
    try {
        const { itemId, proofDescription, contactPhone, contactEmail, proofImages } = req.body;

        // Validate item exists and is claimable
        if (!isValidObjectId(itemId)) {
            return res.status(400).json({ message: "Invalid item ID" });
        }

        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        if (item.status === "claimed") {
            return res.status(400).json({ message: "This item has already been claimed" });
        }

        if (!item.isClaimable) {
            return res.status(400).json({ message: "This item is not available for claiming" });
        }

        // Check if user already has a pending claim for this item
        const existingClaim = await Claim.findOne({
            item: itemId,
            claimant: req.user.id,
            status: "pending"
        });

        if (existingClaim) {
            return res.status(400).json({ message: "You already have a pending claim for this item" });
        }

        // Check if user is trying to claim their own item
        if (item.reportedBy.toString() === req.user.id) {
            return res.status(400).json({ message: "You cannot claim your own item" });
        }

        // Create the claim
        const claim = new Claim({
            item: itemId,
            claimant: req.user.id,
            proofDescription,
            contactPhone,
            contactEmail,
            proofImages: proofImages || []
        });

        await claim.save();

        // Update item claim count
        item.claimCount += 1;
        await item.save();

        res.status(201).json({
            message: "Claim submitted successfully. Waiting for admin approval.",
            claim
        });

    } catch (err) {
        console.error("Submit claim error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// GET my claims (User - claimant view)
router.get("/my-claims", authMiddleware, async (req, res) => {
    try {
        const claims = await Claim.find({ claimant: req.user.id })
            .populate("item", "title description images type status location")
            .populate("reviewedBy", "name")
            .sort({ createdAt: -1 });

        res.json(claims);
    } catch (err) {
        console.error("Get my claims error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// GET claims for items I reported (User - reporter view)
router.get("/incoming-claims", authMiddleware, async (req, res) => {
    try {
        // Find all items reported by this user
        const myItems = await Item.find({ reportedBy: req.user.id }).select("_id");
        const myItemIds = myItems.map(item => item._id);

        // Find claims for those items
        const claims = await Claim.find({ item: { $in: myItemIds } })
            .populate("item", "title images type status")
            .populate("claimant", "name email")
            .sort({ createdAt: -1 });

        res.json(claims);
    } catch (err) {
        console.error("Get incoming claims error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// GET claim details
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid claim ID" });
        }

        const claim = await Claim.findById(req.params.id)
            .populate("item", "title description images type status location reportedBy")
            .populate("claimant", "name email")
            .populate("reviewedBy", "name");

        if (!claim) {
            return res.status(404).json({ message: "Claim not found" });
        }

        // Check if user is authorized to view (claimant, reporter, or admin)
        const isClaimant = claim.claimant._id.toString() === req.user.id;
        const isReporter = claim.item.reportedBy.toString() === req.user.id;
        const isAdmin = req.user.role === "admin";

        if (!isClaimant && !isReporter && !isAdmin) {
            return res.status(403).json({ message: "Not authorized to view this claim" });
        }

        res.json(claim);
    } catch (err) {
        console.error("Get claim error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ==========================================
// ADMIN ROUTES
// ==========================================

// GET all claims (Admin)
router.get("/admin/all", adminMiddleware, async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};

        if (status) query.status = status;

        const claims = await Claim.find(query)
            .populate("item", "title images type status location")
            .populate("claimant", "name email")
            .populate("reviewedBy", "name")
            .sort({ createdAt: -1 });

        res.json(claims);
    } catch (err) {
        console.error("Get all claims error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// GET pending claims count (Admin - for notifications)
router.get("/admin/pending-count", adminMiddleware, async (req, res) => {
    try {
        const count = await Claim.countDocuments({ status: "pending" });
        res.json({ count });
    } catch (err) {
        console.error("Get pending count error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// APPROVE a claim (Admin)
router.put("/admin/:id/approve", adminMiddleware, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid claim ID" });
        }

        const { reviewNotes } = req.body;
        const claim = await Claim.findById(req.params.id);

        if (!claim) {
            return res.status(404).json({ message: "Claim not found" });
        }

        if (claim.status !== "pending") {
            return res.status(400).json({ message: "Claim has already been processed" });
        }

        // Update claim
        claim.status = "approved";
        claim.reviewedBy = req.user.id;
        claim.reviewNotes = reviewNotes || "";
        claim.reviewedAt = new Date();
        await claim.save();

        // Update item
        const item = await Item.findById(claim.item);
        item.status = "claimed";
        item.claimedBy = claim.claimant;
        item.isClaimable = false;
        item.currentClaim = claim._id;
        await item.save();

        // Reject all other pending claims for this item
        await Claim.updateMany(
            { item: claim.item, status: "pending", _id: { $ne: claim._id } },
            { status: "rejected", rejectionReason: "Another claim was approved for this item" }
        );

        res.json({
            message: "Claim approved successfully",
            claim: await Claim.findById(claim._id)
                .populate("item", "title images")
                .populate("claimant", "name email")
        });

    } catch (err) {
        console.error("Approve claim error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// REJECT a claim (Admin)
router.put("/admin/:id/reject", adminMiddleware, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid claim ID" });
        }

        const { rejectionReason } = req.body;
        const claim = await Claim.findById(req.params.id);

        if (!claim) {
            return res.status(404).json({ message: "Claim not found" });
        }

        if (claim.status !== "pending") {
            return res.status(400).json({ message: "Claim has already been processed" });
        }

        claim.status = "rejected";
        claim.reviewedBy = req.user.id;
        claim.rejectionReason = rejectionReason || "Claim rejected by admin";
        claim.reviewedAt = new Date();
        await claim.save();

        res.json({
            message: "Claim rejected successfully",
            claim: await Claim.findById(claim._id)
                .populate("item", "title images")
                .populate("claimant", "name email")
        });

    } catch (err) {
        console.error("Reject claim error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;