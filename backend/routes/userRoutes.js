const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Item = require("../models/Item");
const { authMiddleware } = require("../middleware/auth");

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
        const { name, nickname, department, phone, avatar } = req.body;

        const updateFields = {
            name,
            nickname,
            department,
            phone
        };

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
        const lost = await Item.countDocuments({ reportedBy: userId, type: "lost" });
        const found = await Item.countDocuments({ reportedBy: userId, type: "found" });
        const claimed = await Item.countDocuments({ reportedBy: userId, status: "claimed" });
        res.json({ reported, lost, found, claimed });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;