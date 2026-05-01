import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import {
    Users, Package, CheckCircle, Clock,
    TrendingUp, Activity, ArrowRight,
    ArrowUpRight, PackagePlus, ClipboardCheck, UserCheck,
    FileText, AlertCircle, Layers
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
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "{}");

        if (!token || user.role !== "admin") {
            navigate("/login");
            return;
        }

        fetchStats();
        fetchRecentActivity();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeRange]);

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

    const fetchRecentActivity = async () => {
        try {
            const cutoffDate = getCutoffDate(timeRange);
            const [items, claims] = await Promise.all([
                api.getAllItemsAdmin({}),
                api.getAllClaimsAdmin("").catch(() => [])
            ]);

            const filteredItems = items.filter(item => new Date(item.createdAt) >= cutoffDate);
            const filteredClaims = claims.filter(c =>
                new Date(c.createdAt) >= cutoffDate && c.status === "pending"
            );

            const activities = [
                ...filteredItems.slice(0, 5).map(item => ({
                    id: item._id,
                    type: "item",
                    action: item.type === "lost" ? "Reported Lost" : "Reported Found",
                    title: item.title,
                    user: item.reportedBy?.name || "Unknown",
                    date: item.createdAt,
                    icon: item.type === "lost" ? "😞" : "🎉",
                    color: item.type === "lost" ? "red" : "green",
                    link: "/admin/items"
                })),
                ...filteredClaims.slice(0, 3).map(claim => ({
                    id: claim._id,
                    type: "claim",
                    action: "Claim Submitted",
                    title: claim.item?.title || "Unknown Item",
                    user: claim.claimant?.name || "Unknown",
                    date: claim.createdAt,
                    icon: "📋",
                    color: "yellow",
                    link: "/admin/claims"
                }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

            setRecentActivity(activities);
        } catch (err) {
            console.error("Failed to fetch recent activity:", err);
        }
    };

    const getCutoffDate = (range) => {
        const now = new Date();
        switch (range) {
            case "today": return new Date(now.setHours(0, 0, 0, 0));
            case "week": return new Date(now.setDate(now.getDate() - 7));
            case "month": return new Date(now.setMonth(now.getMonth() - 1));
            case "year": return new Date(now.setFullYear(now.getFullYear() - 1));
            default: return new Date(now.setDate(now.getDate() - 7));
        }
    };

    const getTimeRangeLabel = () => {
        const labels = { today: "Today", week: "This Week", month: "This Month", year: "This Year" };
        return labels[timeRange] || "This Week";
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMins = Math.floor((now - date) / 60000);
        const diffHours = Math.floor((now - date) / 3600000);
        const diffDays = Math.floor((now - date) / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString();
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
    const totalItems = overview.totalItems || 0;
    const claimedItems = overview.claimedItems || 0;
    const pendingItems = overview.pendingItems || 0;
    const lostItems = overview.lostItems || 0;
    const foundItems = overview.foundItems || 0;
    const recentItems = overview.recentItems || 0;
    const successRate = totalItems > 0 ? Math.round((claimedItems / totalItems) * 100) : 0;

    const commandStats = [
        { label: "Total Users", value: totalUsers, icon: Users, onClick: () => navigate("/admin/users") },
        { label: "Total Items", value: totalItems, icon: Package, onClick: () => navigate("/admin/items") },
        { label: "Claimed", value: claimedItems, icon: CheckCircle, onClick: () => navigate("/admin/items") },
        { label: "Active", value: pendingItems, icon: Clock, onClick: () => navigate("/admin/items") }
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

            {/* ── Main Grid ────────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* User Distribution — spans 5 cols */}
                <div className="lg:col-span-5 rounded-2xl p-6 space-y-5 bg-white border" style={{ borderColor: T.border }}>
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
                        {stats?.usersByRole && Object.entries(stats.usersByRole).map(([role, count]) => {
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
                                            style={{
                                                width: `${pct}%`,
                                                backgroundColor: pct > 50 ? T.steel : T.navy,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {(!stats?.usersByRole || Object.keys(stats.usersByRole).length === 0) && (
                            <div className="py-8 text-center text-xs" style={{ color: T.textLight }}>
                                No user role data available
                            </div>
                        )}
                    </div>
                </div>

                {/* Activity Overview — spans 4 cols */}
                <div className="lg:col-span-4 rounded-2xl p-6 space-y-5 bg-white border" style={{ borderColor: T.border }}>
                    <div className="flex items-center gap-2.5">
                        <Activity className="w-4 h-4" style={{ color: T.steel }} />
                        <h3 className="text-sm font-bold tracking-wide" style={{ color: T.navy }}>Activity Overview</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <MetricBox label="Lost Items" value={lostItems} icon={Package} />
                        <MetricBox label="Found Items" value={foundItems} icon={CheckCircle} />
                        <MetricBox label="New Items" value={recentItems} sublabel={getTimeRangeLabel()} icon={Clock} />
                        <div className="p-4 rounded-xl space-y-1 bg-[#F8F9FA]">
                            <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: T.textLight }}>
                                <TrendingUp className="w-3 h-3" />
                                Success Rate
                            </div>
                            <p className="text-2xl font-bold" style={{ color: T.steel }}>{successRate}%</p>
                        </div>
                    </div>
                </div>

                {/* Recent Activity — spans 3 cols */}
                <div className="lg:col-span-3 rounded-2xl p-6 space-y-5 bg-white border" style={{ borderColor: T.border }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4" style={{ color: T.steel }} />
                            <h3 className="text-sm font-bold tracking-wide" style={{ color: T.navy }}>Recent Activity</h3>
                        </div>
                        <button
                            onClick={() => navigate("/admin/items")}
                            className="text-[11px] font-semibold flex items-center gap-1 transition-colors hover:text-[#1D3557]"
                            style={{ color: T.steel }}
                        >
                            View All <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((activity) => (
                                <div
                                    key={`${activity.type}-${activity.id}`}
                                    onClick={() => navigate(activity.link)}
                                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group hover:bg-[#F8F9FA]"
                                >
                                    <div
                                        className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                                        style={{
                                            backgroundColor: activity.color === "red"
                                                ? "rgba(239,68,68,0.08)"
                                                : activity.color === "green"
                                                    ? "rgba(16,185,129,0.08)"
                                                    : "rgba(245,158,11,0.08)"
                                        }}
                                    >
                                        <span className="text-sm">{activity.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold truncate" style={{ color: T.navy }}>{activity.action}</p>
                                        <p className="text-[11px] truncate" style={{ color: T.textLight }}>{activity.title}</p>
                                    </div>
                                    <span className="text-[11px] font-medium flex-shrink-0" style={{ color: T.textLight }}>
                                        {formatTimeAgo(activity.date)}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 space-y-2">
                                <AlertCircle className="w-8 h-8 mx-auto opacity-20" style={{ color: T.navy }} />
                                <p className="text-xs" style={{ color: T.textLight }}>No recent activity</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Quick Actions ──────────────────────────────────────────────────────── */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold tracking-wide uppercase" style={{ color: T.textLight }}>
                    Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ActionCard
                        label="Inventory"
                        title="Manage Items"
                        desc={`${totalItems} items in system`}
                        icon={PackagePlus}
                        onClick={() => navigate("/admin/items")}
                    />
                    <ActionCard
                        label="Claims"
                        title="Review Claims"
                        desc="Check pending requests"
                        icon={ClipboardCheck}
                        onClick={() => navigate("/admin/claims")}
                    />
                    <ActionCard
                        label="Users"
                        title="Manage Users"
                        desc={`${totalUsers} registered users`}
                        icon={UserCheck}
                        onClick={() => navigate("/admin/users")}
                    />
                </div>
            </div>

        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const MetricBox = ({ label, value, sublabel, icon: Icon }) => (
    <div className="p-4 rounded-xl space-y-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 bg-[#F8F9FA]">
        <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: T.textLight }}>
            <Icon className="w-3 h-3" />
            {sublabel ? sublabel : label}
        </div>
        <p className="text-2xl font-bold" style={{ color: T.navy }}>{value}</p>
        {sublabel && <p className="text-[10px]" style={{ color: T.textLight }}>{label}</p>}
    </div>
);

const ActionCard = ({ label, title, desc, icon: Icon, onClick }) => (
    <button
        onClick={onClick}
        className="group relative w-full text-left p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden bg-white border hover:shadow-lg"
        style={{ borderColor: T.border }}
    >
        <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: T.steel }}>{label}</span>
                </div>
                <h3 className="text-lg font-bold" style={{ color: T.navy }}>{title}</h3>
                <p className="text-xs" style={{ color: T.textLight }}>{desc}</p>
            </div>
            <div
                className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{ backgroundColor: "rgba(70,143,175,0.08)" }}
            >
                <Icon className="w-5 h-5" style={{ color: T.steel }} />
            </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(to right, transparent, ${T.steel}40, transparent)` }} />
    </button>
);

export default AdminDashboard;