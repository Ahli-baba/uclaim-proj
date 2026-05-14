import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { api } from "../../services/api";
import {
    Trash2, Eye, X, MapPin,
    Calendar, User, Tag, Package,
    HelpCircle, Layers, ArrowRight,
    AlertCircle, CheckCircle, Bell
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
        icon: <HelpCircle className="w-5 h-5" />,
        iconColor: T.lost,
        iconBg: T.lostBg,
        accent: T.lost,
        gradient: "linear-gradient(135deg, rgba(239,68,68,0.05) 0%, rgba(239,68,68,0.01) 100%)",
    },
    found: {
        key: "found",
        label: "Found Items",
        icon: <Layers className="w-5 h-5" />,
        iconColor: T.found,
        iconBg: T.foundBg,
        accent: T.found,
        gradient: "linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(16,185,129,0.01) 100%)",
    },
};

function StaffItems() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState(null);
    const [activeStatuses, setActiveStatuses] = useState(new Set());
    const [selectedItem, setSelectedItem] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [showLogModal, setShowLogModal] = useState(false);
    const [modalImageIdx, setModalImageIdx] = useState(0);
    const [logForm, setLogForm] = useState({ title: "", category: "", description: "", location: "", dateFound: "", images: [] });
    const [logLoading, setLogLoading] = useState(false);
    const [notifyLoading, setNotifyLoading] = useState(false);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchItems();
        api.getCategories().then(setCategories).catch(() => setCategories([
            { name: "Electronics", value: "Electronics" },
            { name: "Documents", value: "Documents" },
            { name: "Bags & Luggage", value: "Bags" },
            { name: "Keys", value: "Keys" },
            { name: "Wallet & Cards", value: "Wallet" },
            { name: "Clothing", value: "Clothing" },
            { name: "Others", value: "Others" },
        ]));
    }, []);
    useEffect(() => { setCurrentPage(1); }, [typeFilter, activeStatuses]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await api.getStaffItems({});
            setItems(Array.isArray(data) ? data : (data?.items || []));
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
        if (!typeFilter || activeStatuses.size === 0) return [];
        let result = items.filter(i => i.type === typeFilter);
        result = result.filter(i => activeStatuses.has(i.status));
        result.sort((a, b) => {
            if (a.status === b.status) return 0;
            return a.status === "active" ? -1 : 1;
        });
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
            setActiveStatuses(new Set(["active"]));
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
            const newValue = !item.isAtSAO;
            await api.updateItemSAOStatusStaff(item._id, newValue);

            setItems(prev => prev.map(i => i._id === item._id ? { ...i, isAtSAO: newValue } : i));

            if (selectedItem?._id === item._id) {
                setSelectedItem(prev => ({ ...prev, isAtSAO: newValue }));
            }
        } catch (err) {
            Swal.fire({ icon: "error", title: "SAO Update Failed", text: err.message || "Unknown error", confirmButtonColor: T.navy, customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
        }
    };

    const closeModal = () => { setShowModal(false); setSelectedItem(null); };

    const handleLogFound = async () => {
        if (!logForm.title.trim() || !logForm.category.trim()) {
            Swal.fire({ icon: "warning", title: "Required Fields", text: "Title and category are required.", confirmButtonColor: T.navy, customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
            return;
        }
        setLogLoading(true);
        try {
            await api.addItem({
                title: logForm.title.trim(),
                category: logForm.category.trim(),
                description: logForm.description.trim(),
                location: logForm.location.trim(),
                date: logForm.dateFound || new Date().toISOString(),
                type: "found",
                status: "active",
                isAtSAO: true,
                images: logForm.images || [],
            });
            setShowLogModal(false);
            setLogForm({ title: "", category: "", description: "", location: "", dateFound: "", images: [] });
            fetchItems();
            Swal.fire({ icon: "success", title: "Item Logged", text: "Found item has been recorded and marked as at SAO.", confirmButtonColor: T.navy, customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
        } catch (err) {
            Swal.fire({ icon: "error", title: "Failed", text: err.message || "Unknown error", confirmButtonColor: T.navy, customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
        } finally {
            setLogLoading(false);
        }
    };

    const handleNotifyOwner = async () => {
        const ownerInitial = selectedItem.reportedBy?.name?.charAt(0)?.toUpperCase() || "?";
        const itemImage = selectedItem.images?.[0];
        const ownerAvatar = selectedItem.reportedBy?.avatar;
        const defaultMessage = `Hi ${selectedItem.reportedBy?.name || "there"}, we found a possible match for your lost item "${selectedItem.title}" at the Student Affairs Office (SAO). Please visit with your valid school ID to verify and collect it.`;

        const result = await Swal.fire({
            title: "Notify Item Owner?",
            html: `
                <div style="text-align:left; font-size:14px; line-height:1.6;">

                    <div style="background:#F8F9FA; border:1px solid rgba(29,53,87,0.08); border-radius:14px; padding:13px 15px; margin-bottom:12px; display:flex; align-items:center; gap:12px;">
                        <div style="width:46px; height:46px; border-radius:10px; overflow:hidden; flex-shrink:0; background:rgba(70,143,175,0.1); display:flex; align-items:center; justify-content:center;">
                            ${itemImage
                    ? `<img src="${itemImage}" style="width:100%; height:100%; object-fit:cover;" />`
                    : `<span style="font-size:20px;">📦</span>`}
                        </div>
                        <div>
                            <p style="margin:0; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#6B7280;">Lost Item</p>
                            <p style="margin:2px 0 0 0; font-weight:700; color:#1D3557; font-size:15px;">${selectedItem.title}</p>
                            <p style="margin:1px 0 0 0; color:#6B7280; font-size:12px;">${selectedItem.category || "Uncategorized"}</p>
                        </div>
                    </div>

                    <div style="background:#F8F9FA; border:1px solid rgba(29,53,87,0.08); border-radius:14px; padding:13px 15px; margin-bottom:12px;">
                        <p style="margin:0 0 10px 0; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#6B7280;">Notifying</p>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:40px; height:40px; border-radius:10px; overflow:hidden; flex-shrink:0;">
                                ${ownerAvatar
                    ? `<img src="${ownerAvatar}" style="width:100%; height:100%; object-fit:cover;" />`
                    : `<div style="width:100%; height:100%; background:#468FAF; display:flex; align-items:center; justify-content:center; color:white; font-weight:700; font-size:15px;">${ownerInitial}</div>`}
                            </div>
                            <div>
                                <p style="margin:0; font-weight:700; color:#1D3557; font-size:14px;">${selectedItem.reportedBy?.name || "Unknown"}</p>
                                <p style="margin:2px 0 0 0; color:#468FAF; font-size:12px; font-weight:600;">${selectedItem.reportedBy?.email || "No email on record"}</p>
                            </div>
                        </div>
                    </div>

                    <div style="background:#F8F9FA; border:1px solid rgba(29,53,87,0.08); border-radius:14px; padding:13px 15px; margin-bottom:12px;">
                        <p style="margin:0 0 8px 0; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#6B7280;">Message to Owner</p>
                        <textarea id="notify-message" rows="4"
                            style="width:100%; padding:10px 12px; border:1px solid rgba(29,53,87,0.12); border-radius:10px; font-size:13px; color:#1D3557; background:white; resize:none; outline:none; line-height:1.6; box-sizing:border-box; font-family:inherit; transition:border-color 0.2s;"
                            onfocus="this.style.borderColor='#468FAF'"
                            onblur="this.style.borderColor='rgba(29,53,87,0.12)'"
                        >${defaultMessage}</textarea>
                        <p style="margin:6px 0 0 0; font-size:11px; color:#9CA3AF;">✏️ You can edit this message before sending.</p>
                    </div>

                    <div style="background:rgba(70,143,175,0.06); border:1px solid rgba(70,143,175,0.15); border-radius:14px; padding:13px 15px;">
                        <p style="margin:0 0 10px 0; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#468FAF;">What gets sent</p>
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <span style="font-size:15px;">🔔</span>
                                <p style="margin:0; color:#374151; font-size:13px;"><strong>In-platform notification</strong> to their account</p>
                            </div>
                            <div style="display:flex; align-items:center; gap:10px;">
                                <span style="font-size:15px;">✉️</span>
                                <p style="margin:0; color:#374151; font-size:13px;"><strong>Email</strong> sent directly to their inbox</p>
                            </div>
                        </div>
                    </div>

                </div>
            `,
            showCancelButton: true,
            confirmButtonText: "Send Notification",
            cancelButtonText: "Cancel",
            confirmButtonColor: T.steel,
            cancelButtonColor: "#6B7280",
            reverseButtons: true,
            preConfirm: () => {
                const msg = document.getElementById("notify-message").value.trim();
                if (!msg) {
                    Swal.showValidationMessage("Message cannot be empty.");
                    return false;
                }
                return msg;
            },
            customClass: {
                popup: "rounded-2xl",
                confirmButton: "rounded-xl font-bold",
                cancelButton: "rounded-xl font-semibold",
                title: "font-bold text-lg"
            }
        });
        if (!result.isConfirmed) return;
        setNotifyLoading(true);
        try {
            await api.notifyItemOwner(selectedItem._id, result.value);
            const notifiedAt = new Date().toISOString();
            setSelectedItem(prev => ({ ...prev, ownerNotified: true, ownerNotifiedAt: notifiedAt }));
            setItems(prev => prev.map(i => i._id === selectedItem._id ? { ...i, ownerNotified: true, ownerNotifiedAt: notifiedAt } : i));
            Swal.fire({
                html: `
                    <div style="text-align:center; padding:8px 0;">
                        <div style="width:56px; height:56px; background:rgba(5,150,105,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px auto; font-size:26px;">✅</div>
                        <p style="font-size:18px; font-weight:700; color:#1D3557; margin:0 0 10px 0;">Owner Notified!</p>
                        <div style="background:#F8F9FA; border:1px solid rgba(29,53,87,0.08); border-radius:12px; padding:12px 16px; margin-bottom:10px; display:flex; align-items:center; gap:10px;">
                            <div style="width:36px; height:36px; border-radius:9px; overflow:hidden; flex-shrink:0;">
                                ${ownerAvatar
                        ? `<img src="${ownerAvatar}" style="width:100%; height:100%; object-fit:cover;" />`
                        : `<div style="width:100%; height:100%; background:#468FAF; display:flex; align-items:center; justify-content:center; color:white; font-weight:700; font-size:13px;">${ownerInitial}</div>`}
                            </div>
                            <div style="text-align:left;">
                                <p style="margin:0; font-weight:700; color:#1D3557; font-size:13px;">${selectedItem.reportedBy?.name || "Owner"}</p>
                                <p style="margin:1px 0 0 0; color:#6B7280; font-size:12px;">${selectedItem.reportedBy?.email || ""}</p>
                            </div>
                        </div>
                        <p style="color:#6B7280; font-size:12px; margin:0;">Platform notification and email have been sent.</p>
                    </div>
                `,
                confirmButtonText: "Done",
                confirmButtonColor: T.navy,
                customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" }
            });
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Notification Failed",
                text: err.message || "Something went wrong. Please try again.",
                confirmButtonColor: T.navy,
                customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" }
            });
        } finally {
            setNotifyLoading(false);
        }
    };
    // ── Style helpers ─────────────────────────────────────────────────────────
    const getStatusStyle = (status) => {
        const map = {
            active: { bg: "#FEF3C7", text: "#D97706", border: "#FDE68A" },
            resolved: { bg: "rgba(70,143,175,0.1)", text: T.steel, border: "rgba(70,143,175,0.25)" },
        };
        return map[status] || { bg: T.cool, text: T.textLight, border: T.border };
    };

    const getStatusIcon = (status) => {
        if (status === "active") return <AlertCircle className="w-3 h-3" />;
        if (status === "resolved") return <CheckCircle className="w-3 h-3" />;
        return null;
    };

    const getTypeStyle = (type) => type === "lost"
        ? { bg: T.lostBg, text: T.lost, border: T.lostBorder }
        : { bg: T.foundBg, text: T.found, border: T.foundBorder };

    // ── Stat Card Component ───────────────────────────────────────────────────
    const TypeCard = ({ card, sourceItems, isActive, onClick }) => (
        <div
            onClick={onClick}
            className="relative rounded-2xl p-4 border cursor-pointer transition-all duration-300 group overflow-hidden"
            style={{
                background: T.white,
                borderColor: isActive ? card.accent : T.border,
                boxShadow: "0 1px 3px rgba(29,53,87,0.04)",
                transform: isActive ? "translateY(-2px)" : "translateY(0)",
            }}
            onMouseEnter={(e) => {
                if (!isActive) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 25px rgba(29,53,87,0.08)";
                    e.currentTarget.style.borderColor = card.accent + "40";
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

            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl transition-all duration-300" style={{ backgroundColor: isActive ? card.iconBg : "rgba(29,53,87,0.04)" }}>
                        <span style={{ color: card.iconColor, display: "flex" }}>{card.icon}</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold" style={{ color: T.navy }}>{card.label}</h3>
                        <p className="text-[11px] font-medium" style={{ color: T.textLight }}>{sourceItems.length} total</p>
                    </div>
                </div>
                {isActive && (
                    <div className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg"
                        style={{ backgroundColor: card.iconBg, color: card.accent }}>
                        Selected
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                {STATUS_CONFIG.map((s) => {
                    const count = sourceItems.filter(i => i.status === s.key).length;
                    const isSelected = isActive && activeStatuses.has(s.key);
                    return (
                        <div
                            key={s.key}
                            onClick={(e) => { e.stopPropagation(); if (isActive) toggleStatus(s.key); }}
                            className="text-center p-2.5 rounded-xl transition-all duration-200"
                            style={{
                                backgroundColor: isSelected ? s.bg : T.cool,
                                border: isSelected ? `2px solid ${s.color}` : "2px solid transparent",
                                cursor: isActive ? "pointer" : "default",
                                opacity: isActive ? 1 : 0.5,
                                transform: isSelected ? "scale(1.05)" : "scale(1)",
                            }}
                        >
                            <p className="text-xl font-bold" style={{ color: s.color }}>{count}</p>
                            <p className="text-[10px] font-semibold mt-0.5" style={{ color: s.color, opacity: 0.75 }}>{s.label}</p>
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold transition-all duration-300"
                style={{ color: isActive ? card.accent : T.textLight, opacity: isActive ? 1 : 0.6 }}>
                <span>{isActive ? "Click status boxes to filter" : "Click card to activate"}</span>
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
                <button
                    onClick={() => setShowLogModal(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 hover:-translate-y-0.5"
                    style={{ backgroundColor: T.foundBg, color: T.found, border: `2px solid ${T.found}` }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(16,185,129,0.15)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.foundBg; }}>
                    LOG FOUND
                </button>
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

            {/* ── Table ──────────────────────────────────────────────────────── */}
            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: T.white, borderColor: T.border, boxShadow: "0 1px 3px rgba(29,53,87,0.04)" }}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead style={{ backgroundColor: T.cool, borderBottom: `1px solid ${T.border}` }}>
                            <tr>
                                {["Item", "Type", "Status", "Reported By", "Reported", "SAO Status", "Details"].map((h) => (
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
                                            {item.createdAt ? (() => {
                                                const diff = Date.now() - new Date(item.createdAt);
                                                const mins = Math.floor(diff / 60000);
                                                const hrs = Math.floor(mins / 60);
                                                const days = Math.floor(hrs / 24);
                                                if (mins < 60) return `${mins}m ago`;
                                                if (hrs < 24) return `${hrs}h ago`;
                                                return `${days}d ago`;
                                            })() : "N/A"}
                                        </td>

                                        {/* SAO Status */}
                                        <td className="px-6 py-4">
                                            {item.type === "lost" ? (
                                                item.status === "resolved" ? (
                                                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold border"
                                                        style={{ backgroundColor: "rgba(16,185,129,0.08)", color: "#059669", borderColor: "rgba(16,185,129,0.15)" }}>
                                                        Returned
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold border"
                                                        style={{ backgroundColor: "#FEF3C7", color: "#D97706", borderColor: "#FDE68A" }}>
                                                        Pending
                                                    </span>
                                                )
                                            ) : item.status === "resolved" ? (
                                                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold border"
                                                    style={{ backgroundColor: "rgba(91,33,182,0.08)", color: "#5B21B6", borderColor: "rgba(91,33,182,0.15)" }}>
                                                    Picked Up
                                                </span>
                                            ) : (
                                                <span
                                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold border"
                                                    style={item.isAtSAO
                                                        ? { backgroundColor: T.foundBg, color: T.found, borderColor: T.foundBorder }
                                                        : { backgroundColor: T.cool, color: T.textLight, borderColor: T.border }}>
                                                    {item.isAtSAO ? "At SAO" : "Not at SAO"}
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => { setSelectedItem(item); setShowModal(true); setModalImageIdx(0); }}
                                                    className="p-2 rounded-lg transition-all duration-200"
                                                    style={{ color: T.steel }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(70,143,175,0.08)"}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                    <Eye className="w-4 h-4" />
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
                        <Package className="w-10 h-10 mx-auto opacity-20" style={{ color: T.navy }} />
                        <p className="text-sm font-medium" style={{ color: T.navy }}>
                            {!typeFilter
                                ? "Select a category above to view items"
                                : "No records match your filters"}
                        </p>
                    </div>
                )}
            </div>

            {/* ═══ DETAIL MODAL ════════════════════════════════════════════════ */}
            {showModal && selectedItem && (
                <div className="fixed inset-0 flex items-center justify-center z-[999] p-4" style={{ backgroundColor: "rgba(29,53,87,0.45)", backdropFilter: "blur(6px)" }}>
                    <div className="rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto bg-white"
                        style={{ boxShadow: "0 32px 64px -12px rgba(29,53,87,0.3), 0 4px 16px rgba(29,53,87,0.1)" }}>

                        {/* ── Hero Image Carousel ── */}
                        <div className="relative">
                            <div className="w-full h-52 rounded-t-3xl overflow-hidden" style={{ backgroundColor: T.cool }}>
                                {selectedItem.images?.length > 0
                                    ? <img src={selectedItem.images[modalImageIdx]} alt={selectedItem.title} className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                        <Package className="w-12 h-12 opacity-20" style={{ color: T.navy }} />
                                        <p className="text-xs font-medium opacity-40" style={{ color: T.navy }}>No image</p>
                                    </div>
                                }
                                <div className="absolute inset-0 rounded-t-3xl" style={{ background: "linear-gradient(to bottom, rgba(29,53,87,0.45) 0%, transparent 35%, transparent 50%, rgba(29,53,87,0.55) 100%)" }} />
                            </div>

                            {/* Prev / Next arrows */}
                            {selectedItem.images?.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setModalImageIdx(i => (i - 1 + selectedItem.images.length) % selectedItem.images.length)}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <button
                                        onClick={() => setModalImageIdx(i => (i + 1) % selectedItem.images.length)}
                                        className="absolute right-12 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-semibold">
                                        {modalImageIdx + 1} / {selectedItem.images.length}
                                    </div>
                                </>
                            )}

                            {/* Close button */}
                            <button onClick={closeModal}
                                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/35 transition-all">
                                <X className="w-4 h-4" />
                            </button>

                            {/* Type + status badges */}
                            <div className="absolute top-3 left-3 flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize backdrop-blur-sm"
                                    style={{
                                        backgroundColor: selectedItem.type === "lost" ? "rgba(220,38,38,0.85)" : "rgba(5,150,105,0.85)",
                                        color: "#fff",
                                    }}>
                                    {selectedItem.type}
                                </span>
                                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold backdrop-blur-sm"
                                    style={{
                                        backgroundColor: getStatusStyle(selectedItem.status).bg,
                                        color: getStatusStyle(selectedItem.status).text,
                                        border: `1px solid ${getStatusStyle(selectedItem.status).border}`,
                                    }}>
                                    {selectedItem.status?.charAt(0).toUpperCase() + selectedItem.status?.slice(1)}
                                </span>
                            </div>

                            {/* Title over image */}
                            <div className="absolute bottom-0 left-0 right-0 px-6 pb-4">
                                <h2 className="text-xl font-bold text-white leading-tight drop-shadow">{selectedItem.title}</h2>
                                <p className="text-xs text-white/70 font-medium mt-0.5">{selectedItem.category || "Uncategorized"}</p>
                            </div>
                        </div>

                        {/* ── Body ── */}
                        <div className="px-6 pt-5 pb-2 space-y-4">

                            {/* SAO Toggle (found items only, active only) */}
                            {selectedItem.type === "found" && selectedItem.status === "resolved" && (
                                <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border"
                                    style={{ backgroundColor: "rgba(91,33,182,0.06)", borderColor: "rgba(91,33,182,0.15)" }}>
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: "rgba(91,33,182,0.1)" }}>
                                        <MapPin className="w-4 h-4" style={{ color: "#5B21B6" }} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: T.navy }}>SAO Presence</p>
                                        <p className="text-[11px]" style={{ color: "#5B21B6" }}>Item has been picked up by the owner</p>
                                    </div>
                                    <span className="ml-auto px-3 py-1.5 rounded-xl text-xs font-bold border flex-shrink-0"
                                        style={{ backgroundColor: "rgba(91,33,182,0.08)", color: "#5B21B6", borderColor: "rgba(91,33,182,0.2)" }}>
                                        Picked Up
                                    </span>
                                </div>
                            )}
                            {selectedItem.type === "found" && selectedItem.status !== "resolved" && (
                                <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl border"
                                    style={{
                                        backgroundColor: selectedItem.isAtSAO ? T.foundBg : T.cool,
                                        borderColor: selectedItem.isAtSAO ? T.foundBorder : T.border,
                                    }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: selectedItem.isAtSAO ? "rgba(5,150,105,0.15)" : "rgba(29,53,87,0.06)" }}>
                                            <MapPin className="w-4 h-4" style={{ color: selectedItem.isAtSAO ? T.found : T.textLight }} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold" style={{ color: T.navy }}>SAO Presence</p>
                                            <p className="text-[11px]" style={{ color: selectedItem.isAtSAO ? T.found : T.textLight }}>
                                                {selectedItem.isAtSAO ? "Item is currently at the SAO office" : "Not yet brought to SAO"}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleSAOToggle(selectedItem)}
                                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 hover:-translate-y-0.5 flex-shrink-0"
                                        style={selectedItem.isAtSAO
                                            ? { backgroundColor: T.found, color: "#fff", borderColor: T.found, boxShadow: "0 4px 10px rgba(5,150,105,0.25)" }
                                            : { backgroundColor: T.white, color: T.navy, borderColor: T.border }}>
                                        {selectedItem.isAtSAO ? "✓ At SAO" : "Mark At SAO"}
                                    </button>
                                </div>
                            )}

                            {/* Info grid */}
                            <div className="grid grid-cols-2 gap-2.5">
                                {[
                                    { icon: Tag, label: "Category", value: selectedItem.category || "N/A" },
                                    { icon: MapPin, label: "Location", value: selectedItem.location || "N/A" },
                                    {
                                        icon: Calendar, label: "Date Reported", value: selectedItem.createdAt ? (() => {
                                            const diff = Date.now() - new Date(selectedItem.createdAt);
                                            const mins = Math.floor(diff / 60000);
                                            const hrs = Math.floor(mins / 60);
                                            const days = Math.floor(hrs / 24);
                                            if (mins < 60) return `${mins}m ago`;
                                            if (hrs < 24) return `${hrs}h ago`;
                                            return `${days}d ago`;
                                        })() : "N/A"
                                    },
                                    { icon: User, label: "Reported By", value: selectedItem.reportedBy?.name || "Unknown" },
                                ].map((d) => (
                                    <div key={d.label} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl"
                                        style={{ backgroundColor: T.cool, border: `1px solid ${T.border}` }}>
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: "rgba(70,143,175,0.1)" }}>
                                            <d.icon className="w-3.5 h-3.5" style={{ color: T.steel }} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: T.textLight }}>{d.label}</p>
                                            <p className="text-sm font-bold truncate mt-0.5" style={{ color: T.navy }}>{d.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Owner notified info */}
                            {selectedItem.type === "lost" && selectedItem.ownerNotified && (
                                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                                    style={{ backgroundColor: "rgba(70,143,175,0.06)", border: "1px solid rgba(70,143,175,0.2)" }}>
                                    <Bell className="w-4 h-4 flex-shrink-0" style={{ color: T.steel }} />
                                    <div>
                                        <p className="text-xs font-bold" style={{ color: T.navy }}>Owner Notified</p>
                                        <p className="text-[11px]" style={{ color: T.steel }}>
                                            {(() => {
                                                const diff = Date.now() - new Date(selectedItem.ownerNotifiedAt);
                                                const mins = Math.floor(diff / 60000);
                                                const hrs = Math.floor(mins / 60);
                                                const days = Math.floor(hrs / 24);
                                                if (mins < 60) return `${mins}m ago`;
                                                if (hrs < 24) return `${hrs}h ago`;
                                                return `${days}d ago`;
                                            })()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            {selectedItem.description && (
                                <div className="px-4 py-3.5 rounded-2xl" style={{ backgroundColor: T.cool, border: `1px solid ${T.border}` }}>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: T.textLight }}>Description</p>
                                    <p className="text-sm leading-relaxed" style={{ color: T.navy }}>{selectedItem.description}</p>
                                </div>
                            )}

                            {/* Contact */}
                            <div className="px-4 py-3.5 rounded-2xl" style={{ backgroundColor: T.cool, border: `1px solid ${T.border}` }}>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: T.textLight }}>Reporter Contact</p>
                                <div className="flex items-center gap-3">
                                    {selectedItem.reportedBy?.avatar
                                        ? <img src={selectedItem.reportedBy.avatar} alt={selectedItem.reportedBy.name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                                        : <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                                            style={{ backgroundColor: T.steel }}>
                                            {selectedItem.reportedBy?.name?.charAt(0)?.toUpperCase() || "?"}
                                        </div>
                                    }
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold truncate" style={{ color: T.navy }}>{selectedItem.reportedBy?.name || "N/A"}</p>
                                        <p className="text-xs truncate" style={{ color: T.textLight }}>{selectedItem.reportedBy?.email || "No email"}</p>
                                        {selectedItem.reportedBy?.phone && (
                                            <p className="text-xs" style={{ color: T.textLight }}>{selectedItem.reportedBy.phone}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Footer ── */}
                        <div className="flex flex-col gap-2 px-6 py-4 mt-2"
                            style={{ borderTop: `1px solid ${T.border}` }}>

                            {/* Row 1 — primary actions */}
                            <div className="flex items-center gap-2">
                                {selectedItem.type === "lost" && selectedItem.status === "active" && (
                                    <button
                                        onClick={handleNotifyOwner}
                                        disabled={notifyLoading}
                                        className="flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50"
                                        style={selectedItem.ownerNotified
                                            ? { backgroundColor: "transparent", color: T.steel, border: `1.5px solid ${T.steel}` }
                                            : { backgroundColor: T.steel, color: "#fff", boxShadow: "0 4px 12px rgba(70,143,175,0.25)" }}
                                        onMouseEnter={(e) => { if (!notifyLoading) e.currentTarget.style.opacity = "0.8"; }}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
                                        <Bell className="w-4 h-4" />
                                        {notifyLoading ? "Notifying..." : selectedItem.ownerNotified ? "Re-notify" : "Notify Owner"}
                                    </button>
                                )}
                                {selectedItem.type === "lost" && selectedItem.ownerNotified && selectedItem.status === "active" && (
                                    <button
                                        onClick={async () => {
                                            const result = await Swal.fire({
                                                icon: "question",
                                                title: "Mark as Resolved?",
                                                text: "Confirm the owner has physically collected the item at the SAO.",
                                                showCancelButton: true,
                                                confirmButtonText: "Yes, resolved",
                                                cancelButtonText: "Cancel",
                                                confirmButtonColor: T.found,
                                                cancelButtonColor: T.navy,
                                                customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold", cancelButton: "rounded-xl font-bold" }
                                            });
                                            if (!result.isConfirmed) return;
                                            try {
                                                await api.resolveItemStaff(selectedItem._id);
                                                setItems(prev => prev.map(i => i._id === selectedItem._id ? { ...i, status: "resolved" } : i));
                                                closeModal();
                                                Swal.fire({ icon: "success", title: "Resolved!", text: "Item has been marked as resolved.", confirmButtonColor: T.navy, customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
                                            } catch (err) {
                                                Swal.fire({ icon: "error", title: "Failed", text: err.message || "Could not resolve item.", confirmButtonColor: T.navy, customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
                                            }
                                        }}
                                        className="flex-1 py-2 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5"
                                        style={{ backgroundColor: T.found, boxShadow: "0 4px 12px rgba(5,150,105,0.25)" }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#047857"}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = T.found}>
                                        <CheckCircle className="w-4 h-4" />
                                        Mark Resolved
                                    </button>
                                )}
                                {selectedItem.type === "found" && selectedItem.status === "active" && (
                                    <button
                                        onClick={async () => {
                                            const result = await Swal.fire({
                                                icon: "question",
                                                title: "Mark Found Post as Resolved?",
                                                text: "This will close out the found post. Do this after the matched lost item has been resolved.",
                                                showCancelButton: true,
                                                confirmButtonText: "Yes, resolved",
                                                cancelButtonText: "Cancel",
                                                confirmButtonColor: T.found,
                                                cancelButtonColor: T.navy,
                                                customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold", cancelButton: "rounded-xl font-bold" }
                                            });
                                            if (!result.isConfirmed) return;
                                            try {
                                                await api.resolveItemStaff(selectedItem._id);
                                                setItems(prev => prev.map(i => i._id === selectedItem._id ? { ...i, status: "resolved" } : i));
                                                closeModal();
                                                Swal.fire({ icon: "success", title: "Resolved!", text: "Found post has been closed out.", confirmButtonColor: T.navy, customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
                                            } catch (err) {
                                                Swal.fire({ icon: "error", title: "Failed", text: err.message || "Could not resolve item.", confirmButtonColor: T.navy, customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
                                            }
                                        }}
                                        className="flex-1 py-2 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5"
                                        style={{ backgroundColor: T.found, boxShadow: "0 4px 12px rgba(5,150,105,0.25)" }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#047857"}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = T.found}>
                                        <CheckCircle className="w-4 h-4" />
                                        Mark Resolved
                                    </button>
                                )}
                            </div>

                            {/* Row 2 — destructive */}
                            <div className="flex items-center gap-2">
                                {selectedItem.type === "lost" && selectedItem.ownerNotified && selectedItem.status === "active" && (
                                    <button
                                        onClick={async () => {
                                            const result = await Swal.fire({
                                                icon: "warning",
                                                title: "Mark as Not a Match?",
                                                text: "This will dismiss the owner notification and return the item to normal active state so staff can continue searching. The owner will be notified.",
                                                showCancelButton: true,
                                                confirmButtonText: "Yes, not a match",
                                                cancelButtonText: "Cancel",
                                                confirmButtonColor: "#DC2626",
                                                cancelButtonColor: T.navy,
                                                customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold", cancelButton: "rounded-xl font-bold" }
                                            });
                                            if (!result.isConfirmed) return;
                                            try {
                                                await api.revertOwnerNotify(selectedItem._id);
                                                setItems(prev => prev.map(i => i._id === selectedItem._id ? { ...i, ownerNotified: false, ownerNotifiedAt: null } : i));
                                                setSelectedItem(prev => ({ ...prev, ownerNotified: false, ownerNotifiedAt: null }));
                                                Swal.fire({ icon: "success", title: "Reverted", text: "Item is back to active state and the owner has been notified.", confirmButtonColor: T.navy, customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
                                            } catch (err) {
                                                Swal.fire({ icon: "error", title: "Failed", text: err.message || "Could not revert.", confirmButtonColor: T.navy, customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
                                            }
                                        }}
                                        className="flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 border"
                                        style={{ backgroundColor: "rgba(220,38,38,0.06)", color: "#DC2626", borderColor: "rgba(220,38,38,0.2)" }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(220,38,38,0.12)"}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(220,38,38,0.06)"}>
                                        <X className="w-4 h-4" />
                                        Not a Match
                                    </button>
                                )}
                                <button
                                    onClick={() => { handleDelete(selectedItem._id); closeModal(); }}
                                    className="flex-1 py-2 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5"
                                    style={{ backgroundColor: "#DC2626", boxShadow: "0 4px 12px rgba(220,38,38,0.25)" }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#B91C1C"}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#DC2626"}>
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* ═══ LOG FOUND ITEM MODAL ════════════════════════════════════════ */}
            {showLogModal && (
                <div className="fixed inset-0 flex items-center justify-center z-[999] p-4" style={{ backgroundColor: "rgba(29,53,87,0.4)", backdropFilter: "blur(4px)" }}>
                    <div className="rounded-3xl max-w-2xl w-full bg-white" style={{ boxShadow: "0 25px 50px -12px rgba(29,53,87,0.25)" }}>

                        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: T.border }}>
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl" style={{ backgroundColor: T.foundBg }}>
                                    <Layers className="w-5 h-5" style={{ color: T.found }} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold" style={{ color: T.navy }}>Log Found Item</h2>
                                    <p className="text-xs mt-0.5" style={{ color: T.textLight }}>Records as Found · Auto-marked At SAO</p>
                                </div>
                            </div>
                            <button onClick={() => setShowLogModal(false)}
                                className="p-2 rounded-full transition-colors"
                                style={{ color: T.textLight }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = T.cool}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 space-y-5">
                            {/* Title */}
                            <div>
                                <label className="block text-xs font-bold mb-1.5" style={{ color: T.navy }}>
                                    Item Title <span style={{ color: T.lost }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Black wallet, Blue ID card"
                                    value={logForm.title}
                                    onChange={(e) => setLogForm(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                                    style={{ border: `1px solid ${T.border}`, color: T.navy, backgroundColor: T.cool }}
                                    onFocus={(e) => e.target.style.borderColor = T.steel}
                                    onBlur={(e) => e.target.style.borderColor = T.border}
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-xs font-bold mb-1.5" style={{ color: T.navy }}>
                                    Category <span style={{ color: T.lost }}>*</span>
                                </label>
                                <select
                                    value={logForm.category}
                                    onChange={(e) => setLogForm(prev => ({ ...prev, category: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                                    style={{ border: `1px solid ${T.border}`, color: logForm.category ? T.navy : T.textLight, backgroundColor: T.cool }}
                                    onFocus={(e) => e.target.style.borderColor = T.steel}
                                    onBlur={(e) => e.target.style.borderColor = T.border}
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((cat) => (
                                        <option key={cat._id || cat.value} value={cat.value}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold mb-1.5" style={{ color: T.navy }}>Description</label>
                                <textarea
                                    rows={4}
                                    placeholder="Color, brand, size, distinguishing features..."
                                    value={logForm.description}
                                    onChange={(e) => setLogForm(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none resize-none"
                                    style={{ border: `1px solid ${T.border}`, color: T.navy, backgroundColor: T.cool }}
                                    onFocus={(e) => e.target.style.borderColor = T.steel}
                                    onBlur={(e) => e.target.style.borderColor = T.border}
                                />
                            </div>

                            {/* Location + Date */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold mb-1.5" style={{ color: T.navy }}>Where was it found?</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Library, Canteen"
                                        value={logForm.location}
                                        onChange={(e) => setLogForm(prev => ({ ...prev, location: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                                        style={{ border: `1px solid ${T.border}`, color: T.navy, backgroundColor: T.cool }}
                                        onFocus={(e) => e.target.style.borderColor = T.steel}
                                        onBlur={(e) => e.target.style.borderColor = T.border}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1.5" style={{ color: T.navy }}>Date Found</label>
                                    <input
                                        type="date"
                                        value={logForm.dateFound}
                                        max={new Date().toISOString().split("T")[0]}
                                        onChange={(e) => setLogForm(prev => ({ ...prev, dateFound: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                                        style={{ border: `1px solid ${T.border}`, color: T.navy, backgroundColor: T.cool }}
                                        onFocus={(e) => e.target.style.borderColor = T.steel}
                                        onBlur={(e) => e.target.style.borderColor = T.border}
                                    />
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-xs font-bold mb-1.5" style={{ color: T.navy }}>
                                    Photos <span className="font-normal" style={{ color: T.textLight }}>(optional)</span>
                                </label>
                                {logForm.images?.length > 0 && (
                                    <div className="flex gap-2 mb-3 flex-wrap">
                                        {logForm.images.map((img, idx) => (
                                            <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden group"
                                                style={{ border: `1px solid ${T.border}` }}>
                                                <img src={img} alt={`upload-${idx}`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setLogForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                                                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold"
                                                    style={{ backgroundColor: "rgba(29,53,87,0.75)" }}>
                                                    x
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <label className="flex flex-col items-center justify-center rounded-xl p-8 cursor-pointer transition-all duration-200"
                                    style={{ border: `2px dashed ${T.border}`, backgroundColor: T.cool }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = T.steel}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = T.border}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => {
                                            Array.from(e.target.files).forEach(file => {
                                                const reader = new FileReader();
                                                reader.onloadend = () => setLogForm(prev => ({
                                                    ...prev,
                                                    images: [...(prev.images || []), reader.result]
                                                }));
                                                reader.readAsDataURL(file);
                                            });
                                        }}
                                    />
                                    <p className="text-xs font-semibold" style={{ color: T.textLight }}>Click to upload photos</p>
                                    <p className="text-[11px] mt-0.5" style={{ color: T.textLight, opacity: 0.6 }}>PNG, JPG up to 5MB each</p>
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 p-6" style={{ backgroundColor: T.cool, borderTop: `1px solid ${T.border}` }}>
                            <button onClick={() => setShowLogModal(false)}
                                className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                                style={{ color: T.textLight }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.white; e.currentTarget.style.color = T.navy; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = T.textLight; }}>
                                Cancel
                            </button>
                            <button
                                onClick={handleLogFound}
                                disabled={logLoading}
                                className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50"
                                style={{ backgroundColor: T.found }}
                                onMouseEnter={(e) => { if (!logLoading) e.currentTarget.style.backgroundColor = "#047857"; }}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = T.found}>
                                {logLoading ? "Logging..." : "Log Item"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}

export default StaffItems;
