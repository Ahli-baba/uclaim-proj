const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
    {
        // General
        siteName: { type: String, default: "UClaim" },
        siteDescription: { type: String, default: "University Lost & Found Management System" },
        contactEmail: { type: String, default: "admin@university.edu" },
        universityName: { type: String, default: "University Name" },

        // Appearance
        darkModeDefault: { type: Boolean, default: false },
        compactMode: { type: Boolean, default: false },
        reducedMotion: { type: Boolean, default: false },
        showSidebarLabels: { type: Boolean, default: true },
        borderRadius: { type: String, default: "rounded", enum: ["sharp", "rounded", "pill"] },

        // Notifications
        emailNotifications: { type: Boolean, default: true },
        adminAlerts: { type: Boolean, default: true },
        newItemAlert: { type: Boolean, default: true },
        newClaimAlert: { type: Boolean, default: true },
        newUserAlert: { type: Boolean, default: false },
        dailyDigest: { type: Boolean, default: true },

        // Security
        requireEmailVerification: { type: Boolean, default: false },
        maxLoginAttempts: { type: Number, default: 5, min: 3, max: 10 },
        lockoutDuration: { type: Number, default: 30, min: 5, max: 120 },
        sessionTimeout: { type: Number, default: 60, min: 15, max: 240 },
        passwordMinLength: { type: Number, default: 8, min: 6, max: 20 },
        requireStrongPassword: { type: Boolean, default: true },

        // System
        autoArchiveDays: { type: Number, default: 30, min: 7, max: 365 },
        maxImageSize: { type: Number, default: 5, min: 1, max: 20 },
        maxImagesPerItem: { type: Number, default: 5, min: 1, max: 10 },
        itemsPerPage: { type: Number, default: 10, min: 5, max: 100 },
        enableComments: { type: Boolean, default: true },
        requireApproval: { type: Boolean, default: false },

        // Maintenance
        maintenanceMode: { type: Boolean, default: false },
        maintenanceMessage: {
            type: String,
            default: "System is under maintenance. Please check back later.",
        },
        // Use null (not empty string) for optional dates
        maintenanceStart: { type: Date, default: null },
        maintenanceEnd: { type: Date, default: null },

        // Metadata - who last saved
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },
    {
        // timestamps: true handles createdAt + updatedAt automatically.
        // DO NOT also define updatedAt manually in the schema — that caused a conflict.
        timestamps: true,
    }
);

// Singleton pattern — only one settings document ever exists
settingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

module.exports = mongoose.model("Settings", settingsSchema);