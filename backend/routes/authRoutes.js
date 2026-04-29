const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Settings = require("../models/Settings");
const { checkLoginAttempts, recordFailedLogin, clearLoginAttempts } = require("../middleware/auth");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/emailService");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// Helper to get settings safely
const getSettingsSafe = async () => {
    try {
        return await Settings.getSettings();
    } catch (err) {
        console.error("Settings fetch error:", err);
        return {
            passwordMinLength: 8,
            requireStrongPassword: false,
            requireEmailVerification: true, // Default to true for security
            sessionTimeout: 60
        };
    }
};

// POST /api/auth/register
router.post("/register", async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const settings = await getSettingsSafe();

        // Check password length
        const minLength = settings.passwordMinLength || 8;
        if (password.length < minLength) {
            return res.status(400).json({
                message: `Password must be at least ${minLength} characters`
            });
        }

        // Check strong password if required
        if (settings.requireStrongPassword) {
            const hasUpper = /[A-Z]/.test(password);
            const hasLower = /[a-z]/.test(password);
            const hasNum = /\d/.test(password);
            const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

            if (!hasUpper || !hasLower || !hasNum || !hasSpecial) {
                return res.status(400).json({
                    message: "Password must contain uppercase, lowercase, numbers, and special characters"
                });
            }
        }

        // Check existing user
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user - NOT verified yet (must verify email first)
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || "student",
            isVerified: false,
            verificationToken: generateVerificationToken(),
            verificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        });

        if (settings.requireEmailVerification) {
            // Send verification email
            const emailSent = await sendVerificationEmail(
                user.email,
                user.verificationToken,
                user.name
            );

            return res.status(201).json({
                message: emailSent
                    ? "Registration successful! Please check your email to verify your account."
                    : "Account created but email failed to send. Please contact support or try resending.",
                needsVerification: true,
                email: user.email,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isVerified: false
                }
            });
        }

        // If email verification not required, return success directly
        res.status(201).json({
            message: "Registration successful.",
            needsVerification: false,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: false
            }
        });

    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// POST /api/auth/login - WITH VERIFICATION CHECK
router.post("/login", checkLoginAttempts, async (req, res) => {
    const { email, password } = req.body;

    try {
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            recordFailedLogin(email);
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            recordFailedLogin(email);
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // CHECK: Must be verified to log in
        if (!user.isVerified) {
            return res.status(403).json({
                message: "Please verify your email before logging in. Check your inbox or spam for the verification link.",
                needsVerification: true,
                email: user.email
            });
        }

        // SUCCESS - User is verified
        clearLoginAttempts(email);

        // Get settings for session timeout
        const settings = await getSettingsSafe();
        const sessionTimeout = settings.sessionTimeout || 60;

        // Create token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: `${sessionTimeout}m` }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: true
            }
        });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// POST /api/auth/verify-email - Verify email with token
router.post("/verify-email", async (req, res) => {
    const { token } = req.body;

    try {
        const user = await User.findOne({
            verificationToken: token,
            verificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired verification token" });
        }

        // Mark as verified
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationExpires = undefined;
        await user.save();

        res.json({
            message: "Email verified successfully! You can now log in.",
            verified: true
        });

    } catch (err) {
        console.error("Verification error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// POST /api/auth/resend-verification - Resend verification email
router.post("/resend-verification", async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "Email already verified" });
        }

        // Generate new token
        user.verificationToken = generateVerificationToken();
        user.verificationExpires = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        // Resend verification email
        const emailSent = await sendVerificationEmail(user.email, user.verificationToken, user.name);

        res.json({
            message: emailSent
                ? "Verification email sent. Please check your inbox."
                : "Failed to send email. Please try again later."
        });

    } catch (err) {
        console.error("Resend verification error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Helper function to generate random token
// POST /api/auth/change-password - Change password (authenticated)
router.post("/change-password", async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    try {
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Please provide current and new password" });
        }

        // Verify token and get user
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        // Check new password length
        const settings = await getSettingsSafe();
        const minLength = settings.passwordMinLength || 8;
        if (newPassword.length < minLength) {
            return res.status(400).json({
                message: `New password must be at least ${minLength} characters`
            });
        }

        // Hash and save new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: "Password changed successfully" });

    } catch (err) {
        console.error("Change password error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Helper function to generate random token
function generateVerificationToken() {
    return require("crypto").randomBytes(32).toString("hex");
}

module.exports = router;