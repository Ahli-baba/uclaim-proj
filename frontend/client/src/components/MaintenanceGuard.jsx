import React, { useEffect, useState } from "react";
import { useSettings } from "../contexts/SettingsContext";
import { AlertTriangle, Clock } from "lucide-react";

const MaintenanceGuard = ({ children }) => {
    const { settings } = useSettings();
    const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);

    useEffect(() => {
        if (settings.maintenanceMode) {
            const now = new Date();
            const start = settings.maintenanceStart ? new Date(settings.maintenanceStart) : null;
            const end = settings.maintenanceEnd ? new Date(settings.maintenanceEnd) : null;

            const hasStarted = !start || now >= start;
            const hasEnded = end && now >= end;

            if (hasStarted && !hasEnded) {
                setIsMaintenanceActive(true);
            } else {
                setIsMaintenanceActive(false);
            }
        } else {
            setIsMaintenanceActive(false);
        }
    }, [settings]);

    // Check user role from localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isAdmin = user.role === "admin";

    // Admins can bypass maintenance mode
    if (isMaintenanceActive && !isAdmin) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-10 h-10 text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-4">
                        System Maintenance
                    </h1>
                    <p className="text-slate-600 mb-6">
                        {settings.maintenanceMessage || "We are currently performing scheduled maintenance. Please check back later."}
                    </p>

                    {(settings.maintenanceStart || settings.maintenanceEnd) && (
                        <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 space-y-2">
                            {settings.maintenanceStart && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>Started: {new Date(settings.maintenanceStart).toLocaleString()}</span>
                                </div>
                            )}
                            {settings.maintenanceEnd && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>Expected back: {new Date(settings.maintenanceEnd).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition"
                    >
                        Check Again
                    </button>
                </div>
            </div>
        );
    }

    return children;
};

export default MaintenanceGuard;