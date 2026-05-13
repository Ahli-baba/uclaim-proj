require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const compression = require("compression");
const app = express();
app.use(compression());

app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://uclaim-proj.vercel.app"
    ],
    credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ✅ SERVE STATIC FILES - uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─────────────────────────────────────────────────────────────
// PUBLIC settings endpoint — no token required.
// ─────────────────────────────────────────────────────────────
const Settings = require("./models/Settings");
let settingsCache = null;
let settingsCacheTime = 0;
const SETTINGS_TTL = 60 * 1000; // 1 minute cache
const Category = require("./models/Category");

app.get("/api/settings", async (req, res) => {
    try {
        const now = Date.now();
        if (settingsCache && (now - settingsCacheTime) < SETTINGS_TTL) {
            return res.json({ settings: settingsCache });
        }
        const settings = await Settings.getSettings();
        settingsCache = {
            siteName: settings.siteName,
            siteDescription: settings.siteDescription,
            universityName: settings.universityName,
            contactEmail: settings.contactEmail,
            darkModeDefault: settings.darkModeDefault,
            compactMode: settings.compactMode,
            reducedMotion: settings.reducedMotion,
            showSidebarLabels: settings.showSidebarLabels,
            borderRadius: settings.borderRadius,
            maintenanceMode: settings.maintenanceMode,
            maintenanceMessage: settings.maintenanceMessage,
            maintenanceStart: settings.maintenanceStart,
            maintenanceEnd: settings.maintenanceEnd,
        };
        settingsCacheTime = now;
        res.json({ settings: settingsCache });
    } catch (err) {
        console.error("GET /api/settings error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Routes
const itemRoutes = require("./routes/itemRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const claimRoutes = require("./routes/claimRoutes");

// Middleware imports with safety check
let authMiddleware = (req, res, next) => next();
let maintenanceCheck = (req, res, next) => next();

try {
    const auth = require("./middleware/auth");
    if (auth.authMiddleware) authMiddleware = auth.authMiddleware;
} catch (e) {
    console.error("CRITICAL: Auth middleware failed to load:", e.message);
    // Fail closed — block all protected routes
    authMiddleware = (req, res, next) => {
        res.status(503).json({ message: "System configuration error. Please contact support." });
    };
}

try {
    maintenanceCheck = require("./middleware/maintenance");
} catch (e) {
    console.error("CRITICAL: Maintenance middleware failed to load:", e.message);
    // Fail closed — block all requests until fixed
    maintenanceCheck = (req, res, next) => {
        res.status(503).json({ message: "System configuration error. Please contact support." });
    };
}

app.get("/", (req, res) => {
    res.send("Lost & Found API Running");
});

// Public categories endpoint — no token needed (used by dropdowns)
// Seed once on startup, not on every request
Category.seedDefaults().catch(err => console.error("Category seed error:", err));

app.get("/api/categories", async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .sort({ order: 1 })
            .lean();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Public routes
app.use("/api/auth", authRoutes);

// Protected routes — maintenance check applies to ALL authenticated routes
app.use("/api/admin", authMiddleware, maintenanceCheck, adminRoutes);
app.use("/api/items", authMiddleware, maintenanceCheck, itemRoutes);
app.use("/api/user", authMiddleware, maintenanceCheck, userRoutes);
app.use("/api/claims", authMiddleware, maintenanceCheck, claimRoutes);

mongoose
    .connect(process.env.MONGO_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB connection error:", err));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});