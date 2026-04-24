const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true
    },
    claimant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    // Proof details
    proofDescription: {
        type: String,
        required: true,
        trim: true
    },
    contactPhone: {
        type: String,
        required: true
    },
    contactEmail: {
        type: String,
        required: true
    },
    proofImages: [String],

    // Claim status
    // Flow: pending → approved → delivered_to_sao → picked_up
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "delivered_to_sao", "picked_up"],
        default: "pending"
    },

    // Admin review
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    reviewNotes: {
        type: String,
        default: ""
    },
    reviewedAt: {
        type: Date,
        default: null
    },

    // Rejection reason (if rejected)
    rejectionReason: {
        type: String,
        default: ""
    },

    // ✅ SAO Drop-off Tracking
    saoDeliveredAt: {
        type: Date,
        default: null       // Set when admin marks item as delivered to SAO
    },
    saoDeliveredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null       // Admin who marked it as delivered
    },
    saoNotes: {
        type: String,
        default: ""         // e.g. "Item is at SAO Room 101, bring valid ID"
    },

    // ✅ Pickup Tracking
    pickedUpAt: {
        type: Date,
        default: null       // Set when admin confirms claimant picked up the item
    },
    pickedUpConfirmedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null       // Admin who confirmed the pickup
    }

}, { timestamps: true });

// Indexes for common queries
claimSchema.index({ item: 1, status: 1 });
claimSchema.index({ claimant: 1, status: 1 });
claimSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Claim", claimSchema);