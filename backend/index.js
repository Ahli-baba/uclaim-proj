require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

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
const Category = require("./models/Category");

app.get("/api/settings", async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        res.json({
            settings: {
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
            },
        });
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
    console.log("Auth middleware not loaded:", e.message);
}

try {
    maintenanceCheck = require("./middleware/maintenance");
} catch (e) {
    console.log("Maintenance middleware not loaded:", e.message);
}

app.get("/", (req, res) => {
    res.send("Lost & Found API Running");
});

// Public categories endpoint — no token needed (used by dropdowns)
app.get("/api/categories", async (req, res) => {
    try {
        await Category.seedDefaults();
        const categories = await Category.find({ isActive: true }).sort({ order: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Public routes
app.use("/api/auth", authRoutes);

// Protected routes
app.use("/api/admin", authMiddleware, adminRoutes);
app.use("/api/items", authMiddleware, maintenanceCheck, itemRoutes);
app.use("/api/user", authMiddleware, maintenanceCheck, userRoutes);
app.use("/api/claims", authMiddleware, maintenanceCheck, claimRoutes);

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB connection error:", err));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});