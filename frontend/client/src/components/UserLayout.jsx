import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../contexts/SettingsContext";
import { api } from "../services/api";

/* ─── Icons ─────────────────────────────────────────────────────────────────── */
const HomeIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>;
const ListIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;
const ReportIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const ProfileIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const SettingsIconNav = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LogoutIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>;
const BellIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>;

/* ─── Sidebar NavItem ───────────────────────────────────────────────────────── */
const NavItem = ({ icon, label, active = false, onClick, collapsed = false }) => (
    <div className="relative group">
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-base transition-all duration-200 ${active
                ? "bg-[#00A8E8] text-white shadow-md shadow-[#00A8E8]/20"
                : "text-white/50 hover:bg-white/10 hover:text-white"
                } ${collapsed ? "justify-center px-2" : ""}`}
        >
            <span className={`flex-shrink-0 [&>svg]:w-6 [&>svg]:h-6 ${active ? "text-white" : "text-white/40"}`}>{icon}</span>
            {!collapsed && <span>{label}</span>}
        </button>
        {collapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-[#001F3F] border border-white/10 text-white text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
                {label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#001F3F]" />
            </div>
        )}
    </div>
);

/* ═══ MAIN LAYOUT ═══════════════════════════════════════════════════════════ */
export default function UserLayout({ children, activeNav }) {
    const navigate = useNavigate();
    const { settings: ctxSettings } = useSettings();
    const siteName = ctxSettings?.siteName || "UClaim";

    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem("sidebarCollapsed") === "true";
    });
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const isExpanded = !isCollapsed;

    const toggleSidebarFixed = () => {
        setIsCollapsed(prev => {
            localStorage.setItem("sidebarCollapsed", !prev);
            return !prev;
        });
    };

    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Live user state that syncs with localStorage + MyProfile updates
    const [user, setUser] = useState(() => {
        const s = localStorage.getItem("user");
        return s ? JSON.parse(s) : null;
    });

    // Fetch fresh user profile on mount to ensure avatar and other fields are loaded
    useEffect(() => {
        const fetchUserProfile = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const freshUser = await api.getProfile();
                if (freshUser) {
                    const updatedUser = { ...user, ...freshUser };
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                    setUser(updatedUser);
                }
            } catch (err) {
                // Silent fail - keep existing localStorage data
                console.error("Failed to fetch user profile:", err);
            }
        };

        fetchUserProfile();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Listen for profile updates from MyProfile.jsx
    useEffect(() => {
        const handleUserUpdate = () => {
            const s = localStorage.getItem("user");
            if (s) setUser(JSON.parse(s));
        };
        window.addEventListener("userUpdated", handleUserUpdate);
        return () => window.removeEventListener("userUpdated", handleUserUpdate);
    }, []);

    // Fetch notifications: claim updates + watched item alerts
    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            // ✅ Only use DB notifications as the single source of truth.
            // claimRoutes.js already pushes to User.notifications on every event,
            // so pulling getMyClaims() separately caused duplicates.
            const dbNotifs = await api.getDbNotifications().catch(() => []);

            const seenKey = "seenNotifs_" + (user?.email || user?._id || user?.id || "user");
            const seen = JSON.parse(localStorage.getItem(seenKey) || "[]");

            // ✅ Map ALL known DB notification types correctly — no more fallthrough to watch_available
            const allNotifs = dbNotifs
                .filter(n => !n.read && !seen.includes(String(n._id)))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map(n => ({
                    id: String(n._id),
                    itemTitle: n.itemTitle || "",
                    itemId: n.itemId || null,
                    // ✅ Pass DB type directly — getNotifConfig handles all types
                    status: n.type,
                    message: n.message,
                    date: n.createdAt,
                    read: n.read,
                    source: "db"
                }));

            setNotifications(allNotifs);
            setUnreadCount(allNotifs.length);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (user) fetchNotifications();
    }, [user, fetchNotifications]);

    const dismissNotification = (notifId, e) => {
        e.stopPropagation();
        const seenKey = "seenNotifs_" + (user?.email || user?._id || user?.id || "user");
        const seen = JSON.parse(localStorage.getItem(seenKey) || "[]");
        if (!seen.includes(notifId)) {
            localStorage.setItem(seenKey, JSON.stringify([...seen, notifId]));
        }
        const updated = notifications.filter(n => n.id !== notifId);
        setNotifications(updated);
        setUnreadCount(updated.filter(n => !n.read).length);
        api.markDbNotificationsRead().catch(() => { });
    };

    const markAllRead = () => {
        const seenKey = "seenNotifs_" + (user?.email || user?._id || user?.id || "user");
        const allIds = notifications.map(n => n.id);
        localStorage.setItem(seenKey, JSON.stringify(allIds));
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        // Also mark DB (watch) notifications as read on server
        api.markDbNotificationsRead().catch(() => { });
    };

    const getNotifConfig = (type) => {
        switch (type) {
            // Claimant notifications
            case "claim_approved": return { color: "text-emerald-600", bg: "bg-emerald-50", emoji: "✅" };
            case "claim_rejected": return { color: "text-red-600", bg: "bg-red-50", emoji: "❌" };
            case "item_collected": return { color: "text-purple-600", bg: "bg-purple-50", emoji: "⭐" };
            // Lost item owner notifications
            case "item_available": return { color: "text-blue-600", bg: "bg-blue-50", emoji: "📍" };
            case "finder_submitted": return { color: "text-amber-600", bg: "bg-amber-50", emoji: "🔍" };
            // Finder notifications
            case "finder_confirmed": return { color: "text-emerald-600", bg: "bg-emerald-50", emoji: "📦" };
            case "finder_declined": return { color: "text-red-600", bg: "bg-red-50", emoji: "❌" };
            // SAO watcher notifications
            case "item_at_sao": return { color: "text-amber-600", bg: "bg-amber-50", emoji: "🔔" };
            default: return { color: "text-gray-600", bg: "bg-gray-50", emoji: "🔔" };
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        navigate("/login");
    };

    const displayName = user?.nickname || user?.name || "User";
    const userRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Student";

    return (
        <div className="flex min-h-screen bg-[#F5F6F8] font-sans text-[#333333]">

            {/* ═══ SIDEBAR ═══════════════════════════════════════════════════════ */}
            <aside
                className={`${isExpanded ? "w-64" : "w-16"} bg-[#001F3F] flex flex-col sticky top-0 h-screen z-30 border-r border-white/10 transition-all duration-300 overflow-hidden`}
            >

                {/* Logo */}
                <div className={`py-4 flex items-center ${isExpanded ? "px-8" : "justify-center px-4"}`}>
                    <div
                        className="flex items-center gap-3 cursor-pointer select-none"
                        onClick={() => navigate("/dashboard")}
                    >
                        <img
                            src="/UClaim Logo.png"
                            alt="UClaim"
                            className="h-9 w-auto object-contain flex-shrink-0"
                            onError={(e) => { e.target.style.display = "none"; }}
                        />
                        {isExpanded && (
                            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-[#00A8E8] bg-clip-text text-transparent">
                                {siteName}
                            </span>
                        )}
                    </div>
                </div>

                {/* Nav */}
                <nav className={`flex-1 ${isExpanded ? "px-4" : "px-2"} space-y-1 mt-2`}>
                    <NavItem icon={<HomeIcon />} label="Dashboard" active={activeNav === "dashboard"} onClick={() => navigate("/dashboard")} collapsed={!isExpanded} />
                    <NavItem icon={<ListIcon />} label="Search Items" active={activeNav === "search"} onClick={() => navigate("/search")} collapsed={!isExpanded} />
                    <NavItem icon={<ReportIcon />} label="Report Item" active={activeNav === "report"} onClick={() => navigate("/report")} collapsed={!isExpanded} />
                    <NavItem icon={<ProfileIcon />} label="My Profile" active={activeNav === "profile"} onClick={() => navigate("/profile")} collapsed={!isExpanded} />
                    <NavItem icon={<SettingsIconNav />} label="Settings" active={activeNav === "settings"} onClick={() => navigate("/settings")} collapsed={!isExpanded} />
                </nav>

                {/* Footer */}
                <div className="px-4 pb-6 pt-4 border-t border-white/10 flex items-center justify-end">
                    <button
                        onClick={toggleSidebarFixed}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 4.5l-7.5 7.5 7.5 7.5m-6-15l-7.5 7.5 7.5 7.5" />
                            </svg>
                        )}
                    </button>
                </div>
            </aside>

            {/* ═══ MAIN CONTENT ═════════════════════════════════════════════════ */}
            <main className="flex-1 min-w-0">

                {/* Top Navbar */}
                <header className="h-16 bg-white border-b border-gray-100 px-8 flex items-center justify-end sticky top-0 z-20">
                    <div className="flex items-center gap-3">

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    const opening = !isNotificationOpen;
                                    setIsNotificationOpen(opening);
                                    setIsProfileOpen(false);
                                    if (opening) fetchNotifications();
                                }}
                                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 relative ${isNotificationOpen ? "bg-[#00A8E8]/10 text-[#00A8E8]" : "bg-gray-50 text-gray-400 hover:text-[#00A8E8] hover:bg-[#00A8E8]/5"}`}
                            >
                                <BellIcon />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                                )}
                            </button>

                            {isNotificationOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsNotificationOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl shadow-black/5 border border-gray-100 z-20 overflow-hidden">
                                        <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                                            <h3 className="font-bold text-[#001F3F] text-sm">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <button onClick={markAllRead} className="text-xs text-[#00A8E8] font-semibold hover:underline">
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center">
                                                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                                                        <BellIcon className="w-5 h-5 text-gray-300" />
                                                    </div>
                                                    <p className="text-sm font-semibold text-gray-400">No notifications yet</p>
                                                    <p className="text-xs text-gray-300 mt-1">We'll notify you when your claims are updated.</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-gray-50">
                                                    {notifications.map(notif => {
                                                        const config = getNotifConfig(notif.status);
                                                        return (
                                                            <div
                                                                key={notif.id}
                                                                onClick={() => {
                                                                    const seenKey = "seenNotifs_" + (user?.email || user?._id || user?.id || "user");
                                                                    const seen = JSON.parse(localStorage.getItem(seenKey) || "[]");
                                                                    if (!seen.includes(notif.id)) {
                                                                        localStorage.setItem(seenKey, JSON.stringify([...seen, notif.id]));
                                                                    }
                                                                    const updated = notifications.filter(n => n.id !== notif.id);
                                                                    setNotifications(updated);
                                                                    setUnreadCount(updated.filter(n => !n.read).length);
                                                                    api.markDbNotificationsRead().catch(() => { });
                                                                    if (notif.itemId) {
                                                                        setIsNotificationOpen(false);
                                                                        navigate(`/item/${notif.itemId}`);
                                                                    }
                                                                }}
                                                                className={`p-4 relative ${!notif.read ? "bg-blue-50/40" : ""} ${notif.itemId ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""}`}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${config.bg}`}>
                                                                        {config.emoji}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className={`text-xs font-bold ${config.color}`}>{notif.message || config.label}</p>
                                                                        <p className="text-xs text-gray-400 mt-1">
                                                                            {new Date(notif.date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                                        {!notif.read && <div className="w-2 h-2 bg-[#00A8E8] rounded-full"></div>}
                                                                        <button
                                                                            onClick={(e) => dismissNotification(notif.id, e)}
                                                                            className="w-5 h-5 flex items-center justify-center rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors text-xs leading-none"
                                                                            title="Dismiss"
                                                                        >✕</button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
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
                                    <p className="text-sm font-bold text-[#001F3F] leading-none">{displayName}</p>
                                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">{userRole}</p>
                                </div>
                                {/* Avatar: image if available, else fallback initial */}
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={displayName}
                                        className="w-9 h-9 rounded-xl object-cover border border-gray-100"
                                    />
                                ) : (
                                    <div className="w-9 h-9 bg-[#00A8E8] text-white rounded-xl flex items-center justify-center font-bold text-sm">
                                        {displayName.charAt(0)}
                                    </div>
                                )}
                            </button>

                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-black/5 border border-gray-100 py-2 z-20 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-50 mb-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Signed in as</p>
                                            <p className="text-sm font-bold text-[#001F3F] truncate">{user?.email}</p>
                                        </div>
                                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-bold">
                                            <LogoutIcon className="w-4 h-4" /> Logout
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                {children}
            </main>
        </div>
    );
}