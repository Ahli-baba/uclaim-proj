import { useState, useEffect } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard, Package, Users, FileText, Settings,
    LogOut, Bell, Menu, CheckCircle, AlertTriangle,
    UserPlus, PackagePlus, ClipboardCheck
} from "lucide-react";
import { api } from "../../services/api";
import { useSettings } from "../../contexts/SettingsContext";

function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { settings } = useSettings();
    const { siteName } = settings;

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [user, setUser] = useState(null);
    const [pendingClaimsCount, setPendingClaimsCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const saved = localStorage.getItem("user");
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.role !== "admin") {
                navigate("/dashboard");
                return;
            }
            setUser(parsed);
        } else {
            navigate("/login");
        }

        fetchNotifications();
        fetchPendingClaimsCount();
    }, [navigate]);

    const fetchNotifications = async () => {
        try {
            const data = await api.getAdminNotifications();
            setNotifications(data);
            setUnreadCount(data.filter((n) => !n.read).length);
        } catch (err) {
            console.log("Failed to fetch notifications");
        }
    };

    const fetchPendingClaimsCount = async () => {
        try {
            const data = await api.getPendingClaimsCount();
            setPendingClaimsCount(data.count);
        } catch (err) {
            console.log("Failed to fetch claims count");
        }
    };

    const markAsRead = (id) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const menuItems = [
        { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
        { path: "/admin/items", icon: Package, label: "All Items" },
        { path: "/admin/users", icon: Users, label: "Users" },
        { path: "/admin/claims", icon: ClipboardCheck, label: "Claims", badge: pendingClaimsCount },
        { path: "/admin/reports", icon: FileText, label: "Reports" },
        { path: "/admin/settings", icon: Settings, label: "Settings" },
    ];

    const isActive = (path) => {
        if (path === "/admin") return location.pathname === "/admin";
        return location.pathname.startsWith(path);
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed left-0 top-0 h-full w-72 bg-slate-900 text-white z-50 transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
                {/* Logo */}
                <div className="h-20 flex items-center px-8 border-b border-slate-800">
                    <div className="w-10 h-10 mr-3">
                        <img src="/favicon.ico" alt={siteName} className="w-full h-full object-contain rounded-xl" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white">Admin Portal</h1>
                        {/* siteName from settings */}
                        <p className="text-xs text-slate-400">{siteName} Management</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                                {item.badge > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                        {item.badge}
                                    </span>
                                )}
                                {active && !item.badge && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Admin Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
                            {user.name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{user.name}</p>
                            <p className="text-xs text-slate-400">Administrator</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-red-400"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`transition-all duration-300 ${isSidebarOpen ? "lg:ml-72" : ""}`}>
                {/* Top Header */}
                <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition"
                        >
                            <Menu className="w-6 h-6 text-slate-600" />
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 hover:bg-slate-100 rounded-xl transition"
                            >
                                <Bell className="w-6 h-6 text-slate-600" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                                )}
                            </button>

                            {showNotifications && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                            <h3 className="font-bold text-slate-900">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                                                    {unreadCount} new
                                                </span>
                                            )}
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.length > 0 ? (
                                                <div className="divide-y divide-slate-100">
                                                    {notifications.map((notif) => (
                                                        <div
                                                            key={notif.id}
                                                            onClick={() => markAsRead(notif.id)}
                                                            className={`p-4 hover:bg-slate-50 cursor-pointer transition ${!notif.read ? "bg-blue-50/50" : ""}`}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${notif.type === "items" ? "bg-blue-100 text-blue-600" : notif.type === "users" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>
                                                                    {notif.type === "items" ? <PackagePlus className="w-5 h-5" /> : notif.type === "users" ? <UserPlus className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-sm text-slate-900 font-medium">{notif.message}</p>
                                                                    <p className="text-xs text-slate-500 mt-1">
                                                                        {new Date(notif.date).toLocaleTimeString()}
                                                                    </p>
                                                                </div>
                                                                {!notif.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center">
                                                    <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                                    <p className="text-sm font-medium text-slate-900">All caught up!</p>
                                                    <p className="text-xs text-slate-500 mt-1">No new notifications</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main className="p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;
