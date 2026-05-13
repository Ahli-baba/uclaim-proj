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
        const [lost, found, resolved, awaitingReview] = await Promise.all([
            Item.countDocuments({ reportedBy: userId, type: "lost", status: "active" }),
            Item.countDocuments({ reportedBy: userId, type: "found", status: "active" }),
            Item.countDocuments({ reportedBy: userId, status: { $in: ["claimed", "resolved"] } }),
            Item.countDocuments({ reportedBy: userId, status: "active", currentClaim: { $ne: null } })
        ]);
        const reported = lost + found + resolved;
        res.json({ reported, lost, found, claimed: resolved, resolved, awaitingReview });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;