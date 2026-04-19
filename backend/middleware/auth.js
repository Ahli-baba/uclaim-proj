const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// Store failed attempts in memory
const loginAttempts = new Map();

// Simple auth middleware - no async
const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: "Token is not valid" });
    }
};

// Check login attempts - SAFE VERSION
const checkLoginAttempts = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) return next();

        const key = email.toLowerCase();
        const attempts = loginAttempts.get(key);

        // Default: 5 attempts, 30 min lockout
        const maxAttempts = 5;
        const lockoutDuration = 30;

        if (attempts && attempts.count >= maxAttempts) {
            const timeSinceLastAttempt = (Date.now() - attempts.lastAttempt) / (1000 * 60);

            if (timeSinceLastAttempt < lockoutDuration) {
                const remainingMinutes = Math.ceil(lockoutDuration - timeSinceLastAttempt);
                return res.status(429).json({
                    message: `Too many failed attempts. Try again in ${remainingMinutes} minutes.`,
                    locked: true
                });
            }

            // Reset if lockout period passed
            loginAttempts.delete(key);
        }

        next();
    } catch (err) {
        console.error("Login attempt check error:", err);
        next(); // Fail open - allow login if check fails
    }
};

const recordFailedLogin = (email) => {
    if (!email) return;
    const key = email.toLowerCase();
    const existing = loginAttempts.get(key) || { count: 0, lastAttempt: 0 };

    loginAttempts.set(key, {
        count: existing.count + 1,
        lastAttempt: Date.now()
    });
};

const clearLoginAttempts = (email) => {
    if (!email) return;
    loginAttempts.delete(email.toLowerCase());
};

module.exports = {
    authMiddleware,
    checkLoginAttempts,
    recordFailedLogin,
    clearLoginAttempts
};