import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { api } from "../../services/api";
import {
    CheckCircle, XCircle, Clock, Eye, Star, User,
    Package, MessageSquare, AlertCircle, MapPin, Search,
    ArrowRight, Inbox
} from "lucide-react";

// ── Theme: Steel Blue / Navy Slate / Cool Gray ────────────────────────────────
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

function AdminClaims() {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState(null);
    const [activeStatuses, setActiveStatuses] = useState(new Set(["pending"]));
    const [selectedClaim, setSelectedClaim] = useState(null);

    const [reviewNotes, setReviewNotes] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");
    const [adminNotes, setAdminNotes] = useState("");
    const [finderRejectionReason, setFinderRejectionReason] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => { fetchClaims(); }, []);

    const fetchClaims = async () => {
        setLoading(true);
        try {
            const data = await api.getAllClaimsAdmin("");
            setClaims(data);
        } catch (err) {
            console.error("Failed to fetch claims:", err);
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedClaim(null);
        setReviewNotes("");
        setRejectionReason("");
        setAdminNotes("");
        setFinderRejectionReason("");
    };

    // ── Regular Claim Actions ──────────────────────────────────────────────────
    const handleApprove = async () => {
        if (!selectedClaim) return;
        setProcessing(true);
        try {
            await api.approveClaim(selectedClaim._id, reviewNotes);
            await Swal.fire({ icon: "success", title: "Claim Approved!", text: "The claimant has been notified.", confirmButtonColor: "#047857", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
            closeModal();
            fetchClaims();
        } catch (err) {
            Swal.fire({ icon: "error", title: "Failed", text: "Failed to approve claim: " + err.message, confirmButtonColor: "#1D3557", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedClaim) return;
        if (!rejectionReason.trim()) { Swal.fire({ icon: "warning", title: "Required", text: "Please provide a rejection reason.", confirmButtonColor: "#1D3557", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } }); return; }
        setProcessing(true);
        try {
            await api.rejectClaim(selectedClaim._id, rejectionReason);
            await Swal.fire({ icon: "info", title: "Claim Rejected", text: "The claimant has been notified.", confirmButtonColor: "#1D3557", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
            closeModal();
            fetchClaims();
        } catch (err) {
            Swal.fire({ icon: "error", title: "Failed", text: "Failed to reject claim: " + err.message, confirmButtonColor: "#1D3557", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
        } finally {
            setProcessing(false);
        }
    };

    const handleMarkPickedUp = async () => {
        if (!selectedClaim) return;
        const r1 = await Swal.fire({ icon: "question", title: "Confirm Collection", text: "Confirm the claimant has physically collected the item from SAO?", showCancelButton: true, confirmButtonText: "Yes, confirm", cancelButtonText: "Cancel", confirmButtonColor: "#5B21B6", cancelButtonColor: "#1D3557", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold", cancelButton: "rounded-xl font-bold" } });
        if (!r1.isConfirmed) return;
        setProcessing(true);
        try {
            await api.markPickedUp(selectedClaim._id);
            await Swal.fire({ icon: "success", title: "Case Resolved!", text: "Item marked as collected.", confirmButtonColor: "#5B21B6", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
            closeModal();
            fetchClaims();
        } catch (err) {
            Swal.fire({ icon: "error", title: "Failed", text: err.message, confirmButtonColor: "#1D3557", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
        } finally {
            setProcessing(false);
        }
    };

    // ── Finder Report Actions ──────────────────────────────────────────────────
    const handleConfirmFinderReceived = async () => {
        if (!selectedClaim) return;
        const r2 = await Swal.fire({ icon: "question", title: "Confirm Item at SAO", text: "Confirm the finder has physically brought the item to SAO? The owner will be notified immediately.", showCancelButton: true, confirmButtonText: "Yes, confirm", cancelButtonText: "Cancel", confirmButtonColor: "#468FAF", cancelButtonColor: "#1D3557", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold", cancelButton: "rounded-xl font-bold" } });
        if (!r2.isConfirmed) return;
        setProcessing(true);
        try {
            await api.confirmFinderReceived(selectedClaim._id, adminNotes);
            await Swal.fire({ icon: "success", title: "Item Received at SAO!", text: "The owner has been notified to come collect it.", confirmButtonColor: "#468FAF", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
            closeModal();
            fetchClaims();
        } catch (err) {
            Swal.fire({ icon: "error", title: "Failed", text: err.message, confirmButtonColor: "#1D3557", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
        } finally {
            setProcessing(false);
        }
    };

    const handleDeclineFinderReport = async () => {
        if (!selectedClaim) return;
        if (!finderRejectionReason.trim()) { Swal.fire({ icon: "warning", title: "Required", text: "Please provide a reason for declining.", confirmButtonColor: "#1D3557", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } }); return; }
        setProcessing(true);
        try {
            await api.declineFinderReport(selectedClaim._id, finderRejectionReason);
            await Swal.fire({ icon: "info", title: "Report Declined", text: "The finder has been notified.", confirmButtonColor: "#1D3557", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
            closeModal();
            fetchClaims();
        } catch (err) {
            Swal.fire({ icon: "error", title: "Failed", text: err.message, confirmButtonColor: "#1D3557", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
        } finally {
            setProcessing(false);
        }
    };

    const handleOwnerCollected = async () => {
        if (!selectedClaim) return;
        const r3 = await Swal.fire({ icon: "question", title: "Confirm Owner Collected", text: "Confirm the owner has physically collected their item from SAO?", showCancelButton: true, confirmButtonText: "Yes, confirm", cancelButtonText: "Cancel", confirmButtonColor: "#5B21B6", cancelButtonColor: "#1D3557", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold", cancelButton: "rounded-xl font-bold" } });
        if (!r3.isConfirmed) return;
        setProcessing(true);
        try {
            await api.ownerCollected(selectedClaim._id);
            await Swal.fire({ icon: "success", title: "Case Resolved!", text: "Owner has collected the item.", confirmButtonColor: "#5B21B6", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
            closeModal();
            fetchClaims();
        } catch (err) {
            Swal.fire({ icon: "error", title: "Failed", text: err.message, confirmButtonColor: "#1D3557", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
        } finally {
            setProcessing(false);
        }
    };

    // ── Helpers ────────────────────────────────────────────────────────────────
    const getStatusColor = (status) => {
        switch (status) {
            case "pending": return { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" };
            case "approved": return { bg: "#D1FAE5", text: "#065F46", border: "#A7F3D0" };
            case "rejected": return { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" };
            case "picked_up": return { bg: "#EDE9FE", text: "#5B21B6", border: "#DDD6FE" };
            default: return { bg: "#F3F4F6", text: "#374151", border: "#E5E7EB" };
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "pending": return <Clock className="w-3.5 h-3.5" />;
            case "approved": return <CheckCircle className="w-3.5 h-3.5" />;
            case "rejected": return <XCircle className="w-3.5 h-3.5" />;
            case "picked_up": return <Star className="w-3.5 h-3.5" />;
            default: return <AlertCircle className="w-3.5 h-3.5" />;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case "picked_up": return "Resolved";
            case "approved": return "Awaiting Pickup";
            default: return status.charAt(0).toUpperCase() + status.slice(1);
        }
    };

    const isFinderReport = (claim) => claim.type === "finder_report";

    const regularClaims = claims.filter(c => c.type !== "finder_report");
    const finderReports = claims.filter(c => c.type === "finder_report");

    // Toggle status selection
    const toggleStatus = (status) => {
        const newStatuses = new Set(activeStatuses);
        if (newStatuses.has(status)) {
            newStatuses.delete(status);
        } else {
            newStatuses.add(status);
        }
        setActiveStatuses(newStatuses);
    };

    // Filtered claims based on type and active statuses
    const filteredClaims = typeFilter && activeStatuses.size > 0
        ? claims
            .filter(c => typeFilter === "finder_report" ? c.type === "finder_report" : c.type !== "finder_report")
            .filter(c => activeStatuses.has(c.status))
        : [];

    // Card data
    const claimsCard = {
        label: "Claims Requests",
        icon: <Package className="w-5 h-5" />,
        iconColor: T.navy,
        iconBg: "rgba(29,53,87,0.08)",
        total: regularClaims.length,
        accent: T.navy,
        gradient: "linear-gradient(135deg, rgba(29,53,87,0.04) 0%, rgba(29,53,87,0.01) 100%)",
    };

    const finderCard = {
        label: "Finder Reports",
        icon: <Search className="w-5 h-5" />,
        iconColor: T.steel,
        iconBg: "rgba(70,143,175,0.08)",
        total: finderReports.length,
        accent: T.steel,
        gradient: "linear-gradient(135deg, rgba(70,143,175,0.06) 0%, rgba(70,143,175,0.01) 100%)",
    };

    const statusConfig = [
        { key: "pending", label: "Pending", color: "#92400E", bg: "#FEF3C7", bgActive: "rgba(254,243,199,0.7)" },
        { key: "approved", label: "Approved", color: "#065F46", bg: "#D1FAE5", bgActive: "rgba(209,250,229,0.7)" },
        { key: "picked_up", label: "Resolved", color: "#5B21B6", bg: "#EDE9FE", bgActive: "rgba(237,233,254,0.7)" },
        { key: "rejected", label: "Rejected", color: "#991B1B", bg: "#FEE2E2", bgActive: "rgba(254,226,226,0.7)" },
    ];

    const StatusCard = ({ card, isActive, onClick }) => {
        const items = card.label === "Claims Requests" ? regularClaims : finderReports;

        return (
            <div
                onClick={onClick}
                className="relative rounded-2xl p-5 border cursor-pointer transition-all duration-300 group overflow-hidden"
                style={{
                    background: isActive ? card.gradient : T.white,
                    borderColor: isActive ? card.accent : T.border,
                    boxShadow: isActive
                        ? `0 8px 30px ${card.accent}20, 0 2px 8px rgba(29,53,87,0.06)`
                        : "0 1px 3px rgba(29,53,87,0.04)",
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
                {/* Active indicator line */}
                <div
                    className="absolute top-0 left-6 right-6 h-[3px] rounded-b-full transition-all duration-300"
                    style={{
                        backgroundColor: isActive ? card.accent : "transparent",
                        opacity: isActive ? 1 : 0,
                    }}
                />

                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="p-2.5 rounded-xl transition-all duration-300"
                            style={{
                                backgroundColor: isActive ? card.iconBg : "rgba(29,53,87,0.04)",
                            }}
                        >
                            {React.cloneElement(card.icon, { style: { color: card.iconColor } })}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold" style={{ color: T.navy }}>{card.label}</h3>
                            <p className="text-[11px] font-medium" style={{ color: T.textLight }}>
                                {card.total} total
                            </p>
                        </div>
                    </div>
                    {isActive && (
                        <div className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg"
                            style={{ backgroundColor: card.iconBg, color: card.accent }}>
                            Active <CheckCircle className="w-3 h-3" />
                        </div>
                    )}
                </div>

                {/* Status breakdown — clickable */}
                <div className="grid grid-cols-4 gap-2">
                    {statusConfig.map((status) => {
                        const count = items.filter(c => c.status === status.key).length;
                        const isSelected = isActive && activeStatuses.has(status.key);

                        return (
                            <div
                                key={status.key}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isActive) {
                                        toggleStatus(status.key);
                                    }
                                }}
                                className="text-center p-2 rounded-xl transition-all duration-200 cursor-pointer select-none"
                                style={{
                                    backgroundColor: isSelected ? status.bgActive : (isActive ? status.bg + "40" : T.cool),
                                    border: isSelected ? `2px solid ${status.color}` : "2px solid transparent",
                                    transform: isSelected ? "scale(1.05)" : "scale(1)",
                                    boxShadow: isSelected ? `0 2px 8px ${status.color}20` : "none",
                                    opacity: isActive ? 1 : 0.6,
                                    cursor: isActive ? "pointer" : "default",
                                }}
                                onMouseEnter={(e) => {
                                    if (isActive) {
                                        e.currentTarget.style.backgroundColor = status.bgActive;
                                        e.currentTarget.style.transform = "scale(1.05)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (isActive) {
                                        if (!isSelected) {
                                            e.currentTarget.style.backgroundColor = status.bg + "40";
                                            e.currentTarget.style.transform = "scale(1)";
                                        }
                                    }
                                }}
                            >
                                <p className="text-lg font-bold" style={{ color: status.color }}>{count}</p>
                                <p className="text-[10px] font-semibold mt-0.5" style={{ color: status.color, opacity: 0.8 }}>
                                    {card.label === "Finder Reports" && status.key === "approved" ? "At SAO" : status.label}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Bottom hint */}
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold transition-all duration-300"
                    style={{ color: isActive ? card.accent : T.textLight, opacity: isActive ? 1 : 0.6 }}>
                    <span>{isActive ? "Click status boxes to toggle" : "Click card to activate"}</span>
                    <ArrowRight className={`w-3 h-3 transition-transform duration-300 ${isActive ? "translate-x-0.5" : "group-hover:translate-x-0.5"}`} />
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="h-8 w-64 rounded animate-pulse" style={{ backgroundColor: "rgba(29,53,87,0.08)" }} />
            <div className="grid grid-cols-2 gap-4">
                {[1, 2].map(i => (
                    <div key={i} className="h-40 rounded-2xl border animate-pulse" style={{ backgroundColor: T.white, borderColor: T.border }} />
                ))}
            </div>
            <div className="h-96 rounded-2xl border animate-pulse" style={{ backgroundColor: T.white, borderColor: T.border }} />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8">

            {/* ── Header ───────────────────────────────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-6" style={{ borderBottom: `1px solid ${T.border}` }}>
                <div className="space-y-1">
                    <h1 className="text-3xl lg:text-4xl font-bold tracking-tight" style={{ color: T.navy }}>
                        Claim Requests
                    </h1>
                    <p className="text-sm" style={{ color: T.textLight }}>
                        Review and manage item claims and finder reports
                    </p>
                </div>
            </div>

            {/* ── Interactive Status Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatusCard
                    card={claimsCard}
                    isActive={typeFilter === "claim"}
                    onClick={() => {
                        if (typeFilter === "claim") {
                            setTypeFilter(null);
                            setActiveStatuses(new Set());
                        } else {
                            setTypeFilter("claim");
                            setActiveStatuses(new Set());
                        }
                    }}
                />
                <StatusCard
                    card={finderCard}
                    isActive={typeFilter === "finder_report"}
                    onClick={() => {
                        if (typeFilter === "finder_report") {
                            setTypeFilter(null);
                            setActiveStatuses(new Set());
                        } else {
                            setTypeFilter("finder_report");
                            setActiveStatuses(new Set());
                        }
                    }}
                />
            </div>

            {/* ── Active Filters Bar ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                    {typeFilter ? (
                        <>
                            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: T.textLight }}>
                                Showing:
                            </span>
                            <span className="text-sm font-bold" style={{ color: T.navy }}>
                                {typeFilter === "claim" ? "Claims" : "Finder Reports"}
                            </span>
                            {activeStatuses.size > 0 ? (
                                <>
                                    <span className="text-[11px]" style={{ color: T.textLight }}>with status</span>
                                    {Array.from(activeStatuses).map(status => (
                                        <span key={status}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                                            style={{
                                                backgroundColor: getStatusColor(status).bg,
                                                color: getStatusColor(status).text,
                                                border: `1px solid ${getStatusColor(status).border}`,
                                            }}>
                                            {getStatusIcon(status)}
                                            {getStatusLabel(status)}
                                        </span>
                                    ))}
                                </>
                            ) : (
                                <span className="text-[11px] font-medium" style={{ color: T.textLight }}>— select status below</span>
                            )}
                        </>
                    ) : (
                        <span className="text-sm font-medium" style={{ color: T.textLight }}>
                            Select a card above to view records
                        </span>
                    )}
                </div>
                {typeFilter && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                        style={{ backgroundColor: "rgba(29,53,87,0.06)", color: T.navy }}>
                        <Inbox className="w-3.5 h-3.5" />
                        {filteredClaims.length} {filteredClaims.length === 1 ? "record" : "records"}
                    </span>
                )}
            </div>

            {/* ── Table ── */}
            <div className="rounded-2xl border overflow-hidden bg-white" style={{ borderColor: T.border, boxShadow: "0 1px 3px rgba(29,53,87,0.04)" }}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead style={{ backgroundColor: T.cool, borderBottom: `1px solid ${T.border}` }}>
                            <tr>
                                {["Item", "Type", "Submitted By", "Date", "Status", "Action Needed", "View"].map((h) => (
                                    <th key={h} className="text-left px-6 py-4 text-xs font-bold tracking-wide uppercase" style={{ color: T.navy }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: T.border }}>
                            {filteredClaims.map((claim) => {
                                const sc = getStatusColor(claim.status);
                                return (
                                    <tr key={claim._id} className="transition-colors duration-150" style={{ borderColor: T.border }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = T.hover}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center text-lg flex-shrink-0"
                                                    style={{ backgroundColor: T.cool }}>
                                                    {claim.item?.images?.[0]
                                                        ? <img src={claim.item.images[0]} alt="" className="w-full h-full object-cover" />
                                                        : <Package className="w-5 h-5" style={{ color: T.textLight }} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold" style={{ color: T.navy }}>{claim.item?.title}</p>
                                                    <p className="text-[11px] font-medium capitalize" style={{ color: T.textLight }}>{claim.item?.type}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {isFinderReport(claim) ? (
                                                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold border"
                                                    style={{ backgroundColor: "rgba(70,143,175,0.08)", color: T.steel, borderColor: "rgba(70,143,175,0.15)" }}>
                                                    Finder Report
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold border"
                                                    style={{ backgroundColor: "rgba(29,53,87,0.06)", color: T.navy, borderColor: "rgba(29,53,87,0.1)" }}>
                                                    Claim
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold" style={{ color: T.navy }}>{claim.claimant?.name}</p>
                                            <p className="text-[11px]" style={{ color: T.textLight }}>{claim.claimant?.email}</p>
                                        </td>
                                        <td className="px-6 py-4 text-[13px]" style={{ color: T.textLight }}>
                                            {new Date(claim.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                                                style={{ backgroundColor: sc.bg, color: sc.text, borderColor: sc.border }}>
                                                {getStatusIcon(claim.status)}
                                                {getStatusLabel(claim.status)}
                                            </span>
                                        </td>
                                        {/* Action column */}
                                        <td className="px-6 py-4">
                                            {!isFinderReport(claim) && claim.status === "approved" && (
                                                <button
                                                    onClick={async () => {
                                                        const r4 = await Swal.fire({ icon: "question", title: "Confirm Collection", text: `Confirm "${claim.item?.title}" has been collected by the claimant?`, showCancelButton: true, confirmButtonText: "Yes, confirm", cancelButtonText: "Cancel", confirmButtonColor: "#5B21B6", cancelButtonColor: "#1D3557", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold", cancelButton: "rounded-xl font-bold" } });
                                                        if (!r4.isConfirmed) return;
                                                        try {
                                                            await api.markPickedUp(claim._id);
                                                            fetchClaims();
                                                        } catch (err) { Swal.fire({ icon: "error", title: "Failed", text: err.message, confirmButtonColor: "#1D3557", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } }); }
                                                    }}
                                                    className="text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all duration-200 hover:-translate-y-0.5"
                                                    style={{ backgroundColor: "rgba(91,33,182,0.06)", color: "#5B21B6", borderColor: "rgba(91,33,182,0.12)" }}>
                                                    Confirm Collected
                                                </button>
                                            )}
                                            {isFinderReport(claim) && claim.status === "pending" && (
                                                <button
                                                    onClick={() => setSelectedClaim(claim)}
                                                    className="text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all duration-200 hover:-translate-y-0.5"
                                                    style={{ backgroundColor: "rgba(70,143,175,0.08)", color: T.steel, borderColor: "rgba(70,143,175,0.15)" }}>
                                                    Review Report
                                                </button>
                                            )}
                                            {isFinderReport(claim) && claim.status === "approved" && (
                                                <button
                                                    onClick={async () => {
                                                        const r5 = await Swal.fire({ icon: "question", title: "Confirm Owner Collected", text: `Confirm the owner has collected "${claim.item?.title}" from SAO?`, showCancelButton: true, confirmButtonText: "Yes, confirm", cancelButtonText: "Cancel", confirmButtonColor: "#5B21B6", cancelButtonColor: "#1D3557", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold", cancelButton: "rounded-xl font-bold" } });
                                                        if (!r5.isConfirmed) return;
                                                        try {
                                                            await api.ownerCollected(claim._id);
                                                            fetchClaims();
                                                        } catch (err) { Swal.fire({ icon: "error", title: "Failed", text: err.message, confirmButtonColor: "#1D3557", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } }); }
                                                    }}
                                                    className="text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all duration-200 hover:-translate-y-0.5"
                                                    style={{ backgroundColor: "rgba(29,53,87,0.06)", color: T.navy, borderColor: "rgba(29,53,87,0.1)" }}>
                                                    Owner Collected
                                                </button>
                                            )}
                                            {!isFinderReport(claim) && claim.status === "pending" && (
                                                <button
                                                    onClick={() => setSelectedClaim(claim)}
                                                    className="text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all duration-200 hover:-translate-y-0.5"
                                                    style={{ backgroundColor: "rgba(29,53,87,0.06)", color: T.navy, borderColor: "rgba(29,53,87,0.1)" }}>
                                                    Review Claim
                                                </button>
                                            )}
                                            {(claim.status === "rejected" || claim.status === "picked_up") && (
                                                <span className="text-[11px]" style={{ color: T.textLight }}>—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setSelectedClaim(claim)}
                                                className="p-2 rounded-lg transition-all duration-200"
                                                style={{ color: T.steel }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(70,143,175,0.08)"}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredClaims.length === 0 && (
                    <div className="text-center py-12 space-y-2">
                        <AlertCircle className="w-8 h-8 mx-auto" style={{ color: "rgba(29,53,87,0.2)" }} />
                        <p className="text-sm" style={{ color: T.textLight }}>No records found matching your criteria</p>
                    </div>
                )}
            </div>

            {/* ═══ MODAL ═══════════════════════════════════════════════════════════ */}
            {selectedClaim && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(29,53,87,0.4)" }}>
                    <div className="rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white" style={{ boxShadow: "0 25px 50px -12px rgba(29,53,87,0.25)" }}>

                        {/* Modal Header */}
                        <div className="p-6 border-b flex items-center justify-between"
                            style={{
                                backgroundColor: isFinderReport(selectedClaim) ? "rgba(70,143,175,0.04)" : T.white,
                                borderColor: T.border
                            }}>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-xl font-bold" style={{ color: T.navy }}>
                                        {isFinderReport(selectedClaim) ? "Finder Report" : "Claim Details"}
                                    </h2>
                                    <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold"
                                        style={{
                                            backgroundColor: isFinderReport(selectedClaim) ? "rgba(70,143,175,0.1)" : "rgba(29,53,87,0.08)",
                                            color: isFinderReport(selectedClaim) ? T.steel : T.navy,
                                        }}>
                                        {isFinderReport(selectedClaim) ? "Finder Report" : "Regular Claim"}
                                    </span>
                                </div>
                                <p className="text-[13px]" style={{ color: T.textLight }}>
                                    Submitted on {new Date(selectedClaim.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <button onClick={closeModal}
                                className="p-2 rounded-full transition-colors duration-200"
                                style={{ color: T.textLight }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = T.cool}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Status Badge */}
                            <div className="flex items-center gap-3 p-4 rounded-2xl border"
                                style={{
                                    backgroundColor: getStatusColor(selectedClaim.status).bg,
                                    borderColor: getStatusColor(selectedClaim.status).border,
                                    color: getStatusColor(selectedClaim.status).text
                                }}>
                                {getStatusIcon(selectedClaim.status)}
                                <div>
                                    <p className="font-bold text-sm">Status: {getStatusLabel(selectedClaim.status)}</p>
                                    {selectedClaim.status === "picked_up" && selectedClaim.pickedUpAt && (
                                        <p className="text-xs mt-0.5 opacity-80">Resolved on {new Date(selectedClaim.pickedUpAt).toLocaleString()}</p>
                                    )}
                                </div>
                            </div>

                            {/* Item Info */}
                            <div className="p-4 rounded-2xl" style={{ backgroundColor: T.cool }}>
                                <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: T.navy }}>
                                    <Package className="w-4 h-4" style={{ color: T.steel }} /> Item Information
                                </h3>
                                <div className="flex items-center gap-3">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: "rgba(29,53,87,0.06)" }}>
                                        {selectedClaim.item?.images?.[0]
                                            ? <img src={selectedClaim.item.images[0]} alt="" className="w-full h-full object-cover" />
                                            : <Package className="w-6 h-6" style={{ color: T.textLight }} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm" style={{ color: T.navy }}>{selectedClaim.item?.title}</p>
                                        <p className="text-[13px]" style={{ color: T.textLight }}>{selectedClaim.item?.location}</p>
                                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-bold"
                                            style={{
                                                backgroundColor: selectedClaim.item?.type === "lost" ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
                                                color: selectedClaim.item?.type === "lost" ? "#B91C1C" : "#047857",
                                            }}>
                                            {selectedClaim.item?.type}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Person Info */}
                            <div className="p-4 rounded-2xl" style={{ backgroundColor: T.cool }}>
                                <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: T.navy }}>
                                    <User className="w-4 h-4" style={{ color: T.steel }} />
                                    {isFinderReport(selectedClaim) ? "Finder Information" : "Claimant Information"}
                                </h3>
                                <div className="space-y-1.5">
                                    <p className="text-[13px]"><span className="font-semibold" style={{ color: T.navy }}>Name:</span> <span style={{ color: T.textLight }}>{selectedClaim.claimant?.name}</span></p>
                                    <p className="text-[13px]"><span className="font-semibold" style={{ color: T.navy }}>Email:</span> <span style={{ color: T.textLight }}>{selectedClaim.contactEmail}</span></p>
                                    <p className="text-[13px]"><span className="font-semibold" style={{ color: T.navy }}>Phone:</span> <span style={{ color: T.textLight }}>{selectedClaim.contactPhone}</span></p>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="p-4 rounded-2xl" style={{ backgroundColor: T.cool }}>
                                <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: T.navy }}>
                                    <MessageSquare className="w-4 h-4" style={{ color: T.steel }} />
                                    {isFinderReport(selectedClaim) ? "Where / How Item Was Found" : "Proof of Ownership"}
                                </h3>
                                <p className="text-[13px] leading-relaxed" style={{ color: T.textLight }}>
                                    {selectedClaim.finderDescription || selectedClaim.proofDescription}
                                </p>
                            </div>

                            {/* Proof Images */}
                            {selectedClaim.proofImages?.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-sm mb-3" style={{ color: T.navy }}>
                                        {isFinderReport(selectedClaim) ? "Photos Submitted by Finder" : "Proof Images"}
                                    </h3>
                                    <div className="flex gap-3 flex-wrap">
                                        {selectedClaim.proofImages.map((img, idx) => (
                                            <img key={idx} src={img} alt={`Proof ${idx + 1}`}
                                                className="w-24 h-24 object-cover rounded-xl border cursor-pointer transition-transform duration-200 hover:scale-105"
                                                style={{ borderColor: T.border }}
                                                onClick={() => window.open(img, "_blank")} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ═══ ADMIN ACTIONS ════════════════════════════════════ */}

                            {/* REGULAR CLAIM — Pending */}
                            {!isFinderReport(selectedClaim) && selectedClaim.status === "pending" && (
                                <div className="space-y-4 pt-4 border-t" style={{ borderColor: T.border }}>
                                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: T.textLight }}>Admin Actions</p>
                                    <div>
                                        <label className="block text-xs font-bold mb-2" style={{ color: T.navy }}>
                                            Review Notes (Optional — shown to claimant)
                                        </label>
                                        <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)}
                                            placeholder="Add any notes about this approval..."
                                            className="w-full p-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all duration-200"
                                            style={{
                                                backgroundColor: T.cool,
                                                border: `1px solid ${T.border}`,
                                                minHeight: "80px",
                                                color: T.navy
                                            }}
                                            onFocus={(e) => e.currentTarget.style.borderColor = T.steel}
                                            onBlur={(e) => e.currentTarget.style.borderColor = T.border}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-2" style={{ color: T.navy }}>
                                            Rejection Reason (Required if rejecting)
                                        </label>
                                        <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Explain why the claim is being rejected..."
                                            className="w-full p-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all duration-200"
                                            style={{
                                                backgroundColor: T.cool,
                                                border: `1px solid ${T.border}`,
                                                minHeight: "80px",
                                                color: T.navy
                                            }}
                                            onFocus={(e) => e.currentTarget.style.borderColor = "#EF4444"}
                                            onBlur={(e) => e.currentTarget.style.borderColor = T.border}
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={handleApprove} disabled={processing}
                                            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                                            style={{ backgroundColor: "#047857", color: T.white }}>
                                            <CheckCircle className="w-4 h-4" />
                                            {processing ? "Processing..." : "Approve Claim"}
                                        </button>
                                        <button onClick={handleReject} disabled={processing}
                                            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                                            style={{ backgroundColor: "#B91C1C", color: T.white }}>
                                            <XCircle className="w-4 h-4" />
                                            {processing ? "Processing..." : "Reject Claim"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* REGULAR CLAIM — Approved (waiting for pickup) */}
                            {!isFinderReport(selectedClaim) && selectedClaim.status === "approved" && (
                                <div className="space-y-4 pt-4 border-t" style={{ borderColor: T.border }}>
                                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: T.textLight }}>Pickup Confirmation</p>
                                    <div className="p-4 rounded-2xl text-sm" style={{ backgroundColor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)", color: "#92400E" }}>
                                        <p className="font-bold mb-1">Confirm Before Clicking</p>
                                        <p>Only confirm after verifying the claimant's ID and physically handing over the item.</p>
                                    </div>
                                    <button onClick={handleMarkPickedUp} disabled={processing}
                                        className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                                        style={{ backgroundColor: "#5B21B6", color: T.white }}>
                                        <Star className="w-4 h-4" />
                                        {processing ? "Updating..." : "Confirm Item Collected by Claimant"}
                                    </button>
                                </div>
                            )}

                            {/* FINDER REPORT — Pending */}
                            {isFinderReport(selectedClaim) && selectedClaim.status === "pending" && (
                                <div className="space-y-4 pt-4 border-t" style={{ borderColor: T.border }}>
                                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: T.textLight }}>Finder Report Actions</p>

                                    <div className="p-4 rounded-2xl text-sm" style={{ backgroundColor: "rgba(70,143,175,0.06)", border: "1px solid rgba(70,143,175,0.12)", color: T.navy }}>
                                        <p className="font-bold mb-1">Waiting for Item Drop-off</p>
                                        <p>Only confirm receipt after the finder has <strong>physically brought the item to the SAO office</strong>. The owner will be notified immediately.</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold mb-2" style={{ color: T.navy }}>
                                            Admin Notes (Optional — internal only)
                                        </label>
                                        <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)}
                                            placeholder="Any notes about receiving this item at SAO..."
                                            className="w-full p-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all duration-200"
                                            style={{
                                                backgroundColor: T.cool,
                                                border: `1px solid ${T.border}`,
                                                minHeight: "70px",
                                                color: T.navy
                                            }}
                                            onFocus={(e) => e.currentTarget.style.borderColor = T.steel}
                                            onBlur={(e) => e.currentTarget.style.borderColor = T.border}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold mb-2" style={{ color: T.navy }}>
                                            Decline Reason (Required if declining)
                                        </label>
                                        <textarea value={finderRejectionReason} onChange={(e) => setFinderRejectionReason(e.target.value)}
                                            placeholder="Explain why this finder report is being declined..."
                                            className="w-full p-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all duration-200"
                                            style={{
                                                backgroundColor: T.cool,
                                                border: `1px solid ${T.border}`,
                                                minHeight: "70px",
                                                color: T.navy
                                            }}
                                            onFocus={(e) => e.currentTarget.style.borderColor = "#EF4444"}
                                            onBlur={(e) => e.currentTarget.style.borderColor = T.border}
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button onClick={handleConfirmFinderReceived} disabled={processing}
                                            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                                            style={{ backgroundColor: T.steel, color: T.white }}>
                                            <MapPin className="w-4 h-4" />
                                            {processing ? "Processing..." : "Confirm Item Received at SAO"}
                                        </button>
                                        <button onClick={handleDeclineFinderReport} disabled={processing}
                                            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                                            style={{ backgroundColor: "#B91C1C", color: T.white }}>
                                            <XCircle className="w-4 h-4" />
                                            {processing ? "Processing..." : "Decline Report"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* FINDER REPORT — Approved (item at SAO, waiting for owner) */}
                            {isFinderReport(selectedClaim) && selectedClaim.status === "approved" && (
                                <div className="space-y-4 pt-4 border-t" style={{ borderColor: T.border }}>
                                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: T.textLight }}>Owner Pickup Confirmation</p>
                                    <div className="p-4 rounded-2xl text-sm" style={{ backgroundColor: "rgba(29,53,87,0.04)", border: `1px solid ${T.border}`, color: T.navy }}>
                                        <p className="font-bold mb-1">Item is at SAO — Waiting for Owner</p>
                                        <p>The owner has been notified. Once they come to SAO and collect the item, confirm it below.</p>
                                    </div>
                                    <div className="p-4 rounded-2xl text-sm" style={{ backgroundColor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)", color: "#92400E" }}>
                                        <p className="font-bold mb-1">Confirm Before Clicking</p>
                                        <p>Only confirm after verifying the owner's ID and physically handing over the item.</p>
                                    </div>
                                    <button onClick={handleOwnerCollected} disabled={processing}
                                        className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                                        style={{ backgroundColor: "#5B21B6", color: T.white }}>
                                        <Star className="w-4 h-4" />
                                        {processing ? "Updating..." : "Confirm Owner Collected Item"}
                                    </button>
                                </div>
                            )}

                            {/* Review History */}
                            {selectedClaim.status !== "pending" && (
                                <div className="p-4 rounded-2xl" style={{ backgroundColor: T.cool }}>
                                    <h3 className="font-bold text-sm mb-3" style={{ color: T.navy }}>Review History</h3>
                                    <div className="space-y-1.5">
                                        {selectedClaim.reviewedBy && (
                                            <p className="text-[13px]" style={{ color: T.textLight }}>
                                                <span className="font-semibold" style={{ color: T.navy }}>Reviewed by:</span> {selectedClaim.reviewedBy?.name || "Admin"}
                                            </p>
                                        )}
                                        {selectedClaim.reviewedAt && (
                                            <p className="text-[13px]" style={{ color: T.textLight }}>
                                                <span className="font-semibold" style={{ color: T.navy }}>Review date:</span> {new Date(selectedClaim.reviewedAt).toLocaleString()}
                                            </p>
                                        )}
                                        {selectedClaim.reviewNotes && (
                                            <p className="text-[13px]" style={{ color: T.textLight }}>
                                                <span className="font-semibold" style={{ color: T.navy }}>Notes:</span> {selectedClaim.reviewNotes}
                                            </p>
                                        )}
                                        {selectedClaim.rejectionReason && (
                                            <p className="text-[13px]" style={{ color: "#B91C1C" }}>
                                                <span className="font-semibold">Decline reason:</span> {selectedClaim.rejectionReason}
                                            </p>
                                        )}
                                        {selectedClaim.pickedUpAt && (
                                            <p className="text-[13px]" style={{ color: "#5B21B6" }}>
                                                <span className="font-semibold">Resolved on:</span> {new Date(selectedClaim.pickedUpAt).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminClaims;