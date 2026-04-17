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
    proofImages: [String], // Images supporting the claim (receipts, photos, etc.)

    // Claim status
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
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
    }
}, { timestamps: true });

// Indexes for common queries
claimSchema.index({ item: 1, status: 1 });
claimSchema.index({ claimant: 1, status: 1 });
claimSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Claim", claimSchema);