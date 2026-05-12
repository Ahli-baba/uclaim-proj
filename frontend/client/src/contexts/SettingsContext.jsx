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
        siteName: "UClaim",
        siteDescription: "University Lost & Found Management System",
        universityName: "University Name",
        contactEmail: "admin@university.edu",
        maintenanceMode: false,
        maintenanceMessage: "System is under maintenance. Please check back later.",
    });
    const [loading, setLoading] = useState(true);
    const [error] = useState(null);

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
