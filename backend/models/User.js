const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    nickname: {
        type: String,
        default: "",
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["student", "faculty", "staff", "admin"],
        default: "student"
    },
    department: {
        type: String,
        default: ""
    },
    phone: {
        type: String,
        default: ""
    },
    avatar: {
        type: String,
        default: ""
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String,
        default: null
    },
    verificationExpires: {
        type: Date,
        default: null
    },
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },

    // In-app notifications (e.g. watched item now at SAO)
    notifications: [{
        type: { type: String, default: "item_available" },
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
        itemTitle: { type: String },
        message: { type: String },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);