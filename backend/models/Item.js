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
        enum: ["active", "resolved"],
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

    saoPickupDeadline: {
        type: Date,
        default: null
    },

    // ✅ SAO presence flag — toggled by admin only
    isAtSAO: {
        type: Boolean,
        default: false          // false = "Not yet at SAO", true = "Now at SAO"
    },
    isAtSAOUpdatedAt: {
        type: Date,
        default: null
    },

    // Owner notification tracking
    ownerNotified: {
        type: Boolean,
        default: false
    },
    ownerNotifiedAt: {
        type: Date,
        default: null
    },

    // Users watching this item for SAO availability
    watchers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]

}, { timestamps: true });

itemSchema.index({ reportedBy: 1, type: 1 });
itemSchema.index({ reportedBy: 1, status: 1 });
itemSchema.index({ status: 1, isClaimable: 1 });

// For search/browse pages (filter by type + status)
itemSchema.index({ type: 1, status: 1 });

// For category filtering
itemSchema.index({ category: 1, type: 1, status: 1 });

// For sorting by newest (used on almost every list page)
itemSchema.index({ createdAt: -1 });

// For SAO-related queries
itemSchema.index({ isAtSAO: 1, status: 1 });

module.exports = mongoose.model("Item", itemSchema);