import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import {
    Users,
    Package,
    CheckCircle,
    Clock,
    TrendingUp,
    TrendingDown,
    Activity,
    ArrowRight,
    PackagePlus,
    ClipboardCheck,
    UserCheck,
    FileText,
    AlertCircle
} from "lucide-react";

function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState("week");
    const [recentActivity, setRecentActivity] = useState([]);

    // Check auth on mount
    useEffect(() => {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "{}");

        if (!token || user.role !== "admin") {
            navigate("/login");
            return;
        }

        fetchStats();
        fetchRecentActivity();
    }, [timeRange]);

    // 🔥 FIXED: Fetch real stats for selected time range
    const fetchStats = async () => {
        setLoading(true);
        try {
            // 🔥 NEW: Use the range-specific endpoint for real data
            const data = await api.getAdminStatsByRange(timeRange);
            setStats(data);
        } catch (err) {
            console.error("Failed to fetch stats:", err);
            // Fallback to old endpoint if new one fails (backward compatibility)
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

            // Filter by actual time range
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
            case "today":
                return new Date(now.setHours(0, 0, 0, 0));
            case "week":
                return new Date(now.setDate(now.getDate() - 7));
            case "month":
                return new Date(now.setMonth(now.getMonth() - 1));
            case "year":
                return new Date(now.setFullYear(now.getFullYear() - 1));
            default:
                return new Date(now.setDate(now.getDate() - 7));
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
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const statCards = [
        { title: "Total Users", value: stats?.overview?.totalUsers || 0, icon: Users, color: "blue", trend: "+12%", trendUp: true, link: "/admin/users" },
        { title: "Total Items", value: stats?.overview?.totalItems || 0, icon: Package, color: "indigo", trend: "+8%", trendUp: true, link: "/admin/items" },
        { title: "Claimed Items", value: stats?.overview?.claimedItems || 0, icon: CheckCircle, color: "green", trend: "+24%", trendUp: true, link: "/admin/items" },
        { title: "Active Items", value: stats?.overview?.pendingItems || 0, icon: Clock, color: "amber", trend: "-5%", trendUp: false, link: "/admin/items" }
    ];

    const colorClasses = {
        blue: "bg-blue-500/10 text-blue-600",
        indigo: "bg-indigo-500/10 text-indigo-600",
        green: "bg-emerald-500/10 text-emerald-600",
        amber: "bg-amber-500/10 text-amber-600"
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard Overview</h1>
                    <p className="text-slate-500 mt-1 text-sm">Welcome back! Here's what's happening {getTimeRangeLabel().toLowerCase()}.</p>
                </div>
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
                >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                </select>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={idx}
                            onClick={() => navigate(card.link)}
                            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer"
                        >
                            <div className="flex items-start justify-between">
                                <div className={`p-2.5 rounded-xl ${colorClasses[card.color]}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className={`flex items-center gap-1 text-xs font-medium ${card.trendUp ? "text-emerald-600" : "text-red-600"}`}>
                                    {card.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {card.trend}
                                </div>
                            </div>
                            <div className="mt-3">
                                <h3 className="text-2xl font-bold text-slate-900">{card.value}</h3>
                                <p className="text-slate-500 text-sm mt-0.5">{card.title}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-500" />
                        User Distribution
                    </h3>
                    <div className="space-y-3">
                        {stats?.usersByRole && Object.entries(stats.usersByRole).map(([role, count]) => (
                            <div key={role} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                                    <span className="text-slate-600 text-sm capitalize">{role}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full"
                                            style={{ width: `${(count / (stats?.overview?.totalUsers || 1)) * 100}%` }}></div>
                                    </div>
                                    <span className="font-semibold text-slate-900 text-sm w-6">{count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-500" />
                        Activity Overview
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition cursor-pointer" onClick={() => navigate("/admin/items")}>
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Package className="w-4 h-4" />
                                <span className="text-xs">Lost Items</span>
                            </div>
                            <p className="text-xl font-bold text-slate-900">{stats?.overview?.lostItems || 0}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition cursor-pointer" onClick={() => navigate("/admin/items")}>
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs">Found Items</span>
                            </div>
                            <p className="text-xl font-bold text-slate-900">{stats?.overview?.foundItems || 0}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition cursor-pointer" onClick={() => navigate("/admin/items")}>
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs">{getTimeRangeLabel()}</span>
                            </div>
                            <p className="text-xl font-bold text-slate-900">{stats?.overview?.recentItems || 0}</p>
                            <p className="text-xs text-slate-400 mt-0.5">New items</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition cursor-pointer" onClick={() => navigate("/admin/items")}>
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-xs">Success Rate</span>
                            </div>
                            <p className="text-xl font-bold text-emerald-600">
                                {stats?.overview?.totalItems > 0 ? Math.round((stats.overview.claimedItems / stats.overview.totalItems) * 100) : 0}%
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-amber-500" />
                            Recent Activity
                        </h3>
                        <button
                            onClick={() => navigate("/admin/items")}
                            className="text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1"
                        >
                            View All <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((activity) => (
                                <div
                                    key={`${activity.type}-${activity.id}`}
                                    onClick={() => navigate(activity.link)}
                                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition group"
                                >
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0
                                        ${activity.color === "red" ? "bg-red-100" : activity.color === "green" ? "bg-green-100" : "bg-amber-100"}`}>
                                        {activity.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">{activity.action}</p>
                                        <p className="text-xs text-slate-500 truncate">{activity.title}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-indigo-500 font-medium">{formatTimeAgo(activity.date)}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No recent activity</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div
                        onClick={() => navigate("/admin/items")}
                        className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-white cursor-pointer hover:shadow-lg hover:shadow-indigo-500/25 transition group"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <PackagePlus className="w-5 h-5 text-indigo-200" />
                                    <span className="text-indigo-100 text-xs font-medium uppercase tracking-wider">Inventory</span>
                                </div>
                                <h3 className="text-lg font-bold">Manage Items</h3>
                                <p className="text-indigo-100 text-sm mt-1">{stats?.overview?.totalItems || 0} items in system</p>
                            </div>
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition">
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={() => navigate("/admin/claims")}
                        className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-white cursor-pointer hover:shadow-lg hover:shadow-amber-500/25 transition group"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <ClipboardCheck className="w-5 h-5 text-amber-200" />
                                    <span className="text-amber-100 text-xs font-medium uppercase tracking-wider">Claims</span>
                                </div>
                                <h3 className="text-lg font-bold">Review Claims</h3>
                                <p className="text-amber-100 text-sm mt-1">Check pending requests</p>
                            </div>
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition">
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={() => navigate("/admin/users")}
                        className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white cursor-pointer hover:shadow-lg hover:shadow-emerald-500/25 transition group"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <UserCheck className="w-5 h-5 text-emerald-200" />
                                    <span className="text-emerald-100 text-xs font-medium uppercase tracking-wider">Users</span>
                                </div>
                                <h3 className="text-lg font-bold">Manage Users</h3>
                                <p className="text-emerald-100 text-sm mt-1">{stats?.overview?.totalUsers || 0} registered users</p>
                            </div>
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition">
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;