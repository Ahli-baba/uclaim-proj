import { useState, useEffect } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard, Users, FileText, Settings,
    LogOut, Menu, PanelLeftClose, PanelLeftOpen
} from "lucide-react";

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
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const menuItems = [
        { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
        { path: "/admin/users", icon: Users, label: "Users" },
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
                className={`fixed left-0 top-0 h-full z-50 overflow-hidden transition-all duration-300
                    ${isSidebarOpen
                        ? "w-64 translate-x-0"
                        : "w-64 -translate-x-full lg:w-[68px] lg:translate-x-0"
                    }`}
                style={{ backgroundColor: T.navy }}
            >
                {/* Logo */}
                <div
                    className="h-16 flex items-center justify-between px-3 flex-shrink-0"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                    <div className={`flex items-center gap-3 min-w-0 ${isSidebarOpen ? "flex-1 pl-2" : "w-full lg:justify-center"}`}>
                        <img src="/UClaim Logo.png" alt="UClaim" className="h-8 w-auto object-contain flex-shrink-0" />
                        <div className={`flex flex-col min-w-0 transition-all duration-200 ${isSidebarOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden lg:hidden"}`}>
                            <span className="text-sm font-bold tracking-tight text-white leading-tight whitespace-nowrap">Admin Portal</span>
                            <span className="text-[10px] font-medium tracking-wider uppercase text-white/50 leading-tight whitespace-nowrap">UCLAIM MANAGEMENT</span>
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

                {/* Navigation */}
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
                                {active && isSidebarOpen && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/80" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Expand button — only when collapsed */}
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

                {/* Admin Info */}
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
                            <p className="text-[11px] text-white/40">Administrator</p>
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
            </aside>

            {/* ── Main Content ────────────────────────────────────────────────────── */}
            <div className={`transition-all duration-300 min-h-screen ${isSidebarOpen ? "lg:ml-64" : "lg:ml-[68px]"}`}>
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