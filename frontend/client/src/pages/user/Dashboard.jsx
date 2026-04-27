import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useSettings } from "../../contexts/SettingsContext";

const getBaseUrl = () => "https://uclaim-proj-production.up.railway.app";

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

    const getImageUrl = (activity) => {
        const baseUrl = getBaseUrl();
        let rawUrl = null;
        if (activity.image) rawUrl = activity.image;
        else if (activity.images && activity.images.length > 0) rawUrl = activity.images[0];
        else if (activity.photo) rawUrl = activity.photo;
        else if (activity.photos && activity.photos.length > 0) rawUrl = activity.photos[0];
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
                return {
                    label: "Claimed",
                    bg: "bg-[#00A8E8]/10",
                    text: "text-[#00A8E8]",
                    border: "border-[#00A8E8]/20",
                    icon: (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
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
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
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
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
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
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLost ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"}`}>
                {isLost ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )}
            </div>
        );
    };

    return (
        <div className="flex min-h-screen bg-[#F5F6F8] font-sans text-[#333333]">
            {/* ===== SIDEBAR: Soft warm gray ===== */}
            <aside className="w-64 bg-[#F0F2F5] flex flex-col sticky top-0 h-screen z-30 border-r border-gray-200/60">
                {/* Logo */}
                <div
                    className="p-6 flex items-center gap-3 cursor-pointer select-none"
                    onClick={handleLogoClick}
                >
                    <img
                        src="/UClaim Logo.png"
                        alt="UClaim"
                        className="h-9 w-auto object-contain"
                        onError={(e) => {
                            e.target.style.display = "none";
                        }}
                    />
                    <span className="text-xl font-black tracking-tight bg-gradient-to-r from-[#001F3F] to-[#00A8E8] bg-clip-text text-transparent">
                        {siteName}
                    </span>
                </div>

                <nav className="flex-1 px-4 space-y-1 mt-2">
                    <NavItem icon={<HomeIcon />} label="Dashboard" active onClick={() => navigate("/dashboard")} />
                    <NavItem icon={<ListIcon />} label="Search Items" onClick={() => navigate("/search")} />
                    <NavItem icon={<ReportIcon />} label="Report Item" onClick={() => navigate("/report")} />
                    <NavItem icon={<ProfileIcon />} label="My Profile" onClick={() => navigate("/profile")} />
                </nav>

                <div className="px-6 pb-6 pt-4 border-t border-gray-200/60">
                    <p className="text-[11px] text-gray-400 font-bold tracking-wider uppercase">
                        {siteName} &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </aside>

            {/* ===== MAIN CONTENT ===== */}
            <main className="flex-1 min-w-0">
                {/* Top Navbar */}
                <header className="h-16 bg-white border-b border-gray-100 px-8 flex items-center justify-end sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => { setIsNotificationOpen(!isNotificationOpen); setIsProfileOpen(false); }}
                                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 relative ${isNotificationOpen ? "bg-[#00A8E8]/10 text-[#00A8E8]" : "bg-gray-50 text-gray-400 hover:text-[#00A8E8] hover:bg-[#00A8E8]/5"}`}
                            >
                                <BellIcon />
                                {notifications.length > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-[#00A8E8] rounded-full border-2 border-white" />
                                )}
                            </button>

                            {isNotificationOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsNotificationOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl shadow-black/5 border border-gray-100 z-20 overflow-hidden">
                                        <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                                            <h3 className="font-bold text-[#001F3F] text-sm">Notifications</h3>
                                            {notifications.length > 0 && (
                                                <span className="text-[10px] bg-[#00A8E8]/10 text-[#00A8E8] px-2 py-0.5 rounded-full font-bold">
                                                    {notifications.length}
                                                </span>
                                            )}
                                        </div>
                                        <div className="max-h-[320px] overflow-y-auto">
                                            {notifications.length > 0 ? (
                                                <div className="divide-y divide-gray-50">
                                                    {notifications.map((notif) => (
                                                        <div key={notif.id} className="p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                                                            <div className="flex items-start gap-3">
                                                                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notif.urgent ? "bg-red-500" : "bg-[#00A8E8]"}`} />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm text-[#333333] font-medium leading-snug">{notif.message}</p>
                                                                    <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(notif.date)}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center">
                                                    <p className="text-sm font-medium text-gray-400">No new notifications</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="h-6 w-px bg-gray-200" />

                        {/* Profile */}
                        <div className="relative">
                            <button
                                onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotificationOpen(false); }}
                                className={`flex items-center gap-3 px-2 py-1.5 rounded-xl transition-all duration-200 ${isProfileOpen ? "bg-gray-50" : "hover:bg-gray-50"}`}
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-[#001F3F] leading-none">{userName}</p>
                                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">{capitalizeRole(userRole)}</p>
                                </div>
                                <div className="w-9 h-9 bg-[#00A8E8] text-white rounded-xl flex items-center justify-center font-bold text-sm">
                                    {userName.charAt(0)}
                                </div>
                            </button>

                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-black/5 border border-gray-100 py-2 z-20 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-50 mb-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Signed in as</p>
                                            <p className="text-sm font-bold text-[#001F3F] truncate">{userEmail}</p>
                                        </div>
                                        <button onClick={() => { navigate("/profile"); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#00A8E8] transition-colors font-medium">
                                            <ProfileIcon className="w-4 h-4" /> My Profile
                                        </button>
                                        <button onClick={() => { navigate("/settings"); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#00A8E8] transition-colors font-medium">
                                            <SettingsIcon className="w-4 h-4" /> Settings
                                        </button>
                                        <div className="h-px bg-gray-100 my-1 mx-3" />
                                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-bold">
                                            <LogoutIcon className="w-4 h-4" /> Logout
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
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

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                <StatBox
                                    label="Lost Items"
                                    val={stats.lost}
                                    color="text-red-500"
                                    iconBg="bg-red-50"
                                    icon={
                                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                        </svg>
                                    }
                                />
                                <StatBox
                                    label="Found Items"
                                    val={stats.found}
                                    color="text-emerald-500"
                                    iconBg="bg-emerald-50"
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
                                    iconBg="bg-[#001F3F]/5"
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
                                    iconBg="bg-[#00A8E8]/10"
                                    icon={
                                        <svg className="w-5 h-5 text-[#00A8E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    }
                                />
                            </div>

                            {/* Recent Activity */}
                            <div className="mb-4 flex items-end justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-[#001F3F]">Recent Activity</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Latest items reported on campus</p>
                                </div>
                                <button
                                    onClick={() => navigate("/search")}
                                    className="text-sm font-bold text-[#00A8E8] hover:text-[#001F3F] transition-colors flex items-center gap-1 group"
                                >
                                    View All
                                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                </button>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                {activities.length > 0 ? (
                                    <div className="divide-y divide-gray-50">
                                        {activities.map((activity) => {
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
                                                                        const fallback = e.target.parentElement.querySelector('.img-fallback');
                                                                        if (fallback) fallback.style.display = "flex";
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div className="img-fallback w-full h-full flex items-center justify-center" style={{ display: hasImage ? 'none' : 'flex' }}>
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
                                                            <span className="w-0.5 h-0.5 bg-gray-300 rounded-full" />
                                                            <span className="truncate">by {activity.user}</span>
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
                                        <p className="text-[#001F3F] font-bold text-base">No recent activity</p>
                                        <p className="text-gray-400 text-sm mt-1">Items reported will appear here.</p>
                                        <button
                                            onClick={() => navigate("/report")}
                                            className="mt-5 px-5 py-2.5 bg-[#00A8E8] text-white rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-[#001F3F] transition-colors"
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
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${active
            ? "bg-[#00A8E8] text-white shadow-md shadow-[#00A8E8]/20"
            : "text-gray-500 hover:bg-white hover:text-[#001F3F]"
            }`}
    >
        <span className={active ? "text-white" : "text-gray-400"}>{icon}</span>
        {label}
    </button>
);

const ActionCard = ({ title, desc, icon, primary = false, onClick }) => (
    <button
        onClick={onClick}
        className={`relative overflow-hidden p-6 rounded-2xl flex items-center gap-5 transition-all duration-300 text-left group border ${primary
            ? "bg-[#00A8E8] text-white border-[#00A8E8] shadow-lg shadow-[#00A8E8]/20 hover:shadow-xl hover:shadow-[#00A8E8]/30 hover:-translate-y-0.5"
            : "bg-white text-[#001F3F] border-gray-100 hover:border-[#00A8E8]/30 hover:shadow-lg hover:-translate-y-0.5"
            }`}
    >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${primary
            ? "bg-white/20"
            : "bg-gray-50 text-[#00A8E8] group-hover:bg-[#00A8E8]/10"
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
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-gray-200 rounded-2xl" />
            ))}
        </div>
        <div className="h-80 bg-gray-200 rounded-2xl" />
    </div>
);

// ===== ICONS =====

const HomeIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
);

const ListIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
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