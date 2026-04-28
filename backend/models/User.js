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
    }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);