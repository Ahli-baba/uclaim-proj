const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    location: String,
    type: {
        type: String,
        enum: ["lost", "found"],
        required: true,
        lowercase: true
    },
    // ✅ Added "delivered_to_sao" to track SAO drop-off at item level
    status: {
        type: String,
        enum: ["active", "claimed", "delivered_to_sao", "resolved"],
        default: "active",
        lowercase: true
    },
    category: String,
    date: {
        type: Date,
        default: Date.now
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    claimedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    images: [String],

    // Claim-related fields
    isClaimable: {
        type: Boolean,
        default: true
    },
    claimCount: {
        type: Number,
        default: 0
    },
    currentClaim: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Claim",
        default: null
    },
    claims: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Claim"
    }],

    // ✅ SAO Drop-off Info at item level
    saoDeliveredAt: {
        type: Date,
        default: null           // Mirrors claim.saoDeliveredAt for easy querying
    },
    saoPickupDeadline: {
        type: Date,
        default: null           // Optional: deadline for claimant to pick up from SAO
    },

    // ✅ SAO presence flag — toggled by admin only
    isAtSAO: {
        type: Boolean,
        default: false          // false = "Not yet at SAO", true = "Now at SAO"
    },
    isAtSAOUpdatedAt: {
        type: Date,
        default: null           // Tracks when admin last toggled this
    }

}, { timestamps: true });

itemSchema.index({ reportedBy: 1, type: 1 });
itemSchema.index({ reportedBy: 1, status: 1 });
itemSchema.index({ status: 1, isClaimable: 1 });

module.exports = mongoose.model("Item", itemSchema);