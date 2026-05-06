import { useState, useEffect } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard, Package, Users, FileText, Settings,
    LogOut, Menu, ClipboardCheck
} from "lucide-react";
import { api } from "../../services/api";

// ── Theme: Steel Blue / Navy Slate / Cool Gray ───────────────────────────────
const T = {
    navy: "#1D3557",        // Navy Slate — sidebar bg, deep surfaces
    steel: "#468FAF",       // Steel Blue — accents, active states, primary
    cool: "#F8F9FA",        // Cool Gray — content background
    white: "#FFFFFF",
    text: "#1D3557",        // Navy for headings on light bg
    textLight: "#6B7280",   // Muted text
    border: "rgba(29,53,87,0.08)",
    surface: "#FFFFFF",     // Card backgrounds
    hover: "rgba(70,143,175,0.06)",
};

function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [user, setUser] = useState(null);
    const [badgeCounts, setBadgeCounts] = useState({ pendingClaims: 0, newItems: 0 });

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

        fetchBadgeCounts();
    }, [navigate]);

    const fetchBadgeCounts = async () => {
        try {
            const data = await api.getAdminBadgeCounts();
            setBadgeCounts({
                pendingClaims: data.pendingClaims || 0,
                newItems: data.newItems || 0
            });
        } catch (err) {
            console.log("Failed to fetch badge counts");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const menuItems = [
        { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
        { path: "/admin/items", icon: Package, label: "All Items", badge: badgeCounts.newItems },
        { path: "/admin/users", icon: Users, label: "Users" },
        { path: "/admin/claims", icon: ClipboardCheck, label: "Claims", badge: badgeCounts.pendingClaims },
        { path: "/admin/reports", icon: FileText, label: "Reports" },
        { path: "/admin/settings", icon: Settings, label: "Settings" },
    ];

    const isActive = (path) => {
        if (path === "/admin") return location.pathname === "/admin";
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

            {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
            <aside
                className={`fixed left-0 top-0 h-full w-64 z-50 transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
                style={{ backgroundColor: T.navy }}
            >
                {/* Logo */}
                <div className="h-16 flex items-center px-6 gap-3">
                    <img src="/UClaim Logo.png" alt="UClaim" className="h-8 w-auto object-contain" />
                    <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-tight text-white leading-tight">Admin Portal</span>
                        <span className="text-[10px] font-medium tracking-wider uppercase text-white/50 leading-tight">UCLAIM MANAGEMENT</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="px-3 py-2 space-y-0.5">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative"
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
                                <Icon className="w-[18px] h-[18px]" />
                                <span className="text-sm font-medium">{item.label}</span>

                                {item.badge > 0 && (
                                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-400 text-white">
                                        {item.badge}
                                    </span>
                                )}

                                {active && !item.badge && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/80" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Admin Info */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white"
                            style={{ backgroundColor: T.steel }}
                        >
                            {user.name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                            <p className="text-[11px] text-white/40">Administrator</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg transition-colors hover:bg-white/10 text-white/40 hover:text-white"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Main Content ────────────────────────────────────────────────────── */}
            <div className={`transition-all duration-300 min-h-screen ${isSidebarOpen ? "lg:ml-64" : ""}`}>
                {/* Top Header */}
                <header
                    className="h-14 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 bg-white/80 backdrop-blur-md"
                    style={{ borderBottom: `1px solid ${T.border}` }}
                >
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="lg:hidden p-2 rounded-lg transition-colors hover:bg-[#1D3557]/5"
                        style={{ color: T.textLight }}
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2">
                        {(badgeCounts.pendingClaims > 0 || badgeCounts.newItems > 0) && (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold bg-red-50 text-red-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                                {badgeCounts.pendingClaims > 0 && `${badgeCounts.pendingClaims} pending claim${badgeCounts.pendingClaims > 1 ? "s" : ""}`}
                                {badgeCounts.pendingClaims > 0 && badgeCounts.newItems > 0 && " · "}
                                {badgeCounts.newItems > 0 && `${badgeCounts.newItems} new item${badgeCounts.newItems > 1 ? "s" : ""}`}
                            </div>
                        )}
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;