import { useState, useEffect } from "react";
import { api } from "../../services/api";
import {
    Search, Trash2, Eye, CheckCircle, Clock, X, MapPin,
    Calendar, User, Mail, Tag, FileText, Filter, Package
} from "lucide-react";

// ── Theme constants ───────────────────────────────────────────────────────────
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
};

function AdminItems() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ status: "", type: "", search: "" });
    const [selectedItem, setSelectedItem] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    useEffect(() => {
        setCurrentPage(1);
        fetchItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await api.getAllItemsAdmin(filter);
            setItems(data);
        } catch (err) {
            console.error("Failed to fetch items:", err);
            alert("Failed to fetch items from backend");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        try {
            await api.deleteItemAdmin(id);
            fetchItems();
        } catch (err) {
            alert("Failed to delete item: " + (err.message || "Unknown error"));
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            await api.updateItemStatusAdmin(id, status);
            fetchItems();
        } catch (err) {
            alert("Failed to update status: " + (err.message || "Unknown error"));
        }
    };

    const handleViewItem = (item) => {
        setSelectedItem(item);
        setShowModal(true);
    };

    const handleSAOToggle = async (item) => {
        try {
            await api.updateItemSAOStatus(item._id, !item.isAtSAO);
            fetchItems();
            if (selectedItem?._id === item._id) {
                setSelectedItem(prev => ({ ...prev, isAtSAO: !prev.isAtSAO }));
            }
        } catch (err) {
            alert("Failed to update SAO status: " + (err.message || "Unknown error"));
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedItem(null);
    };

    const getStatusStyle = (status) => {
        const styles = {
            active: { bg: "rgba(245,158,11,0.08)", text: "#D97706", border: "rgba(245,158,11,0.2)" },
            claimed: { bg: "rgba(16,185,129,0.08)", text: "#059669", border: "rgba(16,185,129,0.2)" },
            resolved: { bg: "rgba(70,143,175,0.08)", text: T.steel, border: "rgba(70,143,175,0.2)" }
        };
        return styles[status] || { bg: T.cool, text: T.textLight, border: T.border };
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "active": return <Clock className="w-3 h-3" />;
            case "claimed": return <CheckCircle className="w-3 h-3" />;
            case "resolved": return <CheckCircle className="w-3 h-3" />;
            default: return null;
        }
    };

    const getTypeStyle = (type) => {
        return type === "lost"
            ? { bg: "rgba(239,68,68,0.08)", text: "#DC2626", border: "rgba(239,68,68,0.15)" }
            : { bg: "rgba(16,185,129,0.08)", text: "#059669", border: "rgba(16,185,129,0.15)" };
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">

            {/* ── Header ───────────────────────────────────────────────────────────── */}
            <div className="pb-6" style={{ borderBottom: `1px solid ${T.border}` }}>
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-medium tracking-widest uppercase" style={{ color: T.steel }}>
                        <Package className="w-3.5 h-3.5" />
                        <span>Inventory</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: T.navy }}>All Items</h1>
                    <p className="text-sm" style={{ color: T.textLight }}>Manage lost and found items across the platform</p>
                </div>
            </div>

            {/* ── Filters ────────────────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[280px] relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.textLight }} />
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={filter.search}
                        onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                        style={{
                            backgroundColor: T.white,
                            border: `1px solid ${T.border}`,
                            color: T.navy,
                        }}
                        onFocus={(e) => e.target.style.borderColor = T.steel}
                        onBlur={(e) => e.target.style.borderColor = T.border}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: T.textLight }} />
                    <select
                        value={filter.type}
                        onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                        className="pl-9 pr-8 py-2.5 rounded-xl text-sm font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2"
                        style={{
                            backgroundColor: T.white,
                            border: `1px solid ${T.border}`,
                            color: T.navy,
                        }}
                    >
                        <option value="">All Types</option>
                        <option value="lost">Lost</option>
                        <option value="found">Found</option>
                    </select>
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: T.textLight }} />
                    <select
                        value={filter.status}
                        onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                        className="pl-9 pr-8 py-2.5 rounded-xl text-sm font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2"
                        style={{
                            backgroundColor: T.white,
                            border: `1px solid ${T.border}`,
                            color: T.navy,
                        }}
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="claimed">Claimed</option>
                        <option value="resolved">Resolved</option>
                    </select>
                </div>
            </div>

            {/* ── Table ──────────────────────────────────────────────────────────────── */}
            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: T.white, borderColor: T.border }}>
                {loading ? (
                    <div className="text-center py-16 space-y-3">
                        <div className="w-8 h-8 border-2 rounded-full mx-auto animate-spin" style={{ borderColor: T.steel, borderTopColor: "transparent" }} />
                        <p className="text-sm" style={{ color: T.textLight }}>Loading items...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ backgroundColor: T.cool, borderBottom: `1px solid ${T.border}` }}>
                                    {["Item", "Type", "Status", "Reported By", "Date", "SAO Status", "Actions"].map((h) => (
                                        <th
                                            key={h}
                                            className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider"
                                            style={{ color: T.textLight }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: T.border }}>
                                {items
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((item) => {
                                        const statusStyle = getStatusStyle(item.status);
                                        const typeStyle = getTypeStyle(item.type);
                                        return (
                                            <tr
                                                key={item._id}
                                                className="transition-colors"
                                                style={{ backgroundColor: "transparent" }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.hover; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-11 h-11 rounded-lg overflow-hidden flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: T.cool }}>
                                                            {item.images?.[0] ? (
                                                                <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Package className="w-5 h-5" style={{ color: T.textLight }} />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold truncate" style={{ color: T.navy }}>{item.title}</p>
                                                            <p className="text-xs" style={{ color: T.textLight }}>{item.category || "Uncategorized"}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span
                                                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize border"
                                                        style={{
                                                            backgroundColor: typeStyle.bg,
                                                            color: typeStyle.text,
                                                            borderColor: typeStyle.border,
                                                        }}
                                                    >
                                                        {item.type}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <select
                                                        value={item.status}
                                                        onChange={(e) => handleStatusChange(item._id, e.target.value)}
                                                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer focus:outline-none"
                                                        style={{
                                                            backgroundColor: statusStyle.bg,
                                                            color: statusStyle.text,
                                                            borderColor: statusStyle.border,
                                                        }}
                                                    >
                                                        <option value="active" style={{ color: "#D97706" }}>Active</option>
                                                        <option value="claimed" style={{ color: "#059669" }}>Claimed</option>
                                                        <option value="resolved" style={{ color: T.steel }}>Resolved</option>
                                                    </select>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div>
                                                        <p className="text-sm font-medium" style={{ color: T.navy }}>{item.reportedBy?.name || "Unknown"}</p>
                                                        <p className="text-xs" style={{ color: T.textLight }}>{item.reportedBy?.email || "—"}</p>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-xs font-medium" style={{ color: T.textLight }}>
                                                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}
                                                </td>
                                                <td className="px-5 py-4">
                                                    {item.type === "found" ? (
                                                        item.status === "resolved" ? (
                                                            <span
                                                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold border"
                                                                style={{ backgroundColor: "rgba(139,92,246,0.08)", color: "#7C3AED", borderColor: "rgba(139,92,246,0.15)" }}
                                                            >
                                                                ✓ Picked Up
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleSAOToggle(item)}
                                                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors"
                                                                style={item.isAtSAO ? {
                                                                    backgroundColor: "rgba(16,185,129,0.08)",
                                                                    color: "#059669",
                                                                    borderColor: "rgba(16,185,129,0.15)"
                                                                } : {
                                                                    backgroundColor: T.cool,
                                                                    color: T.textLight,
                                                                    borderColor: T.border
                                                                }}
                                                            >
                                                                {item.isAtSAO ? "✓ At SAO" : "Not at SAO"}
                                                            </button>
                                                        )
                                                    ) : (
                                                        <span className="text-xs" style={{ color: "rgba(107,114,128,0.4)" }}>—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleViewItem(item)}
                                                            className="p-2 rounded-lg transition-colors"
                                                            style={{ color: T.steel }}
                                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.hover; }}
                                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                                                            title="View"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item._id)}
                                                            className="p-2 rounded-lg transition-colors"
                                                            style={{ color: "#DC2626" }}
                                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.06)"; }}
                                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>

                        {/* ── Pagination ─────────────────────────────────────────────────── */}
                        {!loading && items.length > itemsPerPage && (
                            <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: `1px solid ${T.border}` }}>
                                <span className="text-xs font-medium" style={{ color: T.textLight }}>
                                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, items.length)} of {items.length}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
                                        style={{
                                            backgroundColor: currentPage === 1 ? "transparent" : T.white,
                                            color: T.navy,
                                            border: `1px solid ${T.border}`,
                                        }}
                                    >
                                        Prev
                                    </button>
                                    {Array.from({ length: Math.ceil(items.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className="w-8 h-8 rounded-lg text-xs font-bold transition-all"
                                            style={{
                                                backgroundColor: currentPage === page ? T.navy : "transparent",
                                                color: currentPage === page ? T.white : T.textLight,
                                                border: currentPage === page ? "none" : `1px solid ${T.border}`,
                                            }}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(items.length / itemsPerPage), p + 1))}
                                        disabled={currentPage === Math.ceil(items.length / itemsPerPage)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
                                        style={{
                                            backgroundColor: currentPage === Math.ceil(items.length / itemsPerPage) ? "transparent" : T.white,
                                            color: T.navy,
                                            border: `1px solid ${T.border}`,
                                        }}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {!loading && items.length === 0 && (
                    <div className="text-center py-16 space-y-2">
                        <Package className="w-10 h-10 mx-auto opacity-20" style={{ color: T.navy }} />
                        <p className="text-sm font-medium" style={{ color: T.navy }}>No items found</p>
                        <p className="text-xs" style={{ color: T.textLight }}>Try adjusting your filters</p>
                    </div>
                )}
            </div>

            {/* ── Item Detail Modal ──────────────────────────────────────────────────── */}
            {showModal && selectedItem && (
                <div className="fixed inset-0 bg-[#1D3557]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div
                        className="rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        style={{ backgroundColor: T.white }}
                    >
                        {/* Modal Header */}
                        <div
                            className="flex items-center justify-between p-6 sticky top-0 z-10"
                            style={{
                                backgroundColor: T.white,
                                borderBottom: `1px solid ${T.border}`,
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <span
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize border"
                                    style={{
                                        backgroundColor: getTypeStyle(selectedItem.type).bg,
                                        color: getTypeStyle(selectedItem.type).text,
                                        borderColor: getTypeStyle(selectedItem.type).border,
                                    }}
                                >
                                    {selectedItem.type}
                                </span>
                                <h2 className="text-lg font-bold" style={{ color: T.navy }}>{selectedItem.title}</h2>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-2 rounded-lg transition-colors"
                                style={{ color: T.textLight }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.cool; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Image */}
                            {selectedItem.images?.[0] && (
                                <div className="w-full h-56 rounded-xl overflow-hidden" style={{ backgroundColor: T.cool }}>
                                    <img src={selectedItem.images[0]} alt={selectedItem.title} className="w-full h-full object-cover" />
                                </div>
                            )}

                            {/* SAO Toggle */}
                            {selectedItem.type === "found" && (
                                <div
                                    className="flex items-center justify-between p-4 rounded-xl border"
                                    style={{ backgroundColor: T.cool, borderColor: T.border }}
                                >
                                    <div className="flex items-center gap-3">
                                        <MapPin className="w-4 h-4" style={{ color: T.textLight }} />
                                        <div>
                                            <p className="text-sm font-semibold" style={{ color: T.navy }}>SAO Presence</p>
                                            <p className="text-xs" style={{ color: T.textLight }}>
                                                {selectedItem.isAtSAO ? "Item is at the SAO office" : "Item has not been brought to SAO"}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleSAOToggle(selectedItem)}
                                        className="px-4 py-2 rounded-xl text-xs font-bold border transition-colors"
                                        style={selectedItem.isAtSAO ? {
                                            backgroundColor: "rgba(16,185,129,0.08)",
                                            color: "#059669",
                                            borderColor: "rgba(16,185,129,0.15)"
                                        } : {
                                            backgroundColor: T.white,
                                            color: T.navy,
                                            borderColor: T.border
                                        }}
                                    >
                                        {selectedItem.isAtSAO ? "✓ At SAO" : "Mark as At SAO"}
                                    </button>
                                </div>
                            )}

                            {/* Status */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium" style={{ color: T.textLight }}>Status:</span>
                                <span
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border"
                                    style={{
                                        backgroundColor: getStatusStyle(selectedItem.status).bg,
                                        color: getStatusStyle(selectedItem.status).text,
                                        borderColor: getStatusStyle(selectedItem.status).border,
                                    }}
                                >
                                    {getStatusIcon(selectedItem.status)}
                                    {selectedItem.status?.charAt(0).toUpperCase() + selectedItem.status?.slice(1)}
                                </span>
                            </div>

                            {/* Description */}
                            {selectedItem.description && (
                                <div className="p-4 rounded-xl" style={{ backgroundColor: T.cool }}>
                                    <div className="flex items-center gap-2 mb-2" style={{ color: T.textLight }}>
                                        <FileText className="w-4 h-4" />
                                        <span className="text-sm font-medium">Description</span>
                                    </div>
                                    <p className="text-sm leading-relaxed" style={{ color: T.navy }}>{selectedItem.description}</p>
                                </div>
                            )}

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { icon: Tag, label: "Category", value: selectedItem.category || "N/A" },
                                    { icon: MapPin, label: "Location", value: selectedItem.location || "N/A" },
                                    { icon: Calendar, label: "Date Reported", value: selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString() : "N/A" },
                                    { icon: User, label: "Reported By", value: selectedItem.reportedBy?.name || "Unknown" },
                                ].map((detail) => (
                                    <div key={detail.label} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: T.cool }}>
                                        <detail.icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: T.textLight }} />
                                        <div>
                                            <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: T.textLight }}>{detail.label}</p>
                                            <p className="text-sm font-semibold mt-0.5" style={{ color: T.navy }}>{detail.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Contact */}
                            <div className="pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
                                <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: T.navy }}>
                                    <Mail className="w-4 h-4" style={{ color: T.steel }} />
                                    Contact Information
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <p style={{ color: T.navy }}><span style={{ color: T.textLight }}>Name:</span> {selectedItem.reportedBy?.name || "N/A"}</p>
                                    <p style={{ color: T.navy }}><span style={{ color: T.textLight }}>Email:</span> {selectedItem.reportedBy?.email || "N/A"}</p>
                                    {selectedItem.reportedBy?.phone && (
                                        <p style={{ color: T.navy }}><span style={{ color: T.textLight }}>Phone:</span> {selectedItem.reportedBy.phone}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div
                            className="flex items-center justify-end gap-3 p-6"
                            style={{
                                backgroundColor: T.cool,
                                borderTop: `1px solid ${T.border}`,
                            }}
                        >
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                                style={{ color: T.textLight }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.white; e.currentTarget.style.color = T.navy; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = T.textLight; }}
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    handleDelete(selectedItem._id);
                                    closeModal();
                                }}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors flex items-center gap-2"
                                style={{ backgroundColor: "#DC2626" }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#B91C1C"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#DC2626"; }}
                            >
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

export default AdminItems;