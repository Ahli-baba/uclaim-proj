import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useSettings } from "../../contexts/SettingsContext";

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
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen">
                <div className="p-8 flex items-center gap-3">
                    <div
                        className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center relative shadow-sm cursor-pointer hover:scale-105 transition-transform"
                        onClick={handleLogoClick}
                    >
                        <span className="text-white font-extrabold text-lg relative">
                            C<span className="absolute left-1 top-0 text-white font-extrabold text-sm">U</span>
                        </span>
                    </div>
                    {/* siteName from settings */}
                    <span
                        className="text-2xl font-extrabold text-blue-700 tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={handleLogoClick}
                    >
                        {siteName}
                    </span>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <NavItem icon="🏠" label="Dashboard" active onClick={() => navigate("/dashboard")} />
                    <NavItem icon="🔍" label="Search Items" onClick={() => navigate("/search")} />
                    <NavItem icon="📄" label="Report Item" onClick={() => navigate("/report")} />
                    <NavItem icon="👤" label="My Profile" onClick={() => navigate("/profile")} />
                </nav>

                <div className="px-6 pb-6 pt-4 border-t border-gray-50">
                    <p className="text-[11px] text-gray-300 font-medium">{siteName} © {new Date().getFullYear()}</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
                {/* Top Navbar */}
                <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-end relative">
                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => { setIsNotificationOpen(!isNotificationOpen); setIsProfileOpen(false); }}
                                className={`w-10 h-10 flex items-center justify-center rounded-full transition relative ${isNotificationOpen ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400 hover:text-blue-600"}`}
                            >
                                <span>🔔</span>
                                {notifications.length > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                                )}
                            </button>

                            {isNotificationOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsNotificationOpen(false)}></div>
                                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                                        <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                                            <h3 className="font-bold text-gray-900">Notifications</h3>
                                            {notifications.length > 0 && (
                                                <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">New</span>
                                            )}
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.length > 0 ? (
                                                <div className="divide-y divide-gray-50">
                                                    {notifications.map((notif) => (
                                                        <div key={notif.id} className="p-4 hover:bg-gray-50 transition cursor-pointer">
                                                            <p className="text-sm text-gray-800 font-medium">{notif.message}</p>
                                                            <p className="text-xs text-gray-400 mt-1">{formatDate(notif.date)}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center">
                                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-xl opacity-50">🔔</div>
                                                    <p className="text-sm font-bold text-gray-900">All caught up!</p>
                                                    <p className="text-xs text-gray-400 mt-1 px-4">We'll notify you here when there's an update on your items.</p>
                                                </div>
                                            )}
                                        </div>
                                        {notifications.length > 0 && (
                                            <button onClick={() => setNotifications([])} className="w-full p-3 text-center text-xs font-bold text-blue-600 border-t border-gray-50 hover:bg-gray-50 transition">
                                                Mark all as read
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="h-10 w-[1px] bg-gray-100 mx-2"></div>

                        {/* Profile */}
                        <div className="relative">
                            <button
                                onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotificationOpen(false); }}
                                className={`flex items-center gap-3 p-1.5 rounded-2xl transition group ${isProfileOpen ? "bg-gray-50" : "hover:bg-gray-50"}`}
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-gray-900 leading-none group-hover:text-blue-600 transition">{userName}</p>
                                    <p className="text-[11px] text-gray-400 font-medium mt-1">{capitalizeRole(userRole)} Account</p>
                                </div>
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold border-2 border-transparent group-hover:border-blue-200 transition">
                                    {userName.charAt(0)}
                                </div>
                            </button>

                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-50 mb-1 text-center">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Signed in as</p>
                                            <p className="text-sm font-bold text-gray-900 truncate">{userEmail}</p>
                                            <p className="text-[11px] text-blue-500 font-semibold mt-0.5">{capitalizeRole(userRole)}</p>
                                        </div>
                                        <button onClick={() => { navigate("/profile"); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition font-medium">
                                            <span>👤</span> My Profile
                                        </button>
                                        <button onClick={() => { navigate("/settings"); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition font-medium">
                                            <span>⚙️</span> Settings
                                        </button>
                                        <div className="h-[1px] bg-gray-50 my-1"></div>
                                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition font-bold">
                                            <span>🚪</span> Logout
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <div className="p-10 max-w-6xl mx-auto">
                    <div className="mb-10">
                        <h1 className="text-3xl font-extrabold text-gray-900">Welcome back, {userName}! 👋</h1>
                        <p className="text-gray-500 mt-1 text-sm font-medium">What would you like to do today?</p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                <ActionCard title="Report an Item" desc="Found something or lost something? Let us know." icon="📄" primary onClick={() => navigate("/report")} />
                                <ActionCard title="Search Items" desc="Browse the database to find your belongings." icon="🔍" onClick={() => navigate("/search")} />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                                <StatBox label="Lost Items" val={stats.lost} color="text-red-600" bg="bg-red-50" />
                                <StatBox label="Found Items" val={stats.found} color="text-green-600" bg="bg-green-50" />
                                <StatBox label="Active Claims" val={stats.active} color="text-yellow-600" bg="bg-yellow-50" />
                                <StatBox label="Claimed" val={stats.claimed} color="text-blue-600" bg="bg-blue-50" />
                            </div>

                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                                <button onClick={() => navigate("/search")} className="text-sm text-blue-600 font-semibold hover:underline">View All</button>
                            </div>

                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[200px]">
                                {activities.length > 0 ? (
                                    <div className="divide-y divide-gray-50">
                                        {activities.map((activity) => (
                                            <div key={activity.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer" onClick={() => navigate("/search")}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${activity.type === "lost" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                                                        {activity.type === "lost" ? "😞" : "🎉"}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{activity.title}</h4>
                                                        <p className="text-sm text-gray-500">
                                                            {activity.type === "lost" ? "Lost" : "Found"} at {activity.location} • by {activity.user}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${activity.status === "claimed" ? "bg-blue-100 text-blue-600" : "bg-yellow-100 text-yellow-600"}`}>
                                                        {activity.status}
                                                    </span>
                                                    <p className="text-xs text-gray-400 mt-1">{formatDate(activity.date)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-64 text-center p-10">
                                        <div className="text-4xl mb-3 opacity-20">📁</div>
                                        <p className="text-gray-400 font-medium text-sm">No recent activity to show.</p>
                                        <button onClick={() => navigate("/report")} className="text-blue-600 text-xs font-bold mt-2 hover:underline tracking-tight uppercase">
                                            Report your first item
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

const NavItem = ({ icon, label, active = false, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition ${active ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"}`}>
        <span className="text-lg">{icon}</span> {label}
    </button>
);

const ActionCard = ({ title, desc, icon, primary = false, onClick }) => (
    <button onClick={onClick} className={`p-8 rounded-3xl flex items-center gap-6 transition text-left group border ${primary ? "bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-100" : "bg-white text-gray-900 border-gray-100 hover:border-blue-200 shadow-sm"}`}>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${primary ? "bg-white bg-opacity-20" : "bg-gray-50 group-hover:bg-blue-50 transition"}`}>
            {icon}
        </div>
        <div>
            <h4 className="font-bold text-xl group-hover:underline underline-offset-4 decoration-2">{title}</h4>
            <p className={`text-sm mt-1 ${primary ? "text-blue-100" : "text-gray-400"}`}>{desc}</p>
        </div>
    </button>
);

const StatBox = ({ label, val, color, bg }) => (
    <div className={`${bg} p-5 rounded-2xl border border-white shadow-sm hover:translate-y-[-2px] transition-transform cursor-default`}>
        <p className={`text-2xl font-black ${color}`}>{val}</p>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-tight">{label}</p>
    </div>
);

export default Dashboard;
