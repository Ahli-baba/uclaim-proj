import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../../services/api";
import {
    LayoutDashboard, Package, Clock,
    CheckCircle, AlertCircle, ArrowRight, Search,
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

const ClaimRow = ({ claim, isFinderReport = false }) => {
    const person = claim.claimant ?? claim.submittedBy ?? claim.user;
    const initial = person?.name?.charAt(0)?.toUpperCase() ?? "?";
    return (
        <div className="flex items-center gap-3 px-5 py-3 hover:bg-[#F8F9FA] transition-colors">
            <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm text-white"
                style={{ backgroundColor: isFinderReport ? "#7C3AED" : T.steel }}
            >
                {initial}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: T.navy }}>
                    {claim.item?.title ?? "Unknown Item"}
                </p>
                <p className="text-xs truncate" style={{ color: T.textLight }}>
                    {person?.name ?? "Unknown"} · {formatDate(claim.createdAt)}
                </p>
            </div>
            <Link
                to="/staff/claims"
                className="flex-shrink-0 flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
                style={{
                    backgroundColor: isFinderReport ? "rgba(124,58,237,0.08)" : "rgba(245,158,11,0.08)",
                    color: isFinderReport ? "#7C3AED" : "#D97706",
                }}
            >
                Review <ArrowRight className="w-3 h-3" />
            </Link>
        </div>
    );
};

function StaffDashboard() {
    const { badges } = useOutletContext();
    const [stats, setStats] = useState({ totalItems: 0, pendingClaims: 0, pendingFinderReports: 0, claimedItems: 0, newItemsToday: 0 });
    const [recentItems, setRecentItems] = useState([]);
    const [pendingClaims, setPendingClaims] = useState([]);
    const [pendingFinderReports, setPendingFinderReports] = useState([]);
    const [attentionItems, setAttentionItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [statsData, itemsData, claimsData] = await Promise.all([
                    api.getStaffDashboardStats(),
                    api.getStaffItems(),
                    api.getStaffClaims(""),
                ]);

                const allClaims = Array.isArray(claimsData) ? claimsData : (claimsData?.claims || []);
                const items = Array.isArray(itemsData) ? itemsData : (itemsData?.items || []);

                const regularPending = allClaims.filter(c => c.type !== "finder_report" && c.status === "pending");
                const finderPending = allClaims.filter(c => c.type === "finder_report" && c.status === "pending");

                setStats({
                    totalItems: statsData.overview?.totalItems ?? 0,
                    pendingClaims: regularPending.length,
                    pendingFinderReports: finderPending.length,
                    claimedItems: items.filter(i => i.status === "resolved").length,
                    newItemsToday: badges?.newItems ?? 0,
                });

                setRecentItems(
                    [...items]
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .slice(0, 7)
                );

                setAttentionItems(
                    items
                        .filter((i) => i.type === "found" && i.status === "active" && !i.isAtSAO)
                        .slice(0, 10)
                );

                setPendingClaims(
                    regularPending
                        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                        .slice(0, 8)
                );

                setPendingFinderReports(
                    finderPending
                        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                        .slice(0, 8)
                );
            } catch (err) {
                console.error("Failed to fetch staff dashboard:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [badges]);

    const statCards = [
        { label: "Total Items", value: stats.totalItems, icon: Package, color: T.steel, bg: "rgba(70,143,175,0.08)" },
        { label: "Pending Claims", value: stats.pendingClaims, icon: Clock, color: "#D97706", bg: "rgba(245,158,11,0.08)" },
        { label: "Finder Reports", value: stats.pendingFinderReports, icon: Search, color: "#7C3AED", bg: "rgba(139,92,246,0.08)" },
        { label: "New Today", value: stats.newItemsToday, icon: AlertCircle, color: "#059669", bg: "rgba(16,185,129,0.08)" },
    ];

    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-6" style={{ minHeight: "calc(100vh - 200px)" }}>
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

            {/* Needs Attention Banner */}
            {!loading && attentionItems.length > 0 && (
                <div
                    className="rounded-2xl p-4 flex items-center justify-between gap-4"
                    style={{ backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl" style={{ backgroundColor: "rgba(245,158,11,0.15)" }}>
                            <AlertCircle className="w-5 h-5" style={{ color: "#D97706" }} />
                        </div>
                        <div>
                            <p className="text-sm font-bold" style={{ color: "#92400E" }}>
                                {attentionItems.length} Found Item{attentionItems.length > 1 ? "s" : ""} Not Yet at SAO
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "#B45309" }}>
                                These were reported as found but haven't been brought to the SAO office yet.
                            </p>
                        </div>
                    </div>
                    <Link
                        to="/staff/items"
                        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 hover:-translate-y-0.5"
                        style={{ backgroundColor: "#D97706", color: "white" }}
                    >
                        Manage <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            )}

            {/* Recent Items + Pending Claims */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1" style={{ alignItems: "stretch", height: "420px" }}>
                {/* Recent Items */}
                <div className="rounded-2xl border flex flex-col" style={{ backgroundColor: T.white, borderColor: T.border, height: "100%", maxHeight: "500px", overflow: "hidden" }}>
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

                {/* Right Column: Claims + Finder Reports stacked */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", height: "100%" }}>

                    {/* Pending Claims */}
                    <div style={{ backgroundColor: T.white, borderColor: T.border, flex: 1, display: "flex", flexDirection: "column", borderWidth: 1, borderStyle: "solid", borderRadius: "1rem" }}>
                        <SectionHeader
                            icon={Clock}
                            iconColor="#D97706"
                            title="Pending Claims"
                            badge={stats.pendingClaims}
                            to="/staff/claims"
                        />
                        <div style={{ borderColor: T.border, overflowY: "auto", minHeight: "150px", display: "flex", flexDirection: "column" }} className="divide-y">
                            {loading
                                ? Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="px-5 py-3 flex items-center gap-3">
                                        <Skeleton className="w-8 h-8 rounded-full" />
                                        <div className="flex-1 space-y-1.5">
                                            <Skeleton className="h-3 w-36" />
                                            <Skeleton className="h-2.5 w-24" />
                                        </div>
                                        <Skeleton className="h-6 w-16 rounded-lg" />
                                    </div>
                                ))
                                : pendingClaims.length === 0
                                    ? (
                                        <div className="flex flex-col items-center justify-center gap-1.5 flex-1">
                                            <CheckCircle className="w-5 h-5" style={{ color: "#059669" }} />
                                            <p className="text-sm font-medium" style={{ color: T.textLight }}>All caught up!</p>
                                        </div>
                                    )
                                    : pendingClaims.map((claim) => <ClaimRow key={claim._id} claim={claim} />)
                            }
                        </div>
                    </div>

                    {/* Pending Finder Reports */}
                    <div style={{ backgroundColor: T.white, borderColor: T.border, flex: 1, display: "flex", flexDirection: "column", borderWidth: 1, borderStyle: "solid", borderRadius: "1rem" }}>
                        <SectionHeader
                            icon={Search}
                            iconColor="#7C3AED"
                            title="Pending Finder Reports"
                            badge={stats.pendingFinderReports}
                            to="/staff/claims"
                        />
                        <div style={{ borderColor: T.border, overflowY: "auto", minHeight: "150px", display: "flex", flexDirection: "column" }} className="divide-y">
                            {loading
                                ? Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="px-5 py-3 flex items-center gap-3">
                                        <Skeleton className="w-8 h-8 rounded-full" />
                                        <div className="flex-1 space-y-1.5">
                                            <Skeleton className="h-3 w-36" />
                                            <Skeleton className="h-2.5 w-24" />
                                        </div>
                                        <Skeleton className="h-6 w-16 rounded-lg" />
                                    </div>
                                ))
                                : pendingFinderReports.length === 0
                                    ? (
                                        <div className="flex flex-col items-center justify-center gap-1.5 flex-1">
                                            <CheckCircle className="w-5 h-5" style={{ color: "#059669" }} />
                                            <p className="text-sm font-medium" style={{ color: T.textLight }}>No pending finder reports</p>
                                        </div>
                                    )
                                    : pendingFinderReports.map((report) => <ClaimRow key={report._id} claim={report} isFinderReport />)
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StaffDashboard;
