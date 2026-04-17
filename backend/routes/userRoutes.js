const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Item = require("../models/Item");
const authMiddleware = require("../middleware/auth");

// GET current user profile
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// UPDATE user profile
router.put("/profile", authMiddleware, async (req, res) => {
    try {
        // 🔥 FIX: Added avatar to the update fields
        const { name, department, phone, avatar } = req.body;

        const updateFields = {
            name,
            department,
            phone
        };

        // Only update avatar if it's provided (not undefined)
        if (avatar !== undefined) {
            updateFields.avatar = avatar;
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            updateFields,
            { new: true }
        ).select("-password");

        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// GET user stats
router.get("/stats", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const reported = await Item.countDocuments({ reportedBy: userId });
        const found = await Item.countDocuments({ reportedBy: userId, type: "found" });
        const claimed = await Item.countDocuments({ reportedBy: userId, status: "claimed" });
        const successRate = reported > 0 ? Math.round((claimed / reported) * 100) : 0;
        res.json({ reported, found, claimed, successRate });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;