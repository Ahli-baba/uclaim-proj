const Settings = require("../models/Settings");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

const maintenanceCheck = async (req, res, next) => {
    try {
        const fullUrl = req.originalUrl || req.url;

        // Check if request has staff/admin token
        let isStaffOrAdmin = false;
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                if (decoded.role === "admin" || decoded.role === "staff") {
                    isStaffOrAdmin = true;
                }
            } catch {
                // invalid token, treat as normal user
            }
        }

        // Staff and admin always bypass maintenance
        if (isStaffOrAdmin) {
            return next();
        }

        const settings = await Settings.getSettings();

        if (settings.maintenanceMode === true) {
            const now = new Date();
            const start = settings.maintenanceStart ? new Date(settings.maintenanceStart) : null;
            const end = settings.maintenanceEnd ? new Date(settings.maintenanceEnd) : null;

            if (end && now > end) {
                settings.maintenanceMode = false;
                await settings.save();
                return next();
            }

            if (start && now < start) {
                return next();
            }

            if (!start || (now >= start && (!end || now < end))) {
                return res.status(503).json({
                    message: settings.maintenanceMessage || "System is under maintenance",
                    maintenance: true
                });
            }
        }

        next();
    } catch (err) {
        console.error("Maintenance check error:", err);
        next();
    }
};

module.exports = maintenanceCheck;