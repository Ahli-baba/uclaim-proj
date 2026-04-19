import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error("useSettings must be used within SettingsProvider");
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        // General — these are now fetched from the public endpoint on mount
        siteName: "UClaim",
        siteDescription: "University Lost & Found Management System",
        universityName: "University Name",
        contactEmail: "admin@university.edu",
        // Appearance
        darkModeDefault: false,
        compactMode: false,
        reducedMotion: false,
        showSidebarLabels: true,
        borderRadius: "rounded",
        // Maintenance
        maintenanceMode: false,
        maintenanceMessage: "System is under maintenance. Please check back later.",
    });
    const [loading, setLoading] = useState(true);
    const [error, _setError] = useState(null);
    //const [error, setError] = useState(null);

    // ── Fetch public settings on every mount (no token needed) ──
    // This covers LandingPage, Login, Register and any authenticated page.
    useEffect(() => {
        const loadPublicSettings = async () => {
            try {
                setLoading(true);
                const response = await api.getPublicSettings();
                if (response && response.settings) {
                    setSettings((prev) => ({ ...prev, ...response.settings }));
                }
            } catch (err) {
                console.error("Failed to load public settings:", err);
                // Silently fall back to defaults — never break the UI
            } finally {
                setLoading(false);
            }
        };

        loadPublicSettings();
    }, []);

    // ── After login, fetch the full admin settings (richer data) ──
    const fetchPublicSettings = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await api.getAdminSettings();
            if (response && response.settings) {
                setSettings((prev) => ({ ...prev, ...response.settings }));
            }
        } catch (err) {
            // If it fails (e.g. non-admin token), public settings already loaded — no-op
            console.error("Failed to fetch admin settings:", err);
        }
    }, []);

    // Apply appearance settings to <html>
    useEffect(() => { applyDarkMode(settings.darkModeDefault); }, [settings.darkModeDefault]);
    useEffect(() => { applyCompactMode(settings.compactMode); }, [settings.compactMode]);
    useEffect(() => { applyReducedMotion(settings.reducedMotion); }, [settings.reducedMotion]);
    useEffect(() => { applyBorderRadius(settings.borderRadius); }, [settings.borderRadius]);

    const applyDarkMode = (isDark) => {
        const html = document.documentElement;
        if (isDark) {
            html.classList.add("dark");
            html.style.colorScheme = "dark";
        } else {
            html.classList.remove("dark");
            html.style.colorScheme = "light";
        }
    };

    const applyCompactMode = (isCompact) => {
        document.documentElement.classList.toggle("compact-mode", isCompact);
    };

    const applyReducedMotion = (isReduced) => {
        document.documentElement.classList.toggle("reduced-motion", isReduced);
    };

    const applyBorderRadius = (radius) => {
        const html = document.documentElement;
        html.classList.remove("radius-sharp", "radius-rounded", "radius-pill");
        html.classList.add(`radius-${radius}`);
    };

    const updateSettings = useCallback((newSettings) => {
        setSettings((prev) => ({ ...prev, ...newSettings }));
    }, []);

    const value = {
        settings,
        loading,
        error,
        fetchPublicSettings,
        updateSettings,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};
