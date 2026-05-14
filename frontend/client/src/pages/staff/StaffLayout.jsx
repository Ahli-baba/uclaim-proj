import { useState, useEffect, useRef } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard, Package, ClipboardCheck, LogOut,
    Menu, Settings, PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import { api } from "../../services/api";

const T = {
    navy: "#1D3557",
    steel: "#468FAF",
    cool: "#F8F9FA",
    white: "#FFFFFF",
    text: "#1D3557",
    textLight: "#6B7280",
    border: "rgba(29,53,87,0.08)",
};

function StaffLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
    const [user, setUser] = useState(null);
    const [badges, setBadges] = useState({ pendingClaims: 0, newItems: 0 });
    const [seenCounts, setSeenCounts] = useState(() => {
        try {
            const saved = sessionStorage.getItem("staffSeenCounts");
            return saved ? JSON.parse(saved) : { pendingClaims: null, newItems: null };
        } catch { return { pendingClaims: null, newItems: null }; }
    });
    const intervalRef = useRef(null);

    useEffect(() => {
        const saved = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (!token || !saved) {
            navigate("/");
            return;
        }
        const parsed = JSON.parse(saved);
        if (parsed.role !== "staff") {
            navigate("/dashboard");
            return;
        }
        setUser(parsed);
    }, [navigate]);

    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === "token" && !e.newValue) {
                navigate("/");
            }
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, [navigate]);

    const fetchBadges = async () => {
        try {
            const data = await api.getStaffBadgeCounts();
            setBadges({
                pendingClaims: data?.pendingClaims ?? 0,
                newItems: data?.newItems ?? 0,
            });
        } catch {
            // fail silently
        }
    };

    useEffect(() => {
        fetchBadges();
        intervalRef.current = setInterval(fetchBadges, 60000);
        return () => clearInterval(intervalRef.current);
    }, []);

    useEffect(() => {
        if (location.pathname.startsWith("/staff/items")) {
            setSeenCounts((prev) => ({ ...prev, newItems: badges.newItems }));
        }
        if (location.pathname.startsWith("/staff/claims")) {
            setSeenCounts((prev) => ({ ...prev, pendingClaims: badges.pendingClaims }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    useEffect(() => {
        sessionStorage.setItem("staffSeenCounts", JSON.stringify(seenCounts));
    }, [seenCounts]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    const itemsBadge = seenCounts.newItems === null
        ? (badges.newItems || 0)
        : Math.max(0, (badges.newItems || 0) - (seenCounts.newItems || 0));
    const claimsBadge = seenCounts.pendingClaims === null
        ? (badges.pendingClaims || 0)
        : Math.max(0, (badges.pendingClaims || 0) - (seenCounts.pendingClaims || 0));

    const menuItems = [
        { path: "/staff", icon: LayoutDashboard, label: "Dashboard", badge: 0 },
        { path: "/staff/items", icon: Package, label: "Items", badge: itemsBadge },
        { path: "/staff/claims", icon: ClipboardCheck, label: "Cases", badge: claimsBadge },
        { path: "/staff/settings", icon: Settings, label: "Settings", badge: 0 },
    ];

    const isActive = (path) => {
        if (path === "/staff") return location.pathname === "/staff";
        return location.pathname.startsWith(path);
    };

    if (!user) return null;

    return (
        <div className="min-h-screen font-sans" style={{ backgroundColor: T.cool, color: T.text }}>

            {/* Mobile overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-[#1D3557]/40 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 h-full z-50 overflow-hidden transition-all duration-300
                    ${isSidebarOpen
                        ? "w-64 translate-x-0"
                        : "w-64 -translate-x-full lg:w-[68px] lg:translate-x-0"
                    }`}
                style={{ backgroundColor: T.navy }}
            >
                {/* Header */}
                <div
                    className="h-16 flex items-center justify-between px-3 flex-shrink-0"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                    <div className={`flex items-center gap-3 min-w-0 ${isSidebarOpen ? "flex-1 pl-2" : "w-full lg:justify-center"}`}>
                        <img
                            src="/UClaim Logo.png"
                            alt="UClaim"
                            className="h-8 w-auto object-contain flex-shrink-0"
                        />
                        <div className={`flex flex-col min-w-0 transition-all duration-200 ${isSidebarOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden lg:hidden"}`}>
                            <span className="text-sm font-bold tracking-tight text-white leading-tight whitespace-nowrap">Staff Portal</span>
                            <span className="text-[10px] font-medium tracking-wider uppercase text-white/50 leading-tight whitespace-nowrap">UCLAIM STAFF</span>
                        </div>
                    </div>
                    {isSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors flex-shrink-0"
                            title="Collapse sidebar"
                        >
                            <PanelLeftClose className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Nav */}
                <nav className="px-2 py-2 space-y-0.5">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                title={!isSidebarOpen ? item.label : undefined}
                                className={`flex items-center py-2.5 rounded-xl transition-all duration-200 relative
                                    ${isSidebarOpen ? "gap-3 px-4" : "lg:justify-center lg:px-0 lg:gap-0 gap-3 px-4"}`}
                                style={{
                                    backgroundColor: active ? T.steel : "transparent",
                                    color: active ? T.white : "rgba(255,255,255,0.55)",
                                    boxShadow: active ? "0 4px 14px rgba(70,143,175,0.35)" : "none",
                                }}
                                onMouseEnter={(e) => {
                                    if (!active) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)";
                                }}
                                onMouseLeave={(e) => {
                                    if (!active) e.currentTarget.style.backgroundColor = "transparent";
                                }}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />

                                <span className={`text-sm font-medium whitespace-nowrap transition-all duration-200
                                    ${isSidebarOpen ? "opacity-100" : "opacity-100 lg:hidden"}`}>
                                    {item.label}
                                </span>

                                {/* Badge — full when open, dot when collapsed */}
                                {item.badge > 0 && isSidebarOpen && (
                                    <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                                        {item.badge > 99 ? "99+" : item.badge}
                                    </span>
                                )}
                                {item.badge > 0 && !isSidebarOpen && (
                                    <span className="hidden lg:block absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                                )}

                                {active && item.badge === 0 && isSidebarOpen && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/80" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Expand button — only when collapsed, sits above staff info */}
                {!isSidebarOpen && (
                    <div className="absolute bottom-[60px] left-0 right-0 hidden lg:flex justify-center py-1">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                            title="Expand sidebar"
                        >
                            <PanelLeftOpen className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Staff Info */}
                <div className="absolute bottom-0 left-0 right-0 p-2">
                    <div className={`flex items-center rounded-xl bg-white/5 transition-all duration-200
                        ${isSidebarOpen ? "gap-3 px-4 py-3" : "lg:flex-col lg:items-center lg:gap-1.5 lg:py-2.5 lg:px-0 gap-3 px-4 py-3"}`}>
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                            style={{ backgroundColor: T.steel }}
                        >
                            {user.name?.charAt(0)}
                        </div>

                        <div className={`flex-1 min-w-0 ${!isSidebarOpen ? "lg:hidden" : ""}`}>
                            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                            <p className="text-[11px] text-white/40">Staff</p>
                        </div>

                        {isSidebarOpen && (
                            <button
                                onClick={handleLogout}
                                className="p-1.5 rounded-lg transition-colors hover:bg-white/10 text-white/40 hover:text-white flex-shrink-0"
                                title="Logout"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </aside >

            {/* Main Content */}
            < div className={`transition-all duration-300 min-h-screen
                ${isSidebarOpen ? "lg:ml-64" : "lg:ml-[68px]"}`
            }>

                <header
                    className="h-14 px-6 lg:px-8 flex items-center sticky top-0 z-30"
                    style={{ borderBottom: `1px solid ${T.border}`, backgroundColor: T.white, boxShadow: "0 1px 8px rgba(29,53,87,0.06)" }}
                >
                    {/* Mobile only toggle */}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="lg:hidden p-2 rounded-lg hover:bg-[#1D3557]/5"
                        style={{ color: T.textLight }}
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </header>

                <main className="p-6 lg:p-8">
                    <Outlet context={{ refreshBadges: fetchBadges, badges }} />
                </main>
            </div >
        </div >
    );
}

export default StaffLayout;
