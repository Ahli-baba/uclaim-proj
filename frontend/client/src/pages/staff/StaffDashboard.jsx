import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import {
    LayoutDashboard, Package, Clock,
    CheckCircle, AlertCircle, ArrowRight,
} from "lucide-react";

const T = {
    navy: "#1D3557",
    steel: "#468FAF",
    cool: "#F8F9FA",
    white: "#FFFFFF",
    text: "#1D3557",
    textLight: "#6B7280",
    border: "rgba(29,53,87,0.08)",
};

const Skeleton = ({ className }) => (
    <div
        className={`rounded animate-pulse ${className}`}
        style={{ backgroundColor: "rgba(29,53,87,0.07)" }}
    />
);

const formatDate = (date) => {
    const diff = Date.now() - new Date(date);
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const TypeBadge = ({ type }) => (
    <span
        className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
        style={{
            backgroundColor: type === "found" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
            color: type === "found" ? "#059669" : "#DC2626",
        }}
    >
        {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
);

const SectionHeader = ({ icon: Icon, iconColor = T.steel, title, badge, to }) => (
    <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: `1px solid ${T.border}` }}
    >
        <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" style={{ color: iconColor }} />
            <h2 className="text-sm font-bold" style={{ color: T.navy }}>{title}</h2>
            {badge != null && badge > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    {badge}
                </span>
            )}
        </div>
        <Link
            to={to}
            className="flex items-center gap-1 text-xs font-medium hover:underline"
            style={{ color: T.steel }}
        >
            View all <ArrowRight className="w-3 h-3" />
        </Link>
    </div>
);

const ItemRow = ({ item, showTypeBadge = true }) => (
    <Link
        to="/staff/items"
        className="flex items-center gap-3 px-6 py-3 hover:bg-[#F8F9FA] transition-colors"
    >
        <div
            className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{ backgroundColor: "rgba(70,143,175,0.08)" }}
        >
            {item.images?.[0] ? (
                <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
            ) : (
                <Package className="w-4 h-4" style={{ color: T.steel }} />
            )}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: T.navy }}>{item.title}</p>
            <p className="text-xs truncate" style={{ color: T.textLight }}>
                {item.reportedBy?.name ?? "Unknown"} · {formatDate(item.createdAt)}
                {item.location ? ` · ${item.location}` : ""}
            </p>
        </div>
        {showTypeBadge && <TypeBadge type={item.type} />}
    </Link>
);

function StaffDashboard() {
    const [stats, setStats] = useState({ totalItems: 0, pendingClaims: 0, claimedItems: 0, newItemsToday: 0 });
    const [recentItems, setRecentItems] = useState([]);
    const [pendingClaims, setPendingClaims] = useState([]);
    const [attentionItems, setAttentionItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [statsData, itemsData, claimsData, badgeData] = await Promise.all([
                    api.getStaffDashboardStats(),
                    api.getStaffItems(),
                    api.getStaffClaims("pending"),
                    api.getStaffBadgeCounts(),
                ]);

                const claims = Array.isArray(claimsData) ? claimsData : [];
                const items = Array.isArray(itemsData) ? itemsData : [];

                setStats({
                    totalItems: statsData.overview?.totalItems ?? 0,
                    pendingClaims: claims.length,
                    claimedItems: items.filter(i => i.status === "claimed" || i.status === "resolved").length,
                    newItemsToday: badgeData.newItems ?? 0,
                });

                setRecentItems(
                    [...items]
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .slice(0, 5)
                );

                setAttentionItems(
                    items
                        .filter((i) => i.type === "found" && i.status === "active" && !i.isAtSAO)
                        .slice(0, 5)
                );

                setPendingClaims(
                    [...claims]
                        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                        .slice(0, 5)
                );
            } catch (err) {
                console.error("Failed to fetch staff dashboard:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, []);

    const statCards = [
        { label: "Total Items", value: stats.totalItems, icon: Package, color: T.steel, bg: "rgba(70,143,175,0.08)" },
        { label: "Pending Claims", value: stats.pendingClaims, icon: Clock, color: "#D97706", bg: "rgba(245,158,11,0.08)" },
        { label: "Resolved Items", value: stats.claimedItems, icon: CheckCircle, color: "#059669", bg: "rgba(16,185,129,0.08)" },
        { label: "New Today", value: stats.newItemsToday, icon: AlertCircle, color: "#7C3AED", bg: "rgba(139,92,246,0.08)" },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="pb-6" style={{ borderBottom: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-2 text-xs font-medium tracking-widest uppercase mb-1" style={{ color: T.steel }}>
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Overview</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight" style={{ color: T.navy }}>Staff Dashboard</h1>
                <p className="text-sm mt-1" style={{ color: T.textLight }}>Daily activity and pending tasks</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.label}
                            className="rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-0.5"
                            style={{ backgroundColor: T.white, borderColor: T.border, boxShadow: "0 1px 3px rgba(29,53,87,0.04)" }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2.5 rounded-xl" style={{ backgroundColor: card.bg }}>
                                    <Icon className="w-5 h-5" style={{ color: card.color }} />
                                </div>
                                {loading
                                    ? <Skeleton className="w-10 h-7" />
                                    : <span className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</span>
                                }
                            </div>
                            <p className="text-sm font-semibold" style={{ color: T.navy }}>{card.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Recent Items + Pending Claims */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Recent Items */}
                <div className="rounded-2xl border" style={{ backgroundColor: T.white, borderColor: T.border }}>
                    <SectionHeader icon={Package} title="Recent Items" to="/staff/items" />
                    <div className="divide-y" style={{ borderColor: T.border }}>
                        {loading
                            ? Array(4).fill(0).map((_, i) => (
                                <div key={i} className="px-6 py-3 flex items-center gap-3">
                                    <Skeleton className="w-8 h-8 rounded-lg" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-3 w-32" />
                                        <Skeleton className="h-2.5 w-20" />
                                    </div>
                                    <Skeleton className="h-5 w-12 rounded-full" />
                                </div>
                            ))
                            : recentItems.length === 0
                                ? <p className="px-6 py-8 text-sm text-center" style={{ color: T.textLight }}>No items yet</p>
                                : recentItems.map((item) => <ItemRow key={item._id} item={item} />)
                        }
                    </div>
                </div>

                {/* Pending Claims */}
                <div className="rounded-2xl border" style={{ backgroundColor: T.white, borderColor: T.border }}>
                    <SectionHeader
                        icon={Clock}
                        iconColor="#D97706"
                        title="Pending Claims"
                        badge={stats.pendingClaims}
                        to="/staff/claims"
                    />
                    <div className="divide-y" style={{ borderColor: T.border }}>
                        {loading
                            ? Array(4).fill(0).map((_, i) => (
                                <div key={i} className="px-6 py-3 flex items-center gap-3">
                                    <Skeleton className="w-8 h-8 rounded-full" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-3 w-36" />
                                        <Skeleton className="h-2.5 w-24" />
                                    </div>
                                </div>
                            ))
                            : pendingClaims.length === 0
                                ? (
                                    <div className="px-6 py-8 text-center flex flex-col items-center justify-center" style={{ minHeight: "220px" }}>
                                        <CheckCircle className="w-6 h-6 mb-2" style={{ color: "#059669" }} />
                                        <p className="text-sm font-medium" style={{ color: T.textLight }}>All caught up!</p>
                                    </div>
                                )
                                : pendingClaims.map((claim) => {
                                    // claims may use claimant, submittedBy, or user depending on type
                                    const person = claim.claimant ?? claim.submittedBy ?? claim.user;
                                    const initial = person?.name?.charAt(0)?.toUpperCase() ?? "?";
                                    return (
                                        <Link
                                            to="/staff/claims"
                                            key={claim._id}
                                            className="flex items-center gap-3 px-6 py-3 hover:bg-[#F8F9FA] transition-colors"
                                        >
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm text-white"
                                                style={{ backgroundColor: T.steel }}
                                            >
                                                {initial}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate" style={{ color: T.navy }}>
                                                    {claim.item?.title ?? "Unknown Item"}
                                                </p>
                                                <p className="text-xs" style={{ color: T.textLight }}>
                                                    {person?.name ?? "Unknown"} · {formatDate(claim.createdAt)}
                                                </p>
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
                                                Pending
                                            </span>
                                        </Link>
                                    );
                                })
                        }
                    </div>
                </div>
            </div>

            {/* Items Needing Attention — only shows when there's something to act on */}
            {!loading && attentionItems.length > 0 && (
                <div className="rounded-2xl border" style={{ backgroundColor: T.white, borderColor: T.border }}>
                    <div
                        className="flex items-center justify-between px-6 py-4"
                        style={{ borderBottom: `1px solid ${T.border}` }}
                    >
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" style={{ color: "#D97706" }} />
                            <h2 className="text-sm font-bold" style={{ color: T.navy }}>Needs Attention</h2>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                Found · Not yet at SAO
                            </span>
                        </div>
                        <Link
                            to="/staff/items"
                            className="flex items-center gap-1 text-xs font-medium hover:underline"
                            style={{ color: T.steel }}
                        >
                            Manage <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="divide-y" style={{ borderColor: T.border }}>
                        {attentionItems.map((item) => <ItemRow key={item._id} item={item} showTypeBadge={false} />)}
                    </div>
                </div>
            )}
        </div>
    );
}

export default StaffDashboard;
