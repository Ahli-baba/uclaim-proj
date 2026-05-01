const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const mongoose = require("mongoose");
const Claim = require("../models/Claim");
const Item = require("../models/Item");
const adminMiddleware = require("../middleware/admin");
const { sendClaimApprovedEmail, sendClaimRejectedEmail, sendItemAtSAOEmail } = require("../utils/emailService");

// 🔥 HELPER: Check if string is valid MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// SUBMIT a claim request (User)
router.post("/submit", authMiddleware, async (req, res) => {
    try {
        const { itemId, proofDescription, contactPhone, contactEmail, proofImages } = req.body;

        if (!isValidObjectId(itemId)) {
            return res.status(400).json({ message: "Invalid item ID" });
        }

        const item = await Item.findById(itemId);
        if (!item) return res.status(404).json({ message: "Item not found" });

        if (item.status === "claimed") {
            return res.status(400).json({ message: "This item has already been claimed" });
        }

        if (!item.isClaimable) {
            return res.status(400).json({ message: "This item is not available for claiming" });
        }

        const existingClaim = await Claim.findOne({
            item: itemId,
            claimant: req.user.id,
            status: "pending"
        });

        if (existingClaim) {
            return res.status(400).json({ message: "You already have a pending claim for this item" });
        }

        if (item.reportedBy.toString() === req.user.id) {
            return res.status(400).json({ message: "You cannot claim your own item" });
        }

        const claim = new Claim({
            item: itemId,
            claimant: req.user.id,
            proofDescription,
            contactPhone,
            contactEmail,
            proofImages: proofImages || []
        });

        await claim.save();

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

// ✅ SUBMIT a finder report (User found a Lost item)
router.post("/submit-finder-report", authMiddleware, async (req, res) => {
    try {
        const { itemId, finderDescription, contactPhone, contactEmail, proofImages } = req.body;

        if (!isValidObjectId(itemId)) {
            return res.status(400).json({ message: "Invalid item ID" });
        }

        const item = await Item.findById(itemId);
        if (!item) return res.status(404).json({ message: "Item not found" });

        if (item.type !== "lost") {
            return res.status(400).json({ message: "This route is only for lost items" });
        }

        if (item.status === "claimed" || item.status === "resolved") {
            return res.status(400).json({ message: "This item is no longer active" });
        }

        if (item.reportedBy.toString() === req.user.id) {
            return res.status(400).json({ message: "You cannot report finding your own item" });
        }

        // Check if this user already submitted a finder report for this item
        const existingReport = await Claim.findOne({
            item: itemId,
            claimant: req.user.id,
            type: "finder_report",
            status: "pending"
        });

        if (existingReport) {
            return res.status(400).json({ message: "You already submitted a finder report for this item" });
        }

        const report = new Claim({
            item: itemId,
            claimant: req.user.id,
            type: "finder_report",
            proofDescription: finderDescription,  // reuse field
            finderDescription,
            contactPhone,
            contactEmail,
            proofImages: proofImages || []
        });

        await report.save();

        item.claimCount += 1;
        await item.save();

        res.status(201).json({
            message: "Finder report submitted. Please bring the item to the SAO office now.",
            report
        });

    } catch (err) {
        console.error("Submit finder report error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// GET my claims (User - claimant view)
router.get("/my-claims", authMiddleware, async (req, res) => {
    try {
        const claims = await Claim.find({ claimant: req.user.id })
            .populate("item", "title description images type status location saoDeliveredAt saoPickupDeadline")
            .populate("reviewedBy", "name")
            .populate("saoDeliveredBy", "name")
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
        const myItems = await Item.find({ reportedBy: req.user.id }).select("_id");
        const myItemIds = myItems.map(item => item._id);

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
            .populate("item", "title description images type status location reportedBy saoDeliveredAt saoPickupDeadline")
            .populate("claimant", "name email")
            .populate("reviewedBy", "name")
            .populate("saoDeliveredBy", "name")
            .populate("pickedUpConfirmedBy", "name");

        if (!claim) return res.status(404).json({ message: "Claim not found" });

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
            .populate("item", "title images type status location saoDeliveredAt")
            .populate("claimant", "name email")
            .populate("reviewedBy", "name")
            .populate("saoDeliveredBy", "name")
            .sort({ createdAt: -1 });

        res.json(claims);
    } catch (err) {
        console.error("Get all claims error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// GET pending claims count (Admin)
router.get("/admin/pending-count", adminMiddleware, async (req, res) => {
    try {
        const count = await Claim.countDocuments({ status: "pending" });
        res.json({ count });
    } catch (err) {
        console.error("Get pending count error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ✅ GET SAO summary counts (Admin - dashboard widget)
router.get("/admin/sao-summary", adminMiddleware, async (req, res) => {
    try {
        const [awaitingDelivery, atSAO, pickedUp] = await Promise.all([
            Claim.countDocuments({ status: "approved" }),          // Approved but not yet at SAO
            Claim.countDocuments({ status: "delivered_to_sao" }),  // Waiting for pickup at SAO
            Claim.countDocuments({ status: "picked_up" })          // Already picked up
        ]);

        res.json({ awaitingDelivery, atSAO, pickedUp });
    } catch (err) {
        console.error("Get SAO summary error:", err);
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

        if (!claim) return res.status(404).json({ message: "Claim not found" });
        if (claim.status !== "pending") {
            return res.status(400).json({ message: "Claim has already been processed" });
        }

        claim.status = "approved";
        claim.reviewedBy = req.user.id;
        claim.reviewNotes = reviewNotes || "";
        claim.reviewedAt = new Date();
        await claim.save();

        const item = await Item.findById(claim.item);
        item.status = "claimed";
        item.claimedBy = claim.claimant;
        item.isClaimable = false;
        item.currentClaim = claim._id;
        await item.save();

        // Reject all other pending claims
        await Claim.updateMany(
            { item: claim.item, status: "pending", _id: { $ne: claim._id } },
            { status: "rejected", rejectionReason: "Another claim was approved for this item" }
        );

        // ✅ Send approval email to claimant
        const populatedClaim = await Claim.findById(claim._id)
            .populate("item", "title images")
            .populate("claimant", "name email");

        await sendClaimApprovedEmail(
            populatedClaim.claimant.email,
            populatedClaim.claimant.name,
            populatedClaim.item.title
        );

        res.json({
            message: "Claim approved. Please remind the finder to drop the item off at SAO.",
            claim: populatedClaim
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

        if (!claim) return res.status(404).json({ message: "Claim not found" });
        if (claim.status !== "pending") {
            return res.status(400).json({ message: "Claim has already been processed" });
        }

        claim.status = "rejected";
        claim.reviewedBy = req.user.id;
        claim.rejectionReason = rejectionReason || "Claim rejected by admin";
        claim.reviewedAt = new Date();
        await claim.save();

        // ✅ Send rejection email to claimant
        const populatedClaim = await Claim.findById(claim._id)
            .populate("item", "title images")
            .populate("claimant", "name email");

        await sendClaimRejectedEmail(
            populatedClaim.claimant.email,
            populatedClaim.claimant.name,
            populatedClaim.item.title,
            rejectionReason
        );

        res.json({
            message: "Claim rejected successfully",
            claim: populatedClaim
        });

    } catch (err) {
        console.error("Reject claim error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ✅ MARK item as DELIVERED TO SAO (Admin)
// Triggered when the finder physically drops off the item at SAO
router.put("/admin/:id/mark-delivered-to-sao", adminMiddleware, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid claim ID" });
        }

        const { saoNotes, pickupDeadlineDays } = req.body;
        // pickupDeadlineDays: optional number of days claimant has to pick up (e.g. 7)

        const claim = await Claim.findById(req.params.id);
        if (!claim) return res.status(404).json({ message: "Claim not found" });

        if (claim.status !== "approved") {
            return res.status(400).json({
                message: "Only approved claims can be marked as delivered to SAO"
            });
        }

        const now = new Date();

        // Update claim
        claim.status = "delivered_to_sao";
        claim.saoDeliveredAt = now;
        claim.saoDeliveredBy = req.user.id;
        claim.saoNotes = saoNotes || "Your item is now at the SAO. Please bring a valid ID to claim it.";
        await claim.save();

        // Update item
        const item = await Item.findById(claim.item);
        item.status = "delivered_to_sao";
        item.saoDeliveredAt = now;

        if (pickupDeadlineDays) {
            const deadline = new Date(now);
            deadline.setDate(deadline.getDate() + parseInt(pickupDeadlineDays));
            item.saoPickupDeadline = deadline;
        }

        await item.save();

        // ✅ Send "item at SAO" email to claimant
        const populatedClaim = await Claim.findById(claim._id)
            .populate("item", "title images status saoDeliveredAt saoPickupDeadline")
            .populate("claimant", "name email")
            .populate("saoDeliveredBy", "name");

        await sendItemAtSAOEmail(
            populatedClaim.claimant.email,
            populatedClaim.claimant.name,
            populatedClaim.item.title,
            claim.saoNotes,
            populatedClaim.item.saoPickupDeadline
        );

        res.json({
            message: "Item marked as delivered to SAO. The claimant has been notified to pick it up.",
            claim: populatedClaim
        });

    } catch (err) {
        console.error("Mark delivered to SAO error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ✅ MARK item as PICKED UP from SAO (Admin)
// Triggered when the claimant physically collects the item from SAO
router.put("/admin/:id/mark-picked-up", adminMiddleware, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid claim ID" });
        }

        const claim = await Claim.findById(req.params.id);
        if (!claim) return res.status(404).json({ message: "Claim not found" });

        if (claim.status !== "delivered_to_sao") {
            return res.status(400).json({
                message: "Item must be marked as delivered to SAO before it can be picked up"
            });
        }

        // Update claim
        claim.status = "picked_up";
        claim.pickedUpAt = new Date();
        claim.pickedUpConfirmedBy = req.user.id;
        await claim.save();

        // Update item to resolved
        const item = await Item.findById(claim.item);
        item.status = "resolved";
        await item.save();

        res.json({
            message: "Item successfully picked up from SAO. This case is now resolved.",
            claim: await Claim.findById(claim._id)
                .populate("item", "title images status")
                .populate("claimant", "name email")
                .populate("pickedUpConfirmedBy", "name")
        });

    } catch (err) {
        console.error("Mark picked up error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;