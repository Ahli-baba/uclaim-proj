const Settings = require("../models/Settings");

const maintenanceCheck = async (req, res, next) => {
    try {
        // Get full URL
        const fullUrl = req.originalUrl || req.url;

        // SKIP any route that contains /admin in the path
        // This catches /api/admin/* AND /api/claims/admin/* AND /api/items/admin/*
        if (fullUrl.includes("/admin")) {
            return next();
        }

        const settings = await Settings.getSettings();

        if (settings.maintenanceMode === true) {
            const now = new Date();
            const start = settings.maintenanceStart ? new Date(settings.maintenanceStart) : null;
            const end = settings.maintenanceEnd ? new Date(settings.maintenanceEnd) : null;

            // Auto-disable if end time passed
            if (end && now > end) {
                settings.maintenanceMode = false;
                await settings.save();
                return next();
            }

            // If hasn't started yet, allow
            if (start && now < start) {
                return next();
            }

            // Block non-admin users
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
        next(); // Fail open - don't block on errors
    }
};

module.exports = maintenanceCheck;