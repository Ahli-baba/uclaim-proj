import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import {
    Users, ArrowRight, ArrowUpRight,
    FileText, AlertCircle, Layers, Shield,
    Settings, UserPlus, Package,
} from "lucide-react";

// ── Theme: Steel Blue / Navy Slate / Cool Gray ────────────────────────────────
const T = {
    navy: "#1D3557",
    steel: "#468FAF",
    cool: "#F8F9FA",
    white: "#FFFFFF",
    text: "#1D3557",
    textLight: "#6B7280",
    border: "rgba(29,53,87,0.08)",
    surface: "#FFFFFF",
    hover: "rgba(70,143,175,0.06)",
};

function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState("week");
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "{}");

        if (!token || user.role !== "admin") {
            navigate("/login");
            return;
        }

        fetchStats();
        fetchSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeRange]);

    const fetchSettings = async () => {
        try {
            const data = await api.getAdminSettings();
            setSettings(data.settings);
        } catch (err) {
            console.error("Failed to fetch settings:", err);
        }
    };

    const fetchStats = async () => {
        setLoading(true);
        try {
            const data = await api.getAdminStatsByRange(timeRange);
            setStats(data);
        } catch (err) {
            console.error("Failed to fetch stats:", err);
            try {
                const oldData = await api.getAdminStats();
                setStats(oldData);
            } catch (fallbackErr) {
                if (err.message?.includes("401") || err.message?.includes("403")) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/login");
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const getTimeRangeLabel = () => {
        const labels = { today: "Today", week: "This Week", month: "This Month", year: "This Year" };
        return labels[timeRange] || "This Week";
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="h-8 w-64 bg-[#1D3557]/10 rounded animate-pulse" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-28 bg-white rounded-2xl border animate-pulse" style={{ borderColor: T.border }} />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-72 bg-white rounded-2xl border animate-pulse" style={{ borderColor: T.border }} />
                    ))}
                </div>
            </div>
        );
    }

    const overview = stats?.overview || {};
    const totalUsers = overview.totalUsers || 0;

    const commandStats = [
        { label: "Total Users", value: totalUsers, icon: Users, onClick: () => navigate("/admin/users") },
        { label: "New Users", value: stats?.overview?.newUsers || 0, icon: UserPlus, onClick: () => navigate("/admin/users") },
        { label: "Total Items", value: stats?.overview?.totalItems || 0, icon: Package, onClick: () => navigate("/admin/reports") },
        { label: "System Reports", value: "View", icon: FileText, onClick: () => navigate("/admin/reports") },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8">

            {/* ── Header ───────────────────────────────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-6" style={{ borderBottom: `1px solid ${T.border}` }}>
                <div className="space-y-1">
                    <h1 className="text-3xl lg:text-4xl font-bold tracking-tight" style={{ color: T.navy }}>
                        Dashboard Overview
                    </h1>
                    <p className="text-sm" style={{ color: T.textLight }}>
                        Live metrics for {getTimeRangeLabel().toLowerCase()}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-white border" style={{ borderColor: T.border }}>
                        {["today", "week", "month", "year"].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className="px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-200"
                                style={{
                                    backgroundColor: timeRange === range ? T.navy : "transparent",
                                    color: timeRange === range ? T.white : T.textLight,
                                }}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Command Bar ──────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {commandStats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <button
                            key={idx}
                            onClick={stat.onClick}
                            className="group relative text-left p-5 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 bg-white border hover:shadow-lg"
                            style={{ borderColor: T.border, boxShadow: "0 1px 3px rgba(29,53,87,0.04)" }}
                        >
                            <div className="mb-4">
                                <div className="p-2 rounded-xl inline-flex" style={{ backgroundColor: "rgba(70,143,175,0.08)" }}>
                                    <Icon className="w-5 h-5" style={{ color: T.steel }} />
                                </div>
                            </div>
                            <div>
                                <p className="text-3xl font-bold tracking-tight" style={{ color: T.navy }}>{stat.value}</p>
                                <p className="text-xs font-medium mt-1" style={{ color: T.textLight }}>{stat.label}</p>
                            </div>
                            <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowUpRight className="w-4 h-4" style={{ color: T.steel }} />
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── Pending Alerts ───────────────────────────────────────────────────── */}
            {((stats?.claims?.claimReqPending || 0) > 0 || (stats?.claims?.finderPending || 0) > 0) && (
                <div className="flex items-center gap-4 px-5 py-3.5 rounded-2xl border" style={{ backgroundColor: "rgba(217,119,6,0.05)", borderColor: "rgba(217,119,6,0.2)" }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#D97706" }} />
                    <p className="text-sm flex-1" style={{ color: "#92400E" }}>
                        {(stats?.claims?.claimReqPending || 0) > 0 && (
                            <span><strong>{stats.claims.claimReqPending}</strong> claim request{stats.claims.claimReqPending > 1 ? "s" : ""} pending review. </span>
                        )}
                        {(stats?.claims?.finderPending || 0) > 0 && (
                            <span><strong>{stats.claims.finderPending}</strong> finder report{stats.claims.finderPending > 1 ? "s" : ""} awaiting SAO confirmation.</span>
                        )}
                    </p>
                    <button onClick={() => navigate("/admin/reports")} className="text-xs font-bold flex-shrink-0 px-3 py-1.5 rounded-lg transition-all hover:opacity-80" style={{ backgroundColor: "rgba(217,119,6,0.12)", color: "#D97706" }}>
                        View Reports →
                    </button>
                </div>
            )}

            {/* ── Bottom Row ───────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Items Summary */}
                <div className="rounded-2xl p-6 space-y-4 bg-white border" style={{ borderColor: T.border }}>
                    <div className="flex items-center gap-2.5">
                        <Package className="w-4 h-4" style={{ color: T.steel }} />
                        <h3 className="text-sm font-bold tracking-wide" style={{ color: T.navy }}>Items Summary</h3>
                    </div>
                    <div className="space-y-1">
                        {[
                            { label: "Lost Items", value: stats?.overview?.lostItems || 0, color: "#EF4444" },
                            { label: "Found Items", value: stats?.overview?.foundItems || 0, color: "#10B981" },
                            { label: "At SAO", value: stats?.overview?.itemsAtSAO || 0, color: T.steel },
                            { label: "Resolved", value: stats?.overview?.resolvedItems || 0, color: "#7C3AED" },
                        ].map((row, i) => (
                            <div key={i} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: T.border }}>
                                <span className="text-xs" style={{ color: T.textLight }}>{row.label}</span>
                                <span className="text-sm font-bold" style={{ color: row.color }}>{row.value}</span>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => navigate("/admin/reports")}
                        className="w-full py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                        style={{ backgroundColor: "rgba(70,143,175,0.08)", color: T.steel }}
                    >
                        Full Report →
                    </button>
                </div>

                {/* User Distribution */}
                <div className="rounded-2xl p-6 space-y-5 bg-white border" style={{ borderColor: T.border }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Layers className="w-4 h-4" style={{ color: T.steel }} />
                            <h3 className="text-sm font-bold tracking-wide" style={{ color: T.navy }}>User Distribution</h3>
                        </div>
                        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#F8F9FA]" style={{ color: T.textLight }}>
                            {totalUsers} total
                        </span>
                    </div>
                    <div className="space-y-4">
                        {stats?.usersByRole && Object.entries(stats.usersByRole).filter(([role]) => role !== "faculty").map(([role, count]) => {
                            const pct = totalUsers > 0 ? (count / totalUsers) * 100 : 0;
                            return (
                                <div key={role} className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="capitalize font-medium" style={{ color: T.navy }}>{role}</span>
                                        <span className="font-bold" style={{ color: T.navy }}>{count}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full overflow-hidden bg-[#F8F9FA]">
                                        <div
                                            className="h-full rounded-full transition-all duration-700 ease-out"
                                            style={{ width: `${pct}%`, backgroundColor: pct > 50 ? T.steel : T.navy }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {(!stats?.usersByRole || Object.keys(stats.usersByRole).length === 0) && (
                            <div className="py-8 text-center text-xs" style={{ color: T.textLight }}>No user role data available</div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="rounded-2xl p-6 space-y-5 bg-white border" style={{ borderColor: T.border }}>
                    <div className="flex items-center gap-2.5">
                        <Shield className="w-4 h-4" style={{ color: T.steel }} />
                        <h3 className="text-sm font-bold tracking-wide" style={{ color: T.navy }}>Quick Actions</h3>
                    </div>
                    <div className="space-y-2">
                        <QuickAction icon={UserPlus} label="Add New User" desc="Create staff or admin accounts" onClick={() => navigate("/admin/users")} />
                        <QuickAction icon={FileText} label="View Reports" desc="System analytics & exports" onClick={() => navigate("/admin/reports")} />
                        <QuickAction icon={Settings} label="System Settings" desc="Configure platform settings" onClick={() => navigate("/admin/settings")} />
                    </div>
                </div>

                {/* System Status */}
                <div className="rounded-2xl p-6 space-y-5 bg-white border" style={{ borderColor: T.border }}>
                    <div className="flex items-center gap-2.5">
                        <AlertCircle className="w-4 h-4" style={{ color: T.steel }} />
                        <h3 className="text-sm font-bold tracking-wide" style={{ color: T.navy }}>System Status</h3>
                    </div>
                    <div className="space-y-3">
                        <StatusItem
                            label="Platform"
                            status={settings?.maintenanceMode ? "Maintenance" : "Operational"}
                            color={settings?.maintenanceMode ? "red" : "green"}
                        />
                        <StatusItem label="User Auth" status="Active" color="green" />
                        <StatusItem label="Email Service" status="Active" color="green" />
                        {settings?.maintenanceMode && settings?.maintenanceMessage && (
                            <div className="px-3 py-2 rounded-lg text-[11px]" style={{ backgroundColor: "rgba(239,68,68,0.06)", color: "#991B1B" }}>
                                {settings.maintenanceMessage}
                            </div>
                        )}
                        <div className="pt-3 mt-1 border-t" style={{ borderColor: T.border }}>
                            <p className="text-[11px]" style={{ color: T.textLight }}>
                                Last updated: {new Date().toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const QuickAction = ({ icon: Icon, label, desc, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 hover:bg-[#F8F9FA] group"
    >
        <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: "rgba(70,143,175,0.08)" }}>
            <Icon className="w-4 h-4" style={{ color: T.steel }} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold" style={{ color: T.navy }}>{label}</p>
            <p className="text-[11px]" style={{ color: T.textLight }}>{desc}</p>
        </div>
        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: T.steel }} />
    </button>
);

const StatusItem = ({ label, status, color }) => (
    <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: T.textLight }}>{label}</span>
        <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{
                backgroundColor: color === "green" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                color: color === "green" ? "#059669" : "#DC2626",
            }}
        >
            {status}
        </span>
    </div>
);

export default AdminDashboard;
