import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useSettings } from "../../contexts/SettingsContext";

const getBaseUrl = () => "https://uclaim-proj-production.up.railway.app";

// ── Date filter helpers ────────────────────────────────────────────────────────
const DATE_FILTERS = [
    { key: "all", label: "All" },
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
];

const isWithinPeriod = (dateString, period) => {
    if (period === "all") return true;
    const date = new Date(dateString);
    const now = new Date();
    const startOf = (unit) => {
        const d = new Date(now);
        if (unit === "day") { d.setHours(0, 0, 0, 0); }
        if (unit === "week") { d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); }
        if (unit === "month") { d.setDate(1); d.setHours(0, 0, 0, 0); }
        return d;
    };
    if (period === "today") return date >= startOf("day");
    if (period === "week") return date >= startOf("week");
    if (period === "month") return date >= startOf("month");
    return true;
};
// ──────────────────────────────────────────────────────────────────────────────

const Dashboard = () => {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const { siteName } = settings;

    const [userName, setUserName] = useState("Student");
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({ lost: 0, found: 0, active: 0, claimed: 0 });
    const [notifications, setNotifications] = useState([]);
    const [activities, setActivities] = useState([]);

    // ── Date filter state ──────────────────────────────────────────────────────
    const [activeDateFilter, setActiveDateFilter] = useState("all");

    // ── Filtered activities (client-side fallback, but now backend also filters) ──
    const filteredActivities = useMemo(
        () => activities.filter((a) => isWithinPeriod(a.date, activeDateFilter)),
        [activities, activeDateFilter]
    );
    // ──────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (!savedUser) { navigate("/login"); return; }
        const user = JSON.parse(savedUser);
        setUserName(user.name.split(" ")[0]);
        fetchDashboardData("all");
    }, [navigate]);

    const fetchDashboardData = async (period = activeDateFilter) => {
        try {
            setLoading(true);
            const [statsData, activitiesData, notificationsData] = await Promise.all([
                api.getDashboardStats(period),
                api.getRecentActivity(period),   // ← pass period to backend too
                api.getNotifications(),
            ]);
            setStats(statsData);
            setActivities(activitiesData);
            setNotifications(notificationsData);
        } catch (err) {
            console.error("Failed to fetch dashboard data:", err);
            if (err.message.includes("401")) navigate("/login");
        } finally {
            setLoading(false);
        }
    };

    const handleDateFilterChange = (filterKey) => {
        setActiveDateFilter(filterKey);
        fetchDashboardData(filterKey);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const getImageUrl = (activity) => {
        const baseUrl = getBaseUrl();
        let rawUrl = null;
        if (activity.image) rawUrl = activity.image;
        else if (activity.images?.length > 0) rawUrl = activity.images[0];
        else if (activity.photo) rawUrl = activity.photo;
        else if (activity.photos?.length > 0) rawUrl = activity.photos[0];
        else if (activity.imgUrl) rawUrl = activity.imgUrl;
        else if (activity.imageUrl) rawUrl = activity.imageUrl;
        if (!rawUrl) return null;
        if (rawUrl.startsWith("data:")) return rawUrl;
        if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
        if (rawUrl.startsWith("/")) return baseUrl + rawUrl;
        return baseUrl + "/" + rawUrl;
    };

    const getStatusConfig = (status) => {
        switch (status?.toLowerCase()) {
            case "claimed":
                return { label: "Claimed", bg: "bg-[#00A8E8]/10", text: "text-[#00A8E8]", border: "border-[#00A8E8]/20", icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> };
            case "active":
                return { label: "Active", bg: "bg-[#001F3F]/10", text: "text-[#001F3F]", border: "border-[#001F3F]/20", icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" /></svg> };
            case "resolved":
                return { label: "Claimed", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> };
            default:
                return { label: status || "Unknown", bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200", icon: null };
        }
    };

    const getTypeIcon = (type) => {
        const isLost = type?.toLowerCase() === "lost";
        return (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLost ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"}`}>
                {isLost ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
            </div>
        );
    };

    return (
        <div className="p-6 lg:p-8 max-w-6xl mx-auto">

            {/* Welcome Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#001F3F]">
                    Welcome back, <span className="text-[#00A8E8]">{userName}</span>
                </h1>
                <p className="text-gray-400 mt-1 text-sm">
                    Here&apos;s what&apos;s happening with your items today.
                </p>
            </div>

            {loading ? (
                <DashboardSkeleton />
            ) : (
                <>
                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <ActionCard
                            title="Report an Item"
                            desc="Lost something? Report it now."
                            icon={<ReportIcon className="w-6 h-6" />}
                            primary
                            onClick={() => navigate("/report")}
                        />
                        <ActionCard
                            title="Search Items"
                            desc="Browse all listings."
                            icon={<ListIcon className="w-6 h-6" />}
                            onClick={() => navigate("/search")}
                        />
                    </div>

                    {/* Stats Section Header */}
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-[#001F3F]">Overview</h3>
                        <p className="text-xs text-gray-400 mt-0.5">A snapshot of your reported items</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatBox label="Lost Items" val={stats.lost} color="text-red-500" iconBg="bg-red-50" icon={<svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>} />
                        <StatBox label="Found Items" val={stats.found} color="text-emerald-500" iconBg="bg-emerald-50" icon={<svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                        <StatBox label="Active Items" val={stats.active} color="text-[#001F3F]" iconBg="bg-[#001F3F]/5" icon={<svg className="w-5 h-5 text-[#001F3F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" /></svg>} />
                        <StatBox label="Claimed Items" val={stats.claimed} color="text-[#00A8E8]" iconBg="bg-[#00A8E8]/10" icon={<svg className="w-5 h-5 text-[#00A8E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                    </div>

                    {/* ── Your Activity header + date filters ────────────────────────────── */}
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-bold text-[#001F3F]">Your Activity</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Items you&apos;ve reported</p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Filter pills */}
                            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                                {DATE_FILTERS.map((f) => (
                                    <button
                                        key={f.key}
                                        onClick={() => handleDateFilterChange(f.key)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 ${activeDateFilter === f.key
                                            ? "bg-[#1E293B] text-white shadow-sm"
                                            : "text-gray-500 hover:text-[#1E293B]"
                                            }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            <div className="h-5 w-px bg-gray-200" />

                            <button
                                onClick={() => navigate("/search")}
                                className="text-sm font-bold text-[#00A8E8] hover:text-[#001F3F] transition-colors flex items-center gap-1 group"
                            >
                                View All
                                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            </button>
                        </div>
                    </div>
                    {/* ──────────────────────────────────────────────────────────────────────── */}

                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        {filteredActivities.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {filteredActivities.map((activity) => {
                                    const statusConfig = getStatusConfig(activity.status);
                                    const imageUrl = getImageUrl(activity);
                                    const hasImage = !!imageUrl;

                                    return (
                                        <div
                                            key={activity.id}
                                            className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                                            onClick={() => navigate(`/item/${activity.id}`)}
                                        >
                                            {/* Image */}
                                            <div className="relative flex-shrink-0">
                                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                                                    {hasImage ? (
                                                        <img
                                                            src={imageUrl}
                                                            alt={activity.title}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.style.display = "none";
                                                                const fallback = e.target.parentElement.querySelector(".img-fallback");
                                                                if (fallback) fallback.style.display = "flex";
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className="img-fallback w-full h-full flex items-center justify-center" style={{ display: hasImage ? "none" : "flex" }}>
                                                        {getTypeIcon(activity.type)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h4 className="font-semibold text-[#001F3F] text-sm truncate group-hover:text-[#00A8E8] transition-colors">
                                                        {activity.title}
                                                    </h4>
                                                    <span className="text-[10px] text-gray-300 font-mono flex-shrink-0">
                                                        #{activity.id?.toString().slice(-6).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                                                        {activity.location}
                                                    </span>
                                                    <span className="w-0.5 h-0.5 bg-gray-300 rounded-full" />
                                                    <span>{formatDate(activity.date)}</span>
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                                    {statusConfig.icon}
                                                    {statusConfig.label}
                                                </span>
                                                <svg className="w-4 h-4 text-gray-200 group-hover:text-[#00A8E8] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-gray-200">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                                </div>
                                {activeDateFilter !== "all" ? (
                                    <>
                                        <p className="text-[#001F3F] font-bold text-base">No activity for this period</p>
                                        <p className="text-gray-400 text-sm mt-1">Try a different date range or view all your items.</p>
                                        <button
                                            onClick={() => handleDateFilterChange("all")}
                                            className="mt-5 px-5 py-2.5 bg-[#1E293B] text-white rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-[#00A8E8] transition-colors"
                                        >
                                            Show All Activity
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-[#001F3F] font-bold text-base">No activity yet</p>
                                        <p className="text-gray-400 text-sm mt-1">Items you report will appear here.</p>
                                        <button
                                            onClick={() => navigate("/report")}
                                            className="mt-5 px-5 py-2.5 bg-[#00A8E8] text-white rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-[#001F3F] transition-colors"
                                        >
                                            Report Your First Item
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

// ===== SUB-COMPONENTS =====

const ActionCard = ({ title, desc, icon, primary = false, onClick }) => (
    <button
        onClick={onClick}
        className={`relative overflow-hidden p-6 rounded-2xl flex items-center gap-5 transition-all duration-300 text-left group border ${primary
            ? "bg-[#00A8E8] text-white border-[#00A8E8] shadow-lg shadow-[#00A8E8]/20 hover:shadow-xl hover:shadow-[#00A8E8]/30 hover:-translate-y-0.5"
            : "bg-white text-[#001F3F] border-gray-100 hover:border-[#00A8E8]/30 hover:shadow-lg hover:-translate-y-0.5"
            }`}
    >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${primary ? "bg-white/20" : "bg-gray-50 text-[#00A8E8] group-hover:bg-[#00A8E8]/10"
            }`}>
            {icon}
        </div>
        <div>
            <h4 className="font-bold text-base">{title}</h4>
            <p className={`text-sm mt-0.5 ${primary ? "text-white/70" : "text-gray-400"}`}>{desc}</p>
        </div>
        <svg className={`w-5 h-5 ml-auto transition-all ${primary ? "text-white/50 group-hover:text-white group-hover:translate-x-0.5" : "text-gray-200 group-hover:text-[#00A8E8] group-hover:translate-x-0.5"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
    </button>
);

const StatBox = ({ label, val, color, iconBg, icon }) => (
    <div className="bg-white border border-gray-100 p-5 rounded-2xl hover:-translate-y-0.5 transition-all duration-300 shadow-sm hover:shadow-md">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
            {icon}
        </div>
        <p className={`text-2xl font-bold ${color} mb-0.5`}>{val}</p>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
    </div>
);

const DashboardSkeleton = () => (
    <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="h-24 bg-gray-200 rounded-2xl" />
            <div className="h-24 bg-gray-200 rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (<div key={i} className="h-28 bg-gray-200 rounded-2xl" />))}
        </div>
        <div className="h-80 bg-gray-200 rounded-2xl" />
    </div>
);

// ===== ICONS =====

const ReportIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const ListIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;

export default Dashboard;