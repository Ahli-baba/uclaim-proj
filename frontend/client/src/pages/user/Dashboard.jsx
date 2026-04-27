import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useSettings } from "../../contexts/SettingsContext";

// Get the API base URL - must match your api.js base URL
// Your backend is at: https://uclaim-proj-production.up.railway.app
const getBaseUrl = () => {
    return "https://uclaim-proj-production.up.railway.app";
};

const Dashboard = () => {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const { siteName } = settings;

    const [userName, setUserName] = useState("Student");
    const [userEmail, setUserEmail] = useState("");
    const [userRole, setUserRole] = useState("student");
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({ lost: 0, found: 0, active: 0, claimed: 0 });
    const [notifications, setNotifications] = useState([]);
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (!savedUser) {
            navigate("/login");
            return;
        }
        const user = JSON.parse(savedUser);
        setUserName(user.name.split(" ")[0]);
        setUserEmail(user.email || "student@university.edu");
        setUserRole(user.role || "student");
        fetchDashboardData();
    }, [navigate]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsData, activitiesData, notificationsData] = await Promise.all([
                api.getDashboardStats(),
                api.getRecentActivity(),
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

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const handleLogoClick = () => window.location.reload();

    const capitalizeRole = (role) => role.charAt(0).toUpperCase() + role.slice(1);

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

    const formatDateFull = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // FIXED: Robust image URL handling
    const getImageUrl = (activity) => {
        const baseUrl = getBaseUrl();
        let rawUrl = null;

        // Check all possible image field names your backend might use
        if (activity.image) rawUrl = activity.image;
        else if (activity.images && activity.images.length > 0) rawUrl = activity.images[0];
        else if (activity.photo) rawUrl = activity.photo;
        else if (activity.photos && activity.photos.length > 0) rawUrl = activity.photos[0];
        else if (activity.imgUrl) rawUrl = activity.imgUrl;
        else if (activity.imageUrl) rawUrl = activity.imageUrl;

        if (!rawUrl) return null;

        // If it's already a full URL, return as-is
        if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
            return rawUrl;
        }

        // If it starts with /, prepend base URL
        if (rawUrl.startsWith("/")) {
            return baseUrl + rawUrl;
        }

        // Otherwise assume it's a relative path like "uploads/..."
        return baseUrl + "/" + rawUrl;
    };

    const getStatusConfig = (status) => {
        switch (status?.toLowerCase()) {
            case "claimed":
                return {
                    label: "Claimed",
                    bg: "bg-[#00A8E8]/10",
                    text: "text-[#00A8E8]",
                    border: "border-[#00A8E8]/20",
                    icon: (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ),
                };
            case "active":
                return {
                    label: "Active",
                    bg: "bg-[#001F3F]/10",
                    text: "text-[#001F3F]",
                    border: "border-[#001F3F]/20",
                    icon: (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                    ),
                };
            case "resolved":
                return {
                    label: "Resolved",
                    bg: "bg-emerald-50",
                    text: "text-emerald-600",
                    border: "border-emerald-100",
                    icon: (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ),
                };
            default:
                return {
                    label: status || "Unknown",
                    bg: "bg-gray-100",
                    text: "text-gray-500",
                    border: "border-gray-200",
                    icon: null,
                };
        }
    };

    const getTypeIcon = (type) => {
        const isLost = type?.toLowerCase() === "lost";
        return (
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLost ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"}`}>
                {isLost ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )}
            </div>
        );
    };

    return (
        <div className="flex min-h-screen bg-[#EAEAEA] font-sans text-[#001F3F] selection:bg-[#00A8E8] selection:text-white">
            {/* ===== SIDEBAR ===== */}
            <aside className="w-64 bg-white border-r border-gray-100/80 flex flex-col sticky top-0 h-screen z-30">
                <div className="p-8 flex items-center gap-3">
                    <img
                        src="/UClaim Logo.png"
                        alt="UClaim"
                        className="h-10 w-auto cursor-pointer hover:scale-105 transition-transform duration-300"
                        onClick={handleLogoClick}
                        onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                        }}
                    />
                    {/* Fallback logo if image fails */}
                    <div
                        className="w-10 h-10 bg-[#00A8E8] rounded-2xl flex items-center justify-center shadow-lg shadow-[#00A8E8]/20 cursor-pointer hover:scale-105 transition-transform duration-300 hidden"
                        onClick={handleLogoClick}
                    >
                        <span className="text-white font-black text-lg tracking-tighter">UC</span>
                    </div>
                    <span
                        className="text-2xl font-black text-[#00A8E8] tracking-tight cursor-pointer hover:text-[#001F3F] transition-colors duration-300"
                        onClick={handleLogoClick}
                    >
                        {siteName}
                    </span>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <NavItem icon={<HomeIcon />} label="Dashboard" active onClick={() => navigate("/dashboard")} />
                    <NavItem icon={<SearchIcon />} label="Search Items" onClick={() => navigate("/search")} />
                    <NavItem icon={<ReportIcon />} label="Report Item" onClick={() => navigate("/report")} />
                    <NavItem icon={<ProfileIcon />} label="My Profile" onClick={() => navigate("/profile")} />
                </nav>

                <div className="px-6 pb-6 pt-4 border-t border-gray-50">
                    <p className="text-[11px] text-gray-300 font-bold tracking-wider uppercase">
                        {siteName} © {new Date().getFullYear()}
                    </p>
                </div>
            </aside>

            {/* ===== MAIN CONTENT ===== */}
            <main className="flex-1 min-w-0">
                {/* Top Navbar */}
                <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100/80 px-8 flex items-center justify-end sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => { setIsNotificationOpen(!isNotificationOpen); setIsProfileOpen(false); }}
                                className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-300 relative ${isNotificationOpen ? "bg-[#00A8E8]/10 text-[#00A8E8] ring-2 ring-[#00A8E8]/20" : "bg-gray-50 text-gray-400 hover:text-[#00A8E8] hover:bg-[#00A8E8]/5"}`}
                            >
                                <BellIcon />
                                {notifications.length > 0 && (
                                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                                )}
                            </button>

                            {isNotificationOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsNotificationOpen(false)} />
                                    <div className="absolute right-0 mt-3 w-96 bg-white rounded-3xl shadow-2xl shadow-black/5 border border-gray-100 z-20 overflow-hidden">
                                        <div className="p-5 border-b border-gray-50 flex justify-between items-center">
                                            <div>
                                                <h3 className="font-black text-[#001F3F] text-sm">Notifications</h3>
                                                <p className="text-[11px] text-gray-400 font-medium mt-0.5">Stay updated on your items</p>
                                            </div>
                                            {notifications.length > 0 && (
                                                <span className="text-[10px] bg-[#00A8E8]/10 text-[#00A8E8] px-3 py-1 rounded-full font-black uppercase tracking-wider">
                                                    {notifications.length} New
                                                </span>
                                            )}
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto">
                                            {notifications.length > 0 ? (
                                                <div className="divide-y divide-gray-50">
                                                    {notifications.map((notif) => (
                                                        <div key={notif.id} className="p-4 hover:bg-gray-50/80 transition-colors cursor-pointer group">
                                                            <div className="flex items-start gap-3">
                                                                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notif.urgent ? "bg-red-500" : "bg-[#00A8E8]"}`} />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm text-[#001F3F] font-bold leading-snug group-hover:text-[#00A8E8] transition-colors">
                                                                        {notif.message}
                                                                    </p>
                                                                    <p className="text-[11px] text-gray-400 font-medium mt-1">{formatDate(notif.date)}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-10 text-center">
                                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                                                        <BellIcon className="w-7 h-7" />
                                                    </div>
                                                    <p className="text-sm font-black text-[#001F3F]">All caught up!</p>
                                                    <p className="text-xs text-gray-400 mt-1 font-medium">We&apos;ll notify you when there&apos;s an update.</p>
                                                </div>
                                            )}
                                        </div>
                                        {notifications.length > 0 && (
                                            <button
                                                onClick={() => setNotifications([])}
                                                className="w-full p-4 text-center text-xs font-black text-[#00A8E8] border-t border-gray-50 hover:bg-gray-50 transition-colors uppercase tracking-wider"
                                            >
                                                Mark all as read
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="h-10 w-px bg-gray-100" />

                        {/* Profile */}
                        <div className="relative">
                            <button
                                onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotificationOpen(false); }}
                                className={`flex items-center gap-3 p-1.5 pr-4 rounded-2xl transition-all duration-300 ${isProfileOpen ? "bg-gray-50 ring-2 ring-gray-100" : "hover:bg-gray-50"}`}
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-black text-[#001F3F] leading-none">{userName}</p>
                                    <p className="text-[11px] text-gray-400 font-bold mt-1 uppercase tracking-wider">{capitalizeRole(userRole)}</p>
                                </div>
                                <div className="w-10 h-10 bg-[#00A8E8]/10 text-[#00A8E8] rounded-2xl flex items-center justify-center font-black text-sm border-2 border-transparent hover:border-[#00A8E8]/30 transition-all">
                                    {userName.charAt(0)}
                                </div>
                            </button>

                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
                                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl shadow-black/5 border border-gray-100 py-3 z-20 overflow-hidden">
                                        <div className="px-5 py-4 border-b border-gray-50 mb-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Signed in as</p>
                                            <p className="text-sm font-black text-[#001F3F] truncate">{userEmail}</p>
                                            <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-[#00A8E8]/10 text-[#00A8E8] rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                <span className="w-1.5 h-1.5 bg-[#00A8E8] rounded-full" />
                                                {capitalizeRole(userRole)}
                                            </span>
                                        </div>
                                        <button onClick={() => { navigate("/profile"); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm text-gray-600 hover:bg-[#00A8E8]/5 hover:text-[#00A8E8] transition-all font-bold">
                                            <ProfileIcon className="w-4 h-4" /> My Profile
                                        </button>
                                        <button onClick={() => { navigate("/settings"); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm text-gray-600 hover:bg-[#00A8E8]/5 hover:text-[#00A8E8] transition-all font-bold">
                                            <SettingsIcon className="w-4 h-4" /> Settings
                                        </button>
                                        <div className="h-px bg-gray-50 my-1 mx-3" />
                                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-500 hover:bg-red-50 transition-all font-black">
                                            <LogoutIcon className="w-4 h-4" /> Logout
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="p-8 lg:p-10 max-w-7xl mx-auto">
                    {/* Welcome Header */}
                    <div className="mb-10">
                        <h1 className="text-4xl lg:text-5xl font-black text-[#001F3F] leading-tight">
                            Welcome back, <span className="text-[#00A8E8]">{userName}</span>
                        </h1>
                        <p className="text-gray-500 mt-2 text-sm font-medium max-w-lg">
                            Here&apos;s what&apos;s happening with your lost and found items today.
                        </p>
                    </div>

                    {loading ? (
                        <DashboardSkeleton />
                    ) : (
                        <>
                            {/* Quick Actions */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                <ActionCard
                                    title="Report an Item"
                                    desc="Lost something or found an item? Report it now."
                                    icon={<ReportIcon className="w-8 h-8" />}
                                    primary
                                    onClick={() => navigate("/report")}
                                />
                                <ActionCard
                                    title="Search Items"
                                    desc="Browse through all reported lost and found items."
                                    icon={<SearchIcon className="w-8 h-8" />}
                                    onClick={() => navigate("/search")}
                                />
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                                <StatBox
                                    label="Lost Items"
                                    val={stats.lost}
                                    color="text-red-500"
                                    bg="bg-red-50"
                                    border="border-red-100"
                                    icon={
                                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
                                        </svg>
                                    }
                                />
                                <StatBox
                                    label="Found Items"
                                    val={stats.found}
                                    color="text-emerald-500"
                                    bg="bg-emerald-50"
                                    border="border-emerald-100"
                                    icon={
                                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    }
                                />
                                <StatBox
                                    label="Active Claims"
                                    val={stats.active}
                                    color="text-[#001F3F]"
                                    bg="bg-[#001F3F]/5"
                                    border="border-[#001F3F]/10"
                                    icon={
                                        <svg className="w-5 h-5 text-[#001F3F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                                        </svg>
                                    }
                                />
                                <StatBox
                                    label="Claimed"
                                    val={stats.claimed}
                                    color="text-[#00A8E8]"
                                    bg="bg-[#00A8E8]/5"
                                    border="border-[#00A8E8]/10"
                                    icon={
                                        <svg className="w-5 h-5 text-[#00A8E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    }
                                />
                            </div>

                            {/* Recent Activity */}
                            <div className="mb-6 flex items-end justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-[#001F3F]">Recent Activity</h3>
                                    <p className="text-xs text-gray-400 font-medium mt-1">Latest items reported on campus</p>
                                </div>
                                <button
                                    onClick={() => navigate("/search")}
                                    className="text-sm font-black text-[#00A8E8] hover:text-[#001F3F] transition-colors flex items-center gap-1 group"
                                >
                                    View All
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </button>
                            </div>

                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm shadow-black/[0.02] overflow-hidden">
                                {activities.length > 0 ? (
                                    <div className="divide-y divide-gray-50">
                                        {activities.map((activity, index) => {
                                            const statusConfig = getStatusConfig(activity.status);
                                            const imageUrl = getImageUrl(activity);
                                            const hasImage = !!imageUrl;

                                            return (
                                                <div
                                                    key={activity.id}
                                                    className="p-5 flex items-center gap-5 hover:bg-gray-50/50 transition-all cursor-pointer group"
                                                    onClick={() => navigate(`/item/${activity.id}`)}
                                                    style={{ animationDelay: `${index * 50}ms` }}
                                                >
                                                    {/* Image Thumbnail - FIXED WITH PROPER FALLBACK */}
                                                    <div className="relative flex-shrink-0">
                                                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 group-hover:border-[#00A8E8]/30 transition-all flex items-center justify-center">
                                                            {hasImage ? (
                                                                <img
                                                                    key={imageUrl}
                                                                    src={imageUrl}
                                                                    alt={activity.title}
                                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.style.display = "none";
                                                                        // Show fallback when image fails to load
                                                                        const fallback = e.target.parentElement.querySelector('.img-fallback');
                                                                        if (fallback) fallback.style.display = "flex";
                                                                        console.warn("Image failed to load:", imageUrl);
                                                                    }}
                                                                />
                                                            ) : null}
                                                            {/* Fallback - always present but hidden when image loads */}
                                                            <div
                                                                className="img-fallback w-full h-full flex items-center justify-center"
                                                                style={{ display: hasImage ? 'none' : 'flex' }}
                                                            >
                                                                {getTypeIcon(activity.type)}
                                                            </div>
                                                        </div>
                                                        {/* Type Badge on Image */}
                                                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center border-2 border-white ${activity.type?.toLowerCase() === "lost" ? "bg-red-500" : "bg-emerald-500"}`}>
                                                            {activity.type?.toLowerCase() === "lost" ? (
                                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-bold text-[#001F3F] text-sm truncate group-hover:text-[#00A8E8] transition-colors">
                                                                {activity.title}
                                                            </h4>
                                                            <span className="text-[10px] text-gray-300 font-mono font-bold flex-shrink-0">
                                                                #{activity.id?.toString().slice(-6).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium">
                                                            <span className="flex items-center gap-1">
                                                                <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                                                </svg>
                                                                {activity.location}
                                                            </span>
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                            <span className="flex items-center gap-1">
                                                                <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                {formatDate(activity.date)}
                                                            </span>
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                            <span className="truncate max-w-[100px]">by {activity.user}</span>
                                                        </div>
                                                    </div>

                                                    {/* Status & Arrow */}
                                                    <div className="flex items-center gap-3">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                                            {statusConfig.icon}
                                                            {statusConfig.label}
                                                        </span>
                                                        <svg className="w-5 h-5 text-gray-200 group-hover:text-[#00A8E8] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-72 text-center p-10">
                                        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-5 text-gray-200">
                                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                            </svg>
                                        </div>
                                        <p className="text-[#001F3F] font-black text-lg">No recent activity</p>
                                        <p className="text-gray-400 text-sm font-medium mt-1 max-w-sm">
                                            Items reported by you and others will appear here. Be the first to report!
                                        </p>
                                        <button
                                            onClick={() => navigate("/report")}
                                            className="mt-6 px-6 py-3 bg-[#00A8E8] text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-[#001F3F] transition-all duration-300 shadow-lg shadow-[#00A8E8]/20 hover:shadow-[#001F3F]/20"
                                        >
                                            Report Your First Item
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

// ===== SUB-COMPONENTS =====

const NavItem = ({ icon, label, active = false, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 ${active
            ? "bg-[#001F3F] text-white shadow-lg shadow-[#001F3F]/20"
            : "text-gray-400 hover:bg-gray-50 hover:text-[#001F3F]"
            }`}
    >
        <span className={active ? "text-[#00A8E8]" : ""}>{icon}</span>
        {label}
    </button>
);

const ActionCard = ({ title, desc, icon, primary = false, onClick }) => (
    <button
        onClick={onClick}
        className={`relative overflow-hidden p-8 rounded-3xl flex items-center gap-6 transition-all duration-500 text-left group border ${primary
            ? "bg-[#001F3F] text-white border-[#001F3F] shadow-xl shadow-[#001F3F]/20 hover:shadow-2xl hover:shadow-[#001F3F]/30 hover:-translate-y-1"
            : "bg-white text-[#001F3F] border-gray-100 hover:border-[#00A8E8]/30 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1"
            }`}
    >
        {/* Background decoration */}
        {primary && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00A8E8]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        )}

        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-500 ${primary
            ? "bg-white/10 group-hover:bg-white/20"
            : "bg-gray-50 group-hover:bg-[#00A8E8]/10 text-[#00A8E8]"
            }`}>
            {icon}
        </div>
        <div className="relative z-10">
            <h4 className="font-black text-lg group-hover:underline underline-offset-4 decoration-2 decoration-[#00A8E8]">{title}</h4>
            <p className={`text-sm mt-1 font-medium ${primary ? "text-white/60" : "text-gray-400"}`}>{desc}</p>
        </div>

        {primary && (
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-[#00A8E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
            </div>
        )}
    </button>
);

const StatBox = ({ label, val, color, bg, border, icon }) => (
    <div className={`${bg} ${border} border p-6 rounded-3xl hover:-translate-y-1 transition-all duration-300 cursor-default group`}>
        <div className="flex items-start justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center shadow-sm`}>
                {icon}
            </div>
        </div>
        <p className={`text-3xl font-black ${color} mb-1`}>{val}</p>
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">{label}</p>
    </div>
);

const DashboardSkeleton = () => (
    <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="h-32 bg-gray-200 rounded-3xl" />
            <div className="h-32 bg-gray-200 rounded-3xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-3xl" />
            ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-3xl" />
    </div>
);

// ===== ICONS =====

const HomeIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
);

const SearchIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

const ReportIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const ProfileIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
);

const SettingsIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const LogoutIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
);

const BellIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
);

export default Dashboard;