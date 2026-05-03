const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const mongoose = require("mongoose");
const Claim = require("../models/Claim");
const Item = require("../models/Item");
const adminMiddleware = require("../middleware/admin");
const {
    sendClaimApprovedEmail,
    sendClaimRejectedEmail,
    sendItemFoundNotificationEmail,
    sendFinderReportRejectedEmail
} = require("../utils/emailService");

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

        // Only found items can be claimed
        if (item.type !== "found") {
            return res.status(400).json({
                message: "Claim requests can only be submitted for found items. Use 'I Found This' for lost items."
            });
        }

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
            .sort({ createdAt: -1 });

        // ✅ Filter out claims where item was deleted (populate returns null)
        const validClaims = claims.filter(c => c.item !== null);

        res.json(validClaims);
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
        const [approved, pickedUp] = await Promise.all([
            Claim.countDocuments({ status: "approved" }),
            Claim.countDocuments({ status: "picked_up" })
        ]);

        res.json({ approved, pickedUp });
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
        item.claimedBy = claim.claimant;
        item.isClaimable = false;
        item.currentClaim = claim._id;
        // ✅ Do NOT mark as claimed yet — item is only truly claimed
        // when the user physically picks it up from SAO.
        // Status stays "active" until admin marks it as picked up.
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

// ✅ MARK item as PICKED UP from SAO (Admin)
// Triggered when the claimant physically collects the item from SAO
router.put("/admin/:id/mark-picked-up", adminMiddleware, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid claim ID" });
        }

        const claim = await Claim.findById(req.params.id);
        if (!claim) return res.status(404).json({ message: "Claim not found" });

        if (claim.status !== "approved") {
            return res.status(400).json({
                message: "Only approved claims can be marked as picked up"
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

// ✅ CONFIRM finder item received at SAO (Admin)
// Triggered when finder physically brings the item to SAO
// This notifies the OWNER of the lost item
router.put("/admin/:id/confirm-finder-received", adminMiddleware, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid claim ID" });
        }

        const { adminNotes } = req.body;
        const finderReport = await Claim.findById(req.params.id);

        if (!finderReport) return res.status(404).json({ message: "Finder report not found" });
        if (finderReport.type !== "finder_report") {
            return res.status(400).json({ message: "This is not a finder report" });
        }
        if (finderReport.status !== "pending") {
            return res.status(400).json({ message: "This finder report has already been processed" });
        }

        // Mark finder report as approved
        finderReport.status = "approved";
        finderReport.reviewedBy = req.user.id;
        finderReport.reviewedAt = new Date();
        finderReport.reviewNotes = adminNotes || "Item received at SAO.";
        await finderReport.save();

        // Update the lost item — mark it as at SAO
        const item = await Item.findById(finderReport.item)
            .populate("reportedBy", "name email");

        if (!item) return res.status(404).json({ message: "Item not found" });

        item.isAtSAO = true;
        item.isAtSAOUpdatedAt = new Date();
        await item.save();

        // ✅ Notify the OWNER of the lost item
        await sendItemFoundNotificationEmail(
            item.reportedBy.email,
            item.reportedBy.name,
            item.title
        );

        res.json({
            message: "Item received at SAO confirmed. The owner has been notified.",
            finderReport: await Claim.findById(finderReport._id)
                .populate("item", "title images type status")
                .populate("claimant", "name email")
                .populate("reviewedBy", "name")
        });

    } catch (err) {
        console.error("Confirm finder received error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ✅ DECLINE finder report (Admin)
// Used when the finder report seems invalid or item was not brought to SAO
router.put("/admin/:id/decline-finder-report", adminMiddleware, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid claim ID" });
        }

        const { rejectionReason } = req.body;
        const finderReport = await Claim.findById(req.params.id);

        if (!finderReport) return res.status(404).json({ message: "Finder report not found" });
        if (finderReport.type !== "finder_report") {
            return res.status(400).json({ message: "This is not a finder report" });
        }
        if (finderReport.status !== "pending") {
            return res.status(400).json({ message: "This finder report has already been processed" });
        }

        finderReport.status = "rejected";
        finderReport.reviewedBy = req.user.id;
        finderReport.reviewedAt = new Date();
        finderReport.rejectionReason = rejectionReason || "Finder report declined by admin";
        await finderReport.save();

        // ✅ Notify the finder their report was declined
        const populated = await Claim.findById(finderReport._id)
            .populate("item", "title images")
            .populate("claimant", "name email");

        await sendFinderReportRejectedEmail(
            populated.claimant.email,
            populated.claimant.name,
            populated.item.title,
            rejectionReason
        );

        res.json({
            message: "Finder report declined.",
            finderReport: populated
        });

    } catch (err) {
        console.error("Decline finder report error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ✅ MARK owner collected lost item from SAO (Admin)
router.put("/admin/:id/owner-collected", adminMiddleware, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid claim ID" });
        }

        const finderReport = await Claim.findById(req.params.id);
        if (!finderReport) return res.status(404).json({ message: "Finder report not found" });
        if (finderReport.type !== "finder_report") {
            return res.status(400).json({ message: "This is not a finder report" });
        }
        if (finderReport.status !== "approved") {
            return res.status(400).json({ message: "Item must be confirmed at SAO first" });
        }

        finderReport.status = "picked_up";
        finderReport.pickedUpAt = new Date();
        finderReport.pickedUpConfirmedBy = req.user.id;
        await finderReport.save();

        // Mark item as resolved
        const item = await Item.findById(finderReport.item);
        item.status = "resolved";
        item.isAtSAO = false;
        await item.save();

        res.json({
            message: "Owner has collected the item. Case resolved!",
            finderReport: await Claim.findById(finderReport._id)
                .populate("item", "title images status")
                .populate("claimant", "name email")
                .populate("pickedUpConfirmedBy", "name")
        });

    } catch (err) {
        console.error("Owner collected error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// TEMP: one-time fix — delete this route after running it once
router.get("/admin/fix-claim-types", adminMiddleware, async (req, res) => {
    const suspects = await Claim.find({ type: "claim" }).populate("item", "type title");
    let fixed = 0;
    for (const claim of suspects) {
        if (claim.item && claim.item.type === "lost") {
            claim.type = "finder_report";
            await claim.save();
            fixed++;
        }
    }
    res.json({ message: `Fixed ${fixed} document(s).` });
});

module.exports = router;