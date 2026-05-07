import { useState, useEffect, useCallback, useMemo } from "react";
import { Save, RefreshCw, Bell, Shield, Database, Mail, Palette, Globe, Moon, Sun, AlertTriangle, CheckCircle, X, Loader2, AlertCircle, LayoutTemplate, Type, Minimize2, Zap } from "lucide-react";
import { api } from "../../services/api";

function AdminSettings() {
    const [activeTab, setActiveTab] = useState("general");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("Settings saved successfully!");
    const [toastType, setToastType] = useState("success");
    const [error, setError] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [savedSettings, setSavedSettings] = useState(null);

    const defaultSettings = useMemo(() => ({
        siteName: "UClaim",
        siteDescription: "University Lost & Found Management System",
        contactEmail: "admin@university.edu",
        universityName: "University Name",
        darkModeDefault: false,
        compactMode: false,
        reducedMotion: false,
        showSidebarLabels: true,
        borderRadius: "rounded",
        emailNotifications: true,
        adminAlerts: true,
        newItemAlert: true,
        newClaimAlert: true,
        newUserAlert: false,
        dailyDigest: true,
        requireEmailVerification: false,
        maxLoginAttempts: 5,
        lockoutDuration: 30,
        sessionTimeout: 60,
        passwordMinLength: 8,
        requireStrongPassword: true,
        autoArchiveDays: 30,
        maxImageSize: 5,
        maxImagesPerItem: 5,
        itemsPerPage: 10,
        enableComments: true,
        requireApproval: false,
        maintenanceMode: false,
        maintenanceMessage: "System is under maintenance. Please check back later.",
        maintenanceStart: "",
        maintenanceEnd: ""
    }), []);

    const [settings, setSettings] = useState(defaultSettings);

    // Track initial settings for unsaved changes detection
    useEffect(() => {
        if (savedSettings) {
            const hasChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);
            setHasUnsavedChanges(hasChanges);
        }
    }, [settings, savedSettings]);

    // Handle beforeunload for unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = "";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.getAdminSettings();
            let fetchedSettings = {};
            if (response && response.settings) {
                fetchedSettings = response.settings;
            } else if (response && typeof response === 'object') {
                fetchedSettings = response;
            }
            const mergedSettings = { ...defaultSettings, ...fetchedSettings };
            setSettings(mergedSettings);
            setSavedSettings(JSON.parse(JSON.stringify(mergedSettings)));
        } catch (err) {
            setError("Failed to load settings from server");
        } finally {
            setLoading(false);
        }
    }, [defaultSettings]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const showToastMessage = (message, type = "success") => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const validateField = (key, value) => {
        const errors = {};

        switch (key) {
            case 'maxLoginAttempts':
                if (value < 3) errors[key] = "Minimum 3 attempts required";
                if (value > 10) errors[key] = "Maximum 10 attempts allowed";
                break;
            case 'lockoutDuration':
                if (value < 5) errors[key] = "Minimum 5 minutes required";
                if (value > 120) errors[key] = "Maximum 120 minutes allowed";
                break;
            case 'sessionTimeout':
                if (value < 15) errors[key] = "Minimum 15 minutes required";
                if (value > 240) errors[key] = "Maximum 240 minutes allowed";
                break;
            case 'passwordMinLength':
                if (value < 6) errors[key] = "Minimum 6 characters required";
                if (value > 20) errors[key] = "Maximum 20 characters allowed";
                break;
            case 'autoArchiveDays':
                if (value < 7) errors[key] = "Minimum 7 days required";
                if (value > 365) errors[key] = "Maximum 365 days allowed";
                break;
            case 'maxImageSize':
                if (value < 1) errors[key] = "Minimum 1 MB required";
                if (value > 20) errors[key] = "Maximum 20 MB allowed";
                break;
            case 'maxImagesPerItem':
                if (value < 1) errors[key] = "Minimum 1 image required";
                if (value > 10) errors[key] = "Maximum 10 images allowed";
                break;
            case 'itemsPerPage':
                if (value < 5) errors[key] = "Minimum 5 items required";
                if (value > 100) errors[key] = "Maximum 100 items allowed";
                break;
            default:
                break;
        }

        return errors;
    };

    const handleSave = async () => {
        // Validate all fields before saving
        let allErrors = {};
        Object.keys(settings).forEach(key => {
            const fieldErrors = validateField(key, settings[key]);
            allErrors = { ...allErrors, ...fieldErrors };
        });

        if (Object.keys(allErrors).length > 0) {
            setValidationErrors(allErrors);
            showToastMessage("Please fix validation errors before saving", "error");
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const response = await api.saveAdminSettings(settings);
            if (response && (response.message || response.settings)) {
                setSavedSettings(JSON.parse(JSON.stringify(settings)));
                setHasUnsavedChanges(false);
                showToastMessage("Settings saved successfully!", "success");
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (err) {
            showToastMessage("Failed to save settings", "error");
            setError("Could not connect to server");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        setLoading(true);
        try {
            await api.resetAdminSettings();
            await fetchSettings();
            showToastMessage("Settings reset to defaults", "success");
        } catch (err) {
            showToastMessage("Server reset failed, using local defaults", "warning");
            setSettings(defaultSettings);
            setSavedSettings(JSON.parse(JSON.stringify(defaultSettings)));
            setHasUnsavedChanges(false);
        } finally {
            setLoading(false);
            setShowResetModal(false);
        }
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));

        const fieldErrors = validateField(key, value);
        setValidationErrors(prev => ({
            ...prev,
            [key]: fieldErrors[key] || undefined
        }));
    };

    const tabs = [
        { id: "general", label: "General", icon: Globe, color: "blue" },
        { id: "appearance", label: "Appearance", icon: Palette, color: "purple" },
        { id: "notifications", label: "Notifications", icon: Bell, color: "amber" },
        { id: "security", label: "Security", icon: Shield, color: "emerald" },
        { id: "system", label: "System", icon: Database, color: "indigo" },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Toast Notification */}
            {showToast && (
                <div className={`fixed top-24 right-8 z-50 flex items-center gap-3 px-6 py-4 text-white rounded-xl shadow-lg animate-in slide-in-from-right ${toastType === "success" ? "bg-emerald-600" : toastType === "error" ? "bg-red-600" : "bg-amber-500"}`}>
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">{toastMessage}</span>
                    <button onClick={() => setShowToast(false)} className="ml-2 hover:opacity-70">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Reset Confirmation Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Reset Settings?</h3>
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-600 mb-6">
                                Are you sure you want to reset all settings to default? This action cannot be undone and will revert all configurations to their original values.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowResetModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReset}
                                    disabled={loading}
                                    className="px-6 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50"
                                >
                                    {loading ? "Resetting..." : "Reset to Default"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
                    <div className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto hover:text-red-900">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-slate-900">System Settings</h1>
                        {hasUnsavedChanges && (
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4" />
                                Unsaved changes
                            </span>
                        )}
                        {settings.maintenanceMode && (
                            <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4" />
                                Maintenance ON
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500 mt-1">Configure your UClaim instance preferences</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowResetModal(true)}
                        disabled={saving || loading}
                        className="px-4 py-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl font-medium transition disabled:opacity-50"
                    >
                        Reset Default
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading || !hasUnsavedChanges}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50 shadow-lg shadow-indigo-200"
                    >
                        {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const activeColors = {
                        blue: "bg-blue-50 text-blue-600",
                        purple: "bg-purple-50 text-purple-600",
                        amber: "bg-amber-50 text-amber-600",
                        emerald: "bg-emerald-50 text-emerald-600",
                        indigo: "bg-indigo-50 text-indigo-600",
                        pink: "bg-pink-50 text-pink-600"
                    };
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition whitespace-nowrap ${isActive ? activeColors[tab.color] : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
                        >
                            <Icon className="w-5 h-5" />
                            {tab.label}
                            {tab.id === "system" && settings.maintenanceMode && (
                                <span className="w-2 h-2 bg-red-500 rounded-full ml-1 animate-pulse" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {activeTab === "general" && (
                    <div className="p-8 space-y-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Globe className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">General Configuration</h2>
                                <p className="text-sm text-slate-500">Basic site information and contact details</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Site Name</label>
                                <input
                                    type="text"
                                    value={settings.siteName}
                                    onChange={(e) => handleChange("siteName", e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">University Name</label>
                                <input
                                    type="text"
                                    value={settings.universityName}
                                    onChange={(e) => handleChange("universityName", e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-slate-700">Site Description</label>
                                <textarea
                                    value={settings.siteDescription}
                                    onChange={(e) => handleChange("siteDescription", e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Contact Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        value={settings.contactEmail}
                                        onChange={(e) => handleChange("contactEmail", e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "appearance" && (
                    <div className="p-8 space-y-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <Palette className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Appearance</h2>
                                <p className="text-sm text-slate-500">Customize the look and feel of your admin interface</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Dark Mode Toggle */}
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            {settings.darkModeDefault ? <Moon className="w-5 h-5 text-indigo-600" /> : <Sun className="w-5 h-5 text-amber-500" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">Default Dark Mode</p>
                                            <p className="text-sm text-slate-500">Enable dark mode by default for all users</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleChange("darkModeDefault", !settings.darkModeDefault)}
                                        className={`w-14 h-8 rounded-full transition relative ${settings.darkModeDefault ? "bg-indigo-600" : "bg-slate-300"}`}
                                    >
                                        <span className={`absolute top-1 w-6 h-6 bg-white rounded-full transition ${settings.darkModeDefault ? "left-7" : "left-1"}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Compact Mode */}
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <Minimize2 className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">Compact Mode</p>
                                            <p className="text-sm text-slate-500">Reduce padding and spacing for more content density</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleChange("compactMode", !settings.compactMode)}
                                        className={`w-14 h-8 rounded-full transition relative ${settings.compactMode ? "bg-emerald-600" : "bg-slate-300"}`}
                                    >
                                        <span className={`absolute top-1 w-6 h-6 bg-white rounded-full transition ${settings.compactMode ? "left-7" : "left-1"}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Reduced Motion */}
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <Zap className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">Reduced Motion</p>
                                            <p className="text-sm text-slate-500">Minimize animations for accessibility and performance</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleChange("reducedMotion", !settings.reducedMotion)}
                                        className={`w-14 h-8 rounded-full transition relative ${settings.reducedMotion ? "bg-amber-600" : "bg-slate-300"}`}
                                    >
                                        <span className={`absolute top-1 w-6 h-6 bg-white rounded-full transition ${settings.reducedMotion ? "left-7" : "left-1"}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Show Sidebar Labels */}
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <Type className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">Show Sidebar Labels</p>
                                            <p className="text-sm text-slate-500">Display text labels next to sidebar icons</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleChange("showSidebarLabels", !settings.showSidebarLabels)}
                                        className={`w-14 h-8 rounded-full transition relative ${settings.showSidebarLabels ? "bg-blue-600" : "bg-slate-300"}`}
                                    >
                                        <span className={`absolute top-1 w-6 h-6 bg-white rounded-full transition ${settings.showSidebarLabels ? "left-7" : "left-1"}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Border Radius */}
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                        <LayoutTemplate className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">Border Radius Style</p>
                                        <p className="text-sm text-slate-500">Choose the corner roundness for UI elements</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { value: "sharp", label: "Sharp", desc: "0px corners" },
                                        { value: "rounded", label: "Rounded", desc: "8px corners" },
                                        { value: "pill", label: "Pill", desc: "Full rounded" }
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleChange("borderRadius", option.value)}
                                            className={`p-4 rounded-xl border-2 transition text-left ${settings.borderRadius === option.value
                                                ? "border-purple-600 bg-purple-50"
                                                : "border-slate-200 hover:border-purple-200"
                                                }`}
                                        >
                                            <div className={`w-full h-8 mb-2 bg-purple-200 ${option.value === "sharp" ? "rounded-none" :
                                                option.value === "rounded" ? "rounded-lg" :
                                                    "rounded-full"
                                                }`} />
                                            <p className="font-semibold text-slate-900">{option.label}</p>
                                            <p className="text-xs text-slate-500">{option.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "notifications" && (
                    <div className="p-8 space-y-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-amber-100 rounded-xl">
                                <Bell className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
                                <p className="text-sm text-slate-500">Configure alert preferences</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {[
                                { key: "emailNotifications", label: "Email Notifications", desc: "Send email alerts to users and admins" },
                                { key: "adminAlerts", label: "Admin Alerts", desc: "Critical alerts for administrators" },
                                { key: "newItemAlert", label: "New Item Alerts", desc: "Notify when new items are reported" },
                                { key: "newClaimAlert", label: "New Claim Alerts", desc: "Notify when users submit claims" },
                                { key: "newUserAlert", label: "New User Alerts", desc: "Notify when new users register" },
                                { key: "dailyDigest", label: "Daily Digest", desc: "Send daily summary of activities" },
                            ].map((item) => (
                                <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div>
                                        <p className="font-semibold text-slate-900">{item.label}</p>
                                        <p className="text-sm text-slate-500">{item.desc}</p>
                                    </div>
                                    <button
                                        onClick={() => handleChange(item.key, !settings[item.key])}
                                        className={`w-14 h-8 rounded-full transition relative ${settings[item.key] ? "bg-indigo-600" : "bg-slate-300"}`}
                                    >
                                        <span className={`absolute top-1 w-6 h-6 bg-white rounded-full transition ${settings[item.key] ? "left-7" : "left-1"}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "security" && (
                    <div className="p-8 space-y-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-emerald-100 rounded-xl">
                                <Shield className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Security</h2>
                                <p className="text-sm text-slate-500">Authentication and access control</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="font-semibold text-slate-900">Email Verification</p>
                                    <button
                                        onClick={() => handleChange("requireEmailVerification", !settings.requireEmailVerification)}
                                        className={`w-14 h-8 rounded-full transition relative ${settings.requireEmailVerification ? "bg-emerald-600" : "bg-slate-300"}`}
                                    >
                                        <span className={`absolute top-1 w-6 h-6 bg-white rounded-full transition ${settings.requireEmailVerification ? "left-7" : "left-1"}`} />
                                    </button>
                                </div>
                                <p className="text-sm text-slate-500">Require users to verify email before accessing the system</p>
                            </div>

                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="font-semibold text-slate-900">Strong Passwords</p>
                                    <button
                                        onClick={() => handleChange("requireStrongPassword", !settings.requireStrongPassword)}
                                        className={`w-14 h-8 rounded-full transition relative ${settings.requireStrongPassword ? "bg-emerald-600" : "bg-slate-300"}`}
                                    >
                                        <span className={`absolute top-1 w-6 h-6 bg-white rounded-full transition ${settings.requireStrongPassword ? "left-7" : "left-1"}`} />
                                    </button>
                                </div>
                                <p className="text-sm text-slate-500">Require uppercase, numbers, and special characters</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Max Login Attempts</label>
                                <input
                                    type="number"
                                    min="3"
                                    max="10"
                                    value={settings.maxLoginAttempts}
                                    onChange={(e) => handleChange("maxLoginAttempts", parseInt(e.target.value) || 5)}
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition ${validationErrors.maxLoginAttempts ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500'}`}
                                />
                                {validationErrors.maxLoginAttempts && (
                                    <p className="text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {validationErrors.maxLoginAttempts}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Lockout Duration (minutes)</label>
                                <input
                                    type="number"
                                    min="5"
                                    max="120"
                                    value={settings.lockoutDuration}
                                    onChange={(e) => handleChange("lockoutDuration", parseInt(e.target.value) || 30)}
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition ${validationErrors.lockoutDuration ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500'}`}
                                />
                                {validationErrors.lockoutDuration && (
                                    <p className="text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {validationErrors.lockoutDuration}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Session Timeout (minutes)</label>
                                <input
                                    type="number"
                                    min="15"
                                    max="240"
                                    value={settings.sessionTimeout}
                                    onChange={(e) => handleChange("sessionTimeout", parseInt(e.target.value) || 60)}
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition ${validationErrors.sessionTimeout ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500'}`}
                                />
                                {validationErrors.sessionTimeout && (
                                    <p className="text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {validationErrors.sessionTimeout}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Min Password Length</label>
                                <input
                                    type="number"
                                    min="6"
                                    max="20"
                                    value={settings.passwordMinLength}
                                    onChange={(e) => handleChange("passwordMinLength", parseInt(e.target.value) || 8)}
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition ${validationErrors.passwordMinLength ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500'}`}
                                />
                                {validationErrors.passwordMinLength && (
                                    <p className="text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {validationErrors.passwordMinLength}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "system" && (
                    <div className="p-8 space-y-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-indigo-100 rounded-xl">
                                <Database className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">System</h2>
                                <p className="text-sm text-slate-500">Data management and maintenance</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Auto-Archive Items (days)</label>
                                <input
                                    type="number"
                                    min="7"
                                    max="365"
                                    value={settings.autoArchiveDays}
                                    onChange={(e) => handleChange("autoArchiveDays", parseInt(e.target.value) || 30)}
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition ${validationErrors.autoArchiveDays ? 'border-red-500 focus:ring-red-500' : 'border-slate-200'}`}
                                />
                                {validationErrors.autoArchiveDays && (
                                    <p className="text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {validationErrors.autoArchiveDays}
                                    </p>
                                )}
                                <p className="text-xs text-slate-500">Items inactive for longer will be archived</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Max Image Size (MB)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={settings.maxImageSize}
                                    onChange={(e) => handleChange("maxImageSize", parseInt(e.target.value) || 5)}
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition ${validationErrors.maxImageSize ? 'border-red-500 focus:ring-red-500' : 'border-slate-200'}`}
                                />
                                {validationErrors.maxImageSize && (
                                    <p className="text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {validationErrors.maxImageSize}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Max Images Per Item</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={settings.maxImagesPerItem}
                                    onChange={(e) => handleChange("maxImagesPerItem", parseInt(e.target.value) || 5)}
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition ${validationErrors.maxImagesPerItem ? 'border-red-500 focus:ring-red-500' : 'border-slate-200'}`}
                                />
                                {validationErrors.maxImagesPerItem && (
                                    <p className="text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {validationErrors.maxImagesPerItem}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Items Per Page</label>
                                <input
                                    type="number"
                                    min="5"
                                    max="100"
                                    step="5"
                                    value={settings.itemsPerPage}
                                    onChange={(e) => handleChange("itemsPerPage", parseInt(e.target.value) || 10)}
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition ${validationErrors.itemsPerPage ? 'border-red-500 focus:ring-red-500' : 'border-slate-200'}`}
                                />
                                {validationErrors.itemsPerPage && (
                                    <p className="text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {validationErrors.itemsPerPage}
                                    </p>
                                )}
                                <p className="text-xs text-slate-500">Enter a value between 5 and 100 (increments of 5)</p>
                            </div>
                        </div>

                        <div className={`mt-8 p-6 border-2 rounded-2xl ${settings.maintenanceMode ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-lg ${settings.maintenanceMode ? 'bg-red-100' : 'bg-amber-100'}`}>
                                    <AlertTriangle className={`w-6 h-6 ${settings.maintenanceMode ? 'text-red-600' : 'text-amber-600'}`} />
                                </div>
                                <div className="flex-1">
                                    <p className={`font-bold text-lg ${settings.maintenanceMode ? 'text-red-900' : 'text-amber-900'}`}>Maintenance Mode</p>
                                    <p className={`text-sm ${settings.maintenanceMode ? 'text-red-700' : 'text-amber-700'}`}>Temporarily disable the site for maintenance</p>
                                </div>
                                <button
                                    onClick={() => handleChange("maintenanceMode", !settings.maintenanceMode)}
                                    className={`w-16 h-9 rounded-full transition relative ${settings.maintenanceMode ? "bg-red-600" : "bg-amber-300"}`}
                                >
                                    <span className={`absolute top-1 w-7 h-7 bg-white rounded-full transition ${settings.maintenanceMode ? "left-8" : "left-1"}`} />
                                </button>
                            </div>

                            {settings.maintenanceMode && (
                                <div className="space-y-4 mt-4">
                                    <div className="flex items-center gap-2 p-3 bg-red-100 rounded-lg text-red-800 text-sm font-medium">
                                        <AlertCircle className="w-4 h-4" />
                                        Warning: Site is currently in maintenance mode. Users cannot access the system.
                                    </div>
                                    <textarea
                                        value={settings.maintenanceMessage}
                                        onChange={(e) => handleChange("maintenanceMessage", e.target.value)}
                                        placeholder="Maintenance message to display to users..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-white border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                    />
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="text-xs font-semibold text-red-800 mb-1 block">Start Time</label>
                                            <input
                                                type="datetime-local"
                                                value={settings.maintenanceStart}
                                                onChange={(e) => handleChange("maintenanceStart", e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-sm"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs font-semibold text-red-800 mb-1 block">End Time (Optional)</label>
                                            <input
                                                type="datetime-local"
                                                value={settings.maintenanceEnd}
                                                onChange={(e) => handleChange("maintenanceEnd", e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default AdminSettings;