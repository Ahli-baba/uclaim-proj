import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { LayoutDashboard, Package, ClipboardCheck, Clock, CheckCircle, AlertCircle } from "lucide-react";

const T = {
    navy: "#1D3557",
    steel: "#468FAF",
    cool: "#F8F9FA",
    white: "#FFFFFF",
    text: "#1D3557",
    textLight: "#6B7280",
    border: "rgba(29,53,87,0.08)",
};

function StaffDashboard() {
    const [stats, setStats] = useState({ totalItems: 0, pendingClaims: 0, approvedClaims: 0, newItemsToday: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const data = await api.getStaffDashboardStats();
            setStats(data);
        } catch (err) {
            console.error("Failed to fetch staff stats:", err);
        } finally {
            setLoading(false);
        }
    };

    const cards = [
        { label: "Total Items", value: stats.totalItems, icon: Package, color: T.steel, bg: "rgba(70,143,175,0.08)" },
        { label: "Pending Claims", value: stats.pendingClaims, icon: Clock, color: "#D97706", bg: "rgba(245,158,11,0.08)" },
        { label: "Approved Claims", value: stats.approvedClaims, icon: CheckCircle, color: "#059669", bg: "rgba(16,185,129,0.08)" },
        { label: "New Today", value: stats.newItemsToday, icon: AlertCircle, color: "#7C3AED", bg: "rgba(139,92,246,0.08)" },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="pb-6" style={{ borderBottom: `1px solid ${T.border}` }}>
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-medium tracking-widest uppercase" style={{ color: T.steel }}>
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span>Overview</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: T.navy }}>Staff Dashboard</h1>
                    <p className="text-sm" style={{ color: T.textLight }}>Daily activity and pending tasks</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.label}
                            className="rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-0.5"
                            style={{
                                backgroundColor: T.white,
                                borderColor: T.border,
                                boxShadow: "0 1px 3px rgba(29,53,87,0.04)",
                            }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div
                                    className="p-2.5 rounded-xl"
                                    style={{ backgroundColor: card.bg }}
                                >
                                    <Icon className="w-5 h-5" style={{ color: card.color }} />
                                </div>
                                {loading ? (
                                    <div className="w-8 h-5 rounded animate-pulse" style={{ backgroundColor: "rgba(29,53,87,0.08)" }} />
                                ) : (
                                    <span className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</span>
                                )}
                            </div>
                            <p className="text-sm font-semibold" style={{ color: T.navy }}>{card.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border p-6" style={{ backgroundColor: T.white, borderColor: T.border }}>
                <h2 className="text-lg font-bold mb-4" style={{ color: T.navy }}>Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                        href="/staff/items"
                        className="flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5"
                        style={{ borderColor: T.border, backgroundColor: T.cool }}
                    >
                        <Package className="w-5 h-5" style={{ color: T.steel }} />
                        <div>
                            <p className="text-sm font-bold" style={{ color: T.navy }}>Manage Items</p>
                            <p className="text-xs" style={{ color: T.textLight }}>View and update item statuses</p>
                        </div>
                    </a>
                    <a
                        href="/staff/claims"
                        className="flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5"
                        style={{ borderColor: T.border, backgroundColor: T.cool }}
                    >
                        <ClipboardCheck className="w-5 h-5" style={{ color: T.steel }} />
                        <div>
                            <p className="text-sm font-bold" style={{ color: T.navy }}>Review Claims</p>
                            <p className="text-xs" style={{ color: T.textLight }}>Approve or reject pending claims</p>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    );
}

export default StaffDashboard;