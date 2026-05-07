import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { api } from "../../services/api";
import {
    Search, Trash2, Eye, CheckCircle, Clock, X, MapPin,
    Calendar, User, Mail, Tag, FileText, Package,
    ArrowRight, AlertCircle, TrendingDown, TrendingUp,
    Inbox
} from "lucide-react";

// ── Theme ─────────────────────────────────────────────────────────────────────
const T = {
    navy: "#1D3557",
    steel: "#468FAF",
    cool: "#F8F9FA",
    white: "#FFFFFF",
    text: "#1D3557",
    textLight: "#6B7280",
    border: "rgba(29,53,87,0.08)",
    surface: "#FFFFFF",
    hover: "rgba(70,143,175,0.06)",
    lost: "#DC2626",
    lostBg: "rgba(239,68,68,0.08)",
    lostBorder: "rgba(239,68,68,0.15)",
    found: "#059669",
    foundBg: "rgba(16,185,129,0.08)",
    foundBorder: "rgba(16,185,129,0.15)",
};

const STATUS_CONFIG = [
    {
        key: "active",
        label: "Active",
        color: "#D97706",
        bg: "#FEF3C7",
        bgActive: "rgba(254,243,199,0.8)",
        border: "#FDE68A",
    },
    {
        key: "resolved",
        label: "Resolved",
        color: T.steel,
        bg: "rgba(70,143,175,0.1)",
        bgActive: "rgba(70,143,175,0.18)",
        border: "rgba(70,143,175,0.25)",
    },
];

const TYPE_CARDS = {
    lost: {
        key: "lost",
        label: "Lost Items",
        icon: <TrendingDown className="w-5 h-5" />,
        iconColor: T.lost,
        iconBg: T.lostBg,
        accent: T.lost,
        gradient: "linear-gradient(135deg, rgba(239,68,68,0.05) 0%, rgba(239,68,68,0.01) 100%)",
    },
    found: {
        key: "found",
        label: "Found Items",
        icon: <TrendingUp className="w-5 h-5" />,
        iconColor: T.found,
        iconBg: T.foundBg,
        accent: T.found,
        gradient: "linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(16,185,129,0.01) 100%)",
    },
};

function StaffItems() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState(null);          // "lost" | "found" | null
    const [activeStatuses, setActiveStatuses] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => { fetchItems(); }, []);
    useEffect(() => { setCurrentPage(1); }, [typeFilter, activeStatuses, searchQuery]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await api.getStaffItems({});
            setItems(data);
        } catch (err) {
            console.error("Failed to fetch items:", err);
            Swal.fire({ icon: "error", title: "Fetch Failed", text: "Failed to fetch items.", confirmButtonColor: T.navy, customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
        } finally {
            setLoading(false);
        }
    };

    // ── Derived counts ────────────────────────────────────────────────────────
    const lostItems = items.filter(i => i.type === "lost");
    const foundItems = items.filter(i => i.type === "found");

    // ── Filtered table rows ───────────────────────────────────────────────────
    const filteredItems = (() => {
        if (!typeFilter) return [];
        let result = items.filter(i => i.type === typeFilter);
        if (activeStatuses.size > 0) result = result.filter(i => activeStatuses.has(i.status));
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(i =>
                i.title?.toLowerCase().includes(q) ||
                i.category?.toLowerCase().includes(q) ||
                i.reportedBy?.name?.toLowerCase().includes(q)
            );
        }
        return result;
    })();

    const paginated = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const toggleType = (type) => {
        if (typeFilter === type) {
            setTypeFilter(null);
            setActiveStatuses(new Set());
        } else {
            setTypeFilter(type);
            setActiveStatuses(new Set());
        }
    };

    const toggleStatus = (status) => {
        const next = new Set(activeStatuses);
        next.has(status) ? next.delete(status) : next.add(status);
        setActiveStatuses(next);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            icon: "warning",
            title: "Delete this item?",
            text: "This action cannot be undone. All associated claims will also be removed.",
            showCancelButton: true,
            confirmButtonText: "Yes, delete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#DC2626",
            cancelButtonColor: T.navy,
            customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold", cancelButton: "rounded-xl font-bold" }
        });
        if (!result.isConfirmed) return;
        try {
            await api.deleteItemStaff(id);
            fetchItems();
            if (selectedItem?._id === id) closeModal();
        } catch (err) {
            Swal.fire({ icon: "error", title: "Delete Failed", text: err.message || "Unknown error", confirmButtonColor: T.navy, customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
        }
    };

    const handleSAOToggle = async (item) => {
        try {
            await api.updateItemSAOStatus(item._id, !item.isAtSAO);
            fetchItems();
            if (selectedItem?._id === item._id) {
                setSelectedItem(prev => ({ ...prev, isAtSAO: !prev.isAtSAO }));
            }
        } catch (err) {
            Swal.fire({ icon: "error", title: "SAO Update Failed", text: err.message || "Unknown error", confirmButtonColor: T.navy, customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
        }
    };

    const closeModal = () => { setShowModal(false); setSelectedItem(null); };

    // ── Style helpers ─────────────────────────────────────────────────────────
    const getStatusStyle = (status) => {
        const map = {
            active: { bg: "#FEF3C7", text: "#D97706", border: "#FDE68A" },
            resolved: { bg: "rgba(70,143,175,0.1)", text: T.steel, border: "rgba(70,143,175,0.25)" },
        };
        return map[status] || { bg: T.cool, text: T.textLight, border: T.border };
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "active": return <Clock className="w-3 h-3" />;
            case "resolved": return <CheckCircle className="w-3 h-3" />;
            default: return null;
        }
    };

    const getTypeStyle = (type) => type === "lost"
        ? { bg: T.lostBg, text: T.lost, border: T.lostBorder }
        : { bg: T.foundBg, text: T.found, border: T.foundBorder };

    // ── Stat Card Component ───────────────────────────────────────────────────
    const TypeCard = ({ card, sourceItems, isActive, onClick }) => (
        <div
            onClick={onClick}
            className="relative rounded-2xl p-5 border cursor-pointer transition-all duration-300 group overflow-hidden"
            style={{
                background: isActive ? card.gradient : T.white,
                borderColor: isActive ? card.accent : T.border,
                boxShadow: isActive
                    ? `0 8px 30px ${card.accent}25, 0 2px 8px rgba(29,53,87,0.06)`
                    : "0 1px 3px rgba(29,53,87,0.04)",
                transform: isActive ? "translateY(-2px)" : "translateY(0)",
            }}
            onMouseEnter={(e) => {
                if (!isActive) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 25px rgba(29,53,87,0.08)";
                    e.currentTarget.style.borderColor = card.accent + "50";
                }
            }}
            onMouseLeave={(e) => {
                if (!isActive) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(29,53,87,0.04)";
                    e.currentTarget.style.borderColor = T.border;
                }
            }}
        >
            {/* Top accent line */}
            <div
                className="absolute top-0 left-6 right-6 h-[3px] rounded-b-full transition-all duration-300"
                style={{ backgroundColor: isActive ? card.accent : "transparent" }}
            />

            {/* Card header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="p-2.5 rounded-xl transition-all duration-300"
                        style={{ backgroundColor: isActive ? card.iconBg : "rgba(29,53,87,0.04)" }}
                    >
                        {/* clone icon with color */}
                        <span style={{ color: card.iconColor, display: "flex" }}>
                            {card.icon}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold" style={{ color: T.navy }}>{card.label}</h3>
                        <p className="text-[11px] font-medium" style={{ color: T.textLight }}>
                            {sourceItems.length} total
                        </p>
                    </div>
                </div>
                {isActive && (
                    <div
                        className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg"
                        style={{ backgroundColor: card.iconBg, color: card.accent }}
                    >
                        Active <CheckCircle className="w-3 h-3" />
                    </div>
                )}
            </div>

            {/* Status breakdown */}
            <div className="grid grid-cols-3 gap-2">
                {STATUS_CONFIG.map((s) => {
                    const count = sourceItems.filter(i => i.status === s.key).length;
                    const isSelected = isActive && activeStatuses.has(s.key);
                    return (
                        <div
                            key={s.key}
                            onClick={(e) => { e.stopPropagation(); if (isActive) toggleStatus(s.key); }}
                            className="text-center p-2.5 rounded-xl transition-all duration-200 select-none"
                            style={{
                                backgroundColor: isSelected ? s.bgActive : (isActive ? s.bg + "55" : T.cool),
                                border: isSelected ? `2px solid ${s.color}` : "2px solid transparent",
                                transform: isSelected ? "scale(1.05)" : "scale(1)",
                                boxShadow: isSelected ? `0 2px 8px ${s.color}25` : "none",
                                opacity: isActive ? 1 : 0.55,
                                cursor: isActive ? "pointer" : "default",
                            }}
                            onMouseEnter={(e) => { if (isActive && !isSelected) { e.currentTarget.style.backgroundColor = s.bgActive; e.currentTarget.style.transform = "scale(1.04)"; } }}
                            onMouseLeave={(e) => { if (isActive && !isSelected) { e.currentTarget.style.backgroundColor = s.bg + "55"; e.currentTarget.style.transform = "scale(1)"; } }}
                        >
                            <p className="text-xl font-bold" style={{ color: s.color }}>{count}</p>
                            <p className="text-[10px] font-semibold mt-0.5" style={{ color: s.color, opacity: 0.75 }}>{s.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Bottom hint */}
            <div
                className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold transition-all duration-300"
                style={{ color: isActive ? card.accent : T.textLight, opacity: isActive ? 1 : 0.55 }}
            >
                <span>{isActive ? "Click status boxes to toggle" : "Click card to activate"}</span>
                <ArrowRight className={`w-3 h-3 transition-transform duration-300 ${isActive ? "translate-x-0.5" : "group-hover:translate-x-0.5"}`} />
            </div>
        </div>
    );

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (loading) return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="h-8 w-48 rounded animate-pulse" style={{ backgroundColor: "rgba(29,53,87,0.08)" }} />
            <div className="grid grid-cols-2 gap-4">
                {[1, 2].map(i => <div key={i} className="h-44 rounded-2xl border animate-pulse" style={{ backgroundColor: T.white, borderColor: T.border }} />)}
            </div>
            <div className="h-96 rounded-2xl border animate-pulse" style={{ backgroundColor: T.white, borderColor: T.border }} />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8">

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-6" style={{ borderBottom: `1px solid ${T.border}` }}>
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase" style={{ color: T.steel }}>
                        <Package className="w-3.5 h-3.5" />
                        <span>Inventory</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold tracking-tight" style={{ color: T.navy }}>All Items</h1>
                    <p className="text-sm" style={{ color: T.textLight }}>Manage lost and found items across the platform</p>
                </div>
            </div>

            {/* ── Interactive Type Cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TypeCard
                    card={TYPE_CARDS.lost}
                    sourceItems={lostItems}
                    isActive={typeFilter === "lost"}
                    onClick={() => toggleType("lost")}
                />
                <TypeCard
                    card={TYPE_CARDS.found}
                    sourceItems={foundItems}
                    isActive={typeFilter === "found"}
                    onClick={() => toggleType("found")}
                />
            </div>

            {/* ── Active Filters Bar ──────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    {typeFilter ? (
                        <>
                            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: T.textLight }}>Showing:</span>
                            <span className="text-sm font-bold" style={{ color: T.navy }}>
                                {typeFilter === "lost" ? "Lost Items" : "Found Items"}
                            </span>
                            {activeStatuses.size > 0 ? (
                                <>
                                    <span className="text-[11px]" style={{ color: T.textLight }}>with status</span>
                                    {Array.from(activeStatuses).map(s => {
                                        const sc = getStatusStyle(s);
                                        return (
                                            <span key={s}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border"
                                                style={{ backgroundColor: sc.bg, color: sc.text, borderColor: sc.border }}>
                                                {getStatusIcon(s)}
                                                {s.charAt(0).toUpperCase() + s.slice(1)}
                                            </span>
                                        );
                                    })}
                                </>
                            ) : (
                                <span className="text-[11px] font-medium" style={{ color: T.textLight }}>— select status above</span>
                            )}
                        </>
                    ) : (
                        <span className="text-sm font-medium" style={{ color: T.textLight }}>Select a card above to view records</span>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Search — only visible when a type is selected */}
                    {typeFilter && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: T.textLight }} />
                            <input
                                type="text"
                                placeholder="Search items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 rounded-xl text-xs font-medium focus:outline-none transition-all"
                                style={{
                                    backgroundColor: T.white,
                                    border: `1px solid ${T.border}`,
                                    color: T.navy,
                                    width: "200px",
                                }}
                                onFocus={(e) => e.target.style.borderColor = T.steel}
                                onBlur={(e) => e.target.style.borderColor = T.border}
                            />
                        </div>
                    )}
                    {typeFilter && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                            style={{ backgroundColor: "rgba(29,53,87,0.06)", color: T.navy }}>
                            <Inbox className="w-3.5 h-3.5" />
                            {filteredItems.length} {filteredItems.length === 1 ? "record" : "records"}
                        </span>
                    )}
                </div>
            </div>

            {/* ── Table ──────────────────────────────────────────────────────── */}
            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: T.white, borderColor: T.border, boxShadow: "0 1px 3px rgba(29,53,87,0.04)" }}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead style={{ backgroundColor: T.cool, borderBottom: `1px solid ${T.border}` }}>
                            <tr>
                                {["Item", "Type", "Status", "Reported By", "Date", "SAO Status", "Actions"].map((h) => (
                                    <th key={h} className="text-left px-6 py-4 text-xs font-bold tracking-wide uppercase" style={{ color: T.navy }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: T.border }}>
                            {paginated.map((item) => {
                                const statusStyle = getStatusStyle(item.status);
                                const typeStyle = getTypeStyle(item.type);
                                return (
                                    <tr
                                        key={item._id}
                                        className="transition-colors duration-150"
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = T.hover}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                    >
                                        {/* Item */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: T.cool }}>
                                                    {item.images?.[0]
                                                        ? <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                                                        : <Package className="w-5 h-5" style={{ color: T.textLight }} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold truncate" style={{ color: T.navy }}>{item.title}</p>
                                                    <p className="text-[11px]" style={{ color: T.textLight }}>{item.category || "Uncategorized"}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Type */}
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize border"
                                                style={{ backgroundColor: typeStyle.bg, color: typeStyle.text, borderColor: typeStyle.border }}>
                                                {item.type}
                                            </span>
                                        </td>

                                        {/* Status — static badge */}
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                                                style={{
                                                    backgroundColor: statusStyle.bg,
                                                    color: statusStyle.text,
                                                    borderColor: statusStyle.border,
                                                }}>
                                                {getStatusIcon(item.status)}
                                                {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
                                            </span>
                                        </td>

                                        {/* Reported By */}
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold" style={{ color: T.navy }}>{item.reportedBy?.name || "Unknown"}</p>
                                            <p className="text-[11px]" style={{ color: T.textLight }}>{item.reportedBy?.email || "—"}</p>
                                        </td>

                                        {/* Date */}
                                        <td className="px-6 py-4 text-[13px]" style={{ color: T.textLight }}>
                                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}
                                        </td>

                                        {/* SAO Status */}
                                        <td className="px-6 py-4">
                                            {item.type === "found" ? (
                                                item.status === "resolved" ? (
                                                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold border"
                                                        style={{ backgroundColor: "rgba(91,33,182,0.08)", color: "#5B21B6", borderColor: "rgba(91,33,182,0.15)" }}>
                                                        ✓ Picked Up
                                                    </span>
                                                ) : (
                                                    <button onClick={() => handleSAOToggle(item)}
                                                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all duration-200 hover:-translate-y-0.5"
                                                        style={item.isAtSAO
                                                            ? { backgroundColor: T.foundBg, color: T.found, borderColor: T.foundBorder }
                                                            : { backgroundColor: T.cool, color: T.textLight, borderColor: T.border }}>
                                                        {item.isAtSAO ? "✓ At SAO" : "Not at SAO"}
                                                    </button>
                                                )
                                            ) : (
                                                <span className="text-xs" style={{ color: "rgba(107,114,128,0.35)" }}>—</span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => { setSelectedItem(item); setShowModal(true); }}
                                                    className="p-2 rounded-lg transition-all duration-200"
                                                    style={{ color: T.steel }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(70,143,175,0.08)"}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item._id)}
                                                    className="p-2 rounded-lg transition-all duration-200"
                                                    style={{ color: "#DC2626" }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.06)"}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredItems.length > itemsPerPage && (
                    <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: `1px solid ${T.border}` }}>
                        <span className="text-xs font-medium" style={{ color: T.textLight }}>
                            Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30 border"
                                style={{ backgroundColor: T.white, color: T.navy, borderColor: T.border }}>
                                Prev
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button key={page} onClick={() => setCurrentPage(page)}
                                    className="w-8 h-8 rounded-lg text-xs font-bold transition-all"
                                    style={{
                                        backgroundColor: currentPage === page ? T.navy : "transparent",
                                        color: currentPage === page ? T.white : T.textLight,
                                        border: currentPage === page ? "none" : `1px solid ${T.border}`,
                                    }}>
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30 border"
                                style={{ backgroundColor: T.white, color: T.navy, borderColor: T.border }}>
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {filteredItems.length === 0 && (
                    <div className="text-center py-16 space-y-2">
                        {typeFilter && activeStatuses.size > 0
                            ? <AlertCircle className="w-8 h-8 mx-auto" style={{ color: "rgba(29,53,87,0.2)" }} />
                            : <Package className="w-10 h-10 mx-auto opacity-20" style={{ color: T.navy }} />}
                        <p className="text-sm font-medium" style={{ color: T.navy }}>
                            {!typeFilter ? "Select a card above to view items" : "No records match your filters"}
                        </p>
                        {typeFilter && activeStatuses.size === 0 && (
                            <p className="text-xs" style={{ color: T.textLight }}>Click the status boxes on the card to filter</p>
                        )}
                    </div>
                )}
            </div>

            {/* ═══ DETAIL MODAL ════════════════════════════════════════════════ */}
            {showModal && selectedItem && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(29,53,87,0.4)", backdropFilter: "blur(4px)" }}>
                    <div className="rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white"
                        style={{ boxShadow: "0 25px 50px -12px rgba(29,53,87,0.25)" }}>

                        {/* Modal Header */}
                        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10"
                            style={{ borderColor: T.border }}>
                            <div className="flex items-center gap-3">
                                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize border"
                                    style={{
                                        backgroundColor: getTypeStyle(selectedItem.type).bg,
                                        color: getTypeStyle(selectedItem.type).text,
                                        borderColor: getTypeStyle(selectedItem.type).border,
                                    }}>
                                    {selectedItem.type}
                                </span>
                                <h2 className="text-xl font-bold" style={{ color: T.navy }}>{selectedItem.title}</h2>
                            </div>
                            <button onClick={closeModal}
                                className="p-2 rounded-full transition-colors duration-200"
                                style={{ color: T.textLight }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = T.cool}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Image */}
                            {selectedItem.images?.[0] && (
                                <div className="w-full h-56 rounded-2xl overflow-hidden" style={{ backgroundColor: T.cool }}>
                                    <img src={selectedItem.images[0]} alt={selectedItem.title} className="w-full h-full object-cover" />
                                </div>
                            )}

                            {/* Status row */}
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium" style={{ color: T.textLight }}>Status:</span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border"
                                    style={{
                                        backgroundColor: getStatusStyle(selectedItem.status).bg,
                                        color: getStatusStyle(selectedItem.status).text,
                                        borderColor: getStatusStyle(selectedItem.status).border,
                                    }}>
                                    {getStatusIcon(selectedItem.status)}
                                    {selectedItem.status?.charAt(0).toUpperCase() + selectedItem.status?.slice(1)}
                                </span>
                            </div>

                            {/* SAO Toggle (found items only) */}
                            {selectedItem.type === "found" && (
                                <div className="flex items-center justify-between p-4 rounded-2xl border"
                                    style={{ backgroundColor: T.cool, borderColor: T.border }}>
                                    <div className="flex items-center gap-3">
                                        <MapPin className="w-4 h-4" style={{ color: T.textLight }} />
                                        <div>
                                            <p className="text-sm font-semibold" style={{ color: T.navy }}>SAO Presence</p>
                                            <p className="text-xs" style={{ color: T.textLight }}>
                                                {selectedItem.isAtSAO ? "Item is currently at the SAO office" : "Item has not been brought to SAO yet"}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleSAOToggle(selectedItem)}
                                        className="px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 hover:-translate-y-0.5"
                                        style={selectedItem.isAtSAO
                                            ? { backgroundColor: T.foundBg, color: T.found, borderColor: T.foundBorder }
                                            : { backgroundColor: T.white, color: T.navy, borderColor: T.border }}>
                                        {selectedItem.isAtSAO ? "✓ At SAO" : "Mark as At SAO"}
                                    </button>
                                </div>
                            )}

                            {/* Description */}
                            {selectedItem.description && (
                                <div className="p-4 rounded-2xl" style={{ backgroundColor: T.cool }}>
                                    <div className="flex items-center gap-2 mb-2" style={{ color: T.textLight }}>
                                        <FileText className="w-4 h-4" />
                                        <span className="text-sm font-semibold" style={{ color: T.navy }}>Description</span>
                                    </div>
                                    <p className="text-sm leading-relaxed" style={{ color: T.textLight }}>{selectedItem.description}</p>
                                </div>
                            )}

                            {/* Details grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { icon: Tag, label: "Category", value: selectedItem.category || "N/A" },
                                    { icon: MapPin, label: "Location", value: selectedItem.location || "N/A" },
                                    { icon: Calendar, label: "Date Reported", value: selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString() : "N/A" },
                                    { icon: User, label: "Reported By", value: selectedItem.reportedBy?.name || "Unknown" },
                                ].map((d) => (
                                    <div key={d.label} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: T.cool }}>
                                        <d.icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: T.textLight }} />
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: T.textLight }}>{d.label}</p>
                                            <p className="text-sm font-semibold mt-0.5" style={{ color: T.navy }}>{d.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Contact */}
                            <div className="p-4 rounded-2xl" style={{ backgroundColor: T.cool }}>
                                <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: T.navy }}>
                                    <Mail className="w-4 h-4" style={{ color: T.steel }} />
                                    Contact Information
                                </h3>
                                <div className="space-y-1.5 text-[13px]">
                                    <p><span className="font-semibold" style={{ color: T.navy }}>Name:</span> <span style={{ color: T.textLight }}>{selectedItem.reportedBy?.name || "N/A"}</span></p>
                                    <p><span className="font-semibold" style={{ color: T.navy }}>Email:</span> <span style={{ color: T.textLight }}>{selectedItem.reportedBy?.email || "N/A"}</span></p>
                                    {selectedItem.reportedBy?.phone && (
                                        <p><span className="font-semibold" style={{ color: T.navy }}>Phone:</span> <span style={{ color: T.textLight }}>{selectedItem.reportedBy.phone}</span></p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-6"
                            style={{ backgroundColor: T.cool, borderTop: `1px solid ${T.border}` }}>
                            <button onClick={closeModal}
                                className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                                style={{ color: T.textLight }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.white; e.currentTarget.style.color = T.navy; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = T.textLight; }}>
                                Close
                            </button>
                            <button
                                onClick={() => { handleDelete(selectedItem._id); closeModal(); }}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5"
                                style={{ backgroundColor: "#DC2626" }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#B91C1C"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#DC2626"}>
                                <Trash2 className="w-4 h-4" />
                                Delete Item
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StaffItems;
