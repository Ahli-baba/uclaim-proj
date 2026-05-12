import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { api } from "../../services/api";
import {
    CheckCircle, XCircle, Star,
    Package, AlertCircle, MapPin, Search,
    ArrowRight, Inbox
} from "lucide-react";

const formatDate = (date) => {
    const diff = Date.now() - new Date(date);
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

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

function StaffClaims() {
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
    const [claimImageIdx, setClaimImageIdx] = useState(0);

    useEffect(() => {
        fetchClaims();
        const interval = setInterval(fetchClaims, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchClaims = async () => {
        setLoading(true);
        try {
            const data = await api.getStaffClaims("");
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
            await api.approveClaimStaff(selectedClaim._id, reviewNotes);
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
            await api.rejectClaimStaff(selectedClaim._id, rejectionReason);
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
            await api.markPickedUpStaff(selectedClaim._id);
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
            await api.confirmFinderReceivedStaff(selectedClaim._id, adminNotes);
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
            await api.declineFinderReportStaff(selectedClaim._id, finderRejectionReason);
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
            await api.ownerCollectedStaff(selectedClaim._id);
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
            case "picked_up": return { bg: "#E0F2FE", text: "#0284C7", border: "#BAE6FD" };
            default: return { bg: "#F3F4F6", text: "#374151", border: "#E5E7EB" };
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
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];

    // Card data
    const claimsCard = {
        label: "Claim Requests",
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
        { key: "picked_up", label: "Resolved", color: "#0284C7", bg: "#E0F2FE", bgActive: "rgba(224,242,254,0.7)" },
        { key: "rejected", label: "Rejected", color: "#991B1B", bg: "#FEE2E2", bgActive: "rgba(254,226,226,0.7)" },
    ];

    const StatusCard = ({ card, isActive, onClick }) => {
        const items = card.label === "Claim Requests" ? regularClaims : finderReports;

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
                        Cases
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
                            setActiveStatuses(new Set(["pending"]));
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
                            setActiveStatuses(new Set(["pending"]));
                        }
                    }}
                />
            </div>

            {/* ── Record Count ── */}
            {typeFilter && activeStatuses.size > 0 && (
                <div className="flex justify-end">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                        style={{ backgroundColor: "rgba(29,53,87,0.06)", color: T.navy }}>
                        <Inbox className="w-3.5 h-3.5" />
                        {filteredClaims.length} {filteredClaims.length === 1 ? "record" : "records"}
                    </span>
                </div>
            )}

            {/* ── Table ── */}
            <div className="rounded-2xl border overflow-hidden bg-white" style={{ borderColor: T.border, boxShadow: "0 1px 3px rgba(29,53,87,0.04)" }}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead style={{ backgroundColor: T.cool, borderBottom: `1px solid ${T.border}` }}>
                            <tr>
                                {["Item", "Type", "Submitted By", "Submitted", "Status"].map((h) => (
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
                                    <tr key={claim._id} className="transition-colors duration-150 cursor-pointer" style={{ borderColor: T.border }}
                                        onClick={() => { setSelectedClaim(claim); setClaimImageIdx(0); }}
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
                                            {formatDate(claim.createdAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border"
                                                style={{ backgroundColor: sc.bg, color: sc.text, borderColor: sc.border }}>
                                                {getStatusLabel(claim.status)}
                                            </span>
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
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    style={{ backgroundColor: "rgba(29,53,87,0.45)", backdropFilter: "blur(6px)" }}>
                    <div className="rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto bg-white"
                        style={{ boxShadow: "0 32px 64px -12px rgba(29,53,87,0.3), 0 4px 16px rgba(29,53,87,0.1)" }}>

                        {/* ── Header ── */}
                        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white rounded-t-3xl"
                            style={{ borderBottom: `1px solid ${T.border}` }}>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base font-extrabold" style={{ color: T.navy }}>
                                    {isFinderReport(selectedClaim) ? "Finder Report" : "Claim Request"}
                                </h2>
                                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold"
                                    style={{
                                        backgroundColor: isFinderReport(selectedClaim) ? "rgba(70,143,175,0.1)" : "rgba(29,53,87,0.07)",
                                        color: isFinderReport(selectedClaim) ? T.steel : T.navy,
                                    }}>
                                    {isFinderReport(selectedClaim) ? "Finder Report" : "Regular Claim"}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                                    style={{
                                        backgroundColor: getStatusColor(selectedClaim.status).bg,
                                        color: getStatusColor(selectedClaim.status).text,
                                        borderColor: getStatusColor(selectedClaim.status).border,
                                    }}>
                                    {getStatusLabel(selectedClaim.status)}
                                </span>
                            </div>
                            <button onClick={closeModal}
                                className="w-7 h-7 flex items-center justify-center rounded-full transition-colors flex-shrink-0"
                                style={{ color: T.textLight }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.cool; e.currentTarget.style.color = T.navy; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = T.textLight; }}>
                                <XCircle className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-4">

                            {/* ── Item + Claimant row ── */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Item card */}
                                <div className="flex items-center gap-3 p-3 rounded-2xl"
                                    style={{ backgroundColor: T.cool, border: `1px solid ${T.border}` }}>
                                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                                        style={{ backgroundColor: "rgba(29,53,87,0.06)" }}>
                                        {selectedClaim.item?.images?.[0]
                                            ? <img src={selectedClaim.item.images[0]} alt="" className="w-full h-full object-cover" />
                                            : <Package className="w-6 h-6" style={{ color: T.textLight }} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-extrabold truncate leading-tight" style={{ color: T.navy }}>{selectedClaim.item?.title}</p>
                                        <p className="text-[11px] mt-0.5 truncate" style={{ color: T.textLight }}>{selectedClaim.item?.location || "No location"}</p>
                                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold"
                                            style={{
                                                backgroundColor: selectedClaim.item?.type === "lost" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                                                color: selectedClaim.item?.type === "lost" ? "#B91C1C" : "#047857",
                                            }}>
                                            {selectedClaim.item?.type}
                                        </span>
                                    </div>
                                </div>

                                {/* Person card */}
                                <div className="p-3 rounded-2xl flex flex-col justify-center"
                                    style={{ backgroundColor: T.cool, border: `1px solid ${T.border}` }}>
                                    <p className="text-[9px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: T.textLight }}>
                                        {isFinderReport(selectedClaim) ? "Finder" : "Claimant"}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {selectedClaim.claimant?.avatar
                                            ? <img src={selectedClaim.claimant.avatar} alt={selectedClaim.claimant.name} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                                            : <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                                                style={{ backgroundColor: isFinderReport(selectedClaim) ? T.steel : T.navy }}>
                                                {selectedClaim.claimant?.name?.charAt(0)?.toUpperCase() || "?"}
                                            </div>
                                        }
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold truncate" style={{ color: T.navy }}>{selectedClaim.claimant?.name}</p>
                                            <p className="text-[10px] truncate" style={{ color: T.textLight }}>{selectedClaim.contactEmail}</p>
                                            {selectedClaim.contactPhone && (
                                                <p className="text-[10px]" style={{ color: T.textLight }}>{selectedClaim.contactPhone}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Item Images ── */}
                            {selectedClaim.item?.images?.length > 0 && (
                                <div className="relative rounded-2xl overflow-hidden" style={{ backgroundColor: T.cool, height: "160px" }}>
                                    <img
                                        src={selectedClaim.item.images[claimImageIdx]}
                                        alt="item"
                                        className="w-full h-full object-cover"
                                    />
                                    {selectedClaim.item.images.length > 1 && (
                                        <>
                                            <button
                                                onClick={() => setClaimImageIdx(i => (i - 1 + selectedClaim.item.images.length) % selectedClaim.item.images.length)}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                            </button>
                                            <button
                                                onClick={() => setClaimImageIdx(i => (i + 1) % selectedClaim.item.images.length)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                            </button>
                                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-semibold">
                                                {claimImageIdx + 1} / {selectedClaim.item.images.length}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* ── Proof / Description ── */}
                            <div className="p-4 rounded-2xl" style={{ backgroundColor: T.cool, border: `1px solid ${T.border}` }}>
                                <p className="text-[9px] font-extrabold uppercase tracking-widest mb-2" style={{ color: T.textLight }}>
                                    {isFinderReport(selectedClaim) ? "Where / How Found" : "Proof of Ownership"}
                                </p>
                                <p className="text-sm leading-relaxed" style={{ color: T.navy }}>
                                    {selectedClaim.finderDescription || selectedClaim.proofDescription || "—"}
                                </p>
                            </div>

                            {/* ── Photos ── */}
                            {selectedClaim.proofImages?.length > 0 && (
                                <div>
                                    <p className="text-[9px] font-extrabold uppercase tracking-widest mb-2" style={{ color: T.textLight }}>Photos</p>
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {selectedClaim.proofImages.map((img, idx) => (
                                            <img key={idx} src={img} alt={`${idx + 1}`}
                                                className="w-20 h-20 object-cover rounded-xl flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                                style={{ border: `2px solid ${T.border}` }}
                                                onClick={() => window.open(img, "_blank")} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Review History ── */}
                            {selectedClaim.status !== "pending" && (
                                <div className="p-4 rounded-2xl" style={{ backgroundColor: T.cool, border: `1px solid ${T.border}` }}>
                                    <p className="text-[9px] font-extrabold uppercase tracking-widest mb-3" style={{ color: T.textLight }}>Review History</p>
                                    <div className="space-y-1.5 text-[12px]">
                                        {selectedClaim.reviewedBy && (
                                            <div className="flex justify-between">
                                                <span style={{ color: T.textLight }}>Reviewed by</span>
                                                <span className="font-semibold" style={{ color: T.navy }}>{selectedClaim.reviewedBy?.name || "Admin"}</span>
                                            </div>
                                        )}
                                        {selectedClaim.reviewedAt && (
                                            <div className="flex justify-between">
                                                <span style={{ color: T.textLight }}>Date</span>
                                                <span className="font-semibold" style={{ color: T.navy }}>{new Date(selectedClaim.reviewedAt).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                        {selectedClaim.pickedUpAt && (
                                            <div className="flex justify-between">
                                                <span style={{ color: T.textLight }}>Resolved</span>
                                                <span className="font-semibold" style={{ color: "#0284C7" }}>{new Date(selectedClaim.pickedUpAt).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                        {selectedClaim.reviewNotes && (
                                            <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${T.border}` }}>
                                                <p className="text-[10px] font-bold mb-1" style={{ color: T.textLight }}>Notes</p>
                                                <p style={{ color: T.navy }}>{selectedClaim.reviewNotes}</p>
                                            </div>
                                        )}
                                        {selectedClaim.rejectionReason && (
                                            <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${T.border}` }}>
                                                <p className="text-[10px] font-bold mb-1" style={{ color: "#991B1B" }}>Rejection Reason</p>
                                                <p style={{ color: "#B91C1C" }}>{selectedClaim.rejectionReason}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ══ ADMIN ACTIONS ══ */}

                            {/* REGULAR CLAIM — Pending */}
                            {!isFinderReport(selectedClaim) && selectedClaim.status === "pending" && (
                                <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                                    <div className="px-4 py-3" style={{ backgroundColor: "rgba(29,53,87,0.03)", borderBottom: `1px solid ${T.border}` }}>
                                        <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: T.navy }}>Staff Decision</p>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: T.textLight }}>Review Notes <span className="normal-case font-normal">(optional)</span></label>
                                                <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)}
                                                    placeholder="Notes visible to claimant..."
                                                    rows={3}
                                                    className="w-full p-3 rounded-xl text-xs focus:outline-none resize-none"
                                                    style={{ backgroundColor: T.cool, border: `1.5px solid ${T.border}`, color: T.navy }}
                                                    onFocus={(e) => e.currentTarget.style.borderColor = T.steel}
                                                    onBlur={(e) => e.currentTarget.style.borderColor = T.border} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#991B1B" }}>Rejection Reason <span className="normal-case font-normal text-gray-400">(if rejecting)</span></label>
                                                <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                                                    placeholder="Required to reject..."
                                                    rows={3}
                                                    className="w-full p-3 rounded-xl text-xs focus:outline-none resize-none"
                                                    style={{ backgroundColor: "rgba(254,226,226,0.4)", border: `1.5px solid rgba(239,68,68,0.15)`, color: T.navy }}
                                                    onFocus={(e) => e.currentTarget.style.borderColor = "#EF4444"}
                                                    onBlur={(e) => e.currentTarget.style.borderColor = "rgba(239,68,68,0.15)"} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button onClick={handleApprove} disabled={processing}
                                                className="py-3 rounded-xl font-extrabold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                                                style={{ backgroundColor: "#047857", color: T.white, boxShadow: "0 4px 12px rgba(4,120,87,0.3)" }}>
                                                <CheckCircle className="w-4 h-4" />{processing ? "Processing…" : "Approve"}
                                            </button>
                                            <button onClick={handleReject} disabled={processing}
                                                className="py-3 rounded-xl font-extrabold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                                                style={{ backgroundColor: "#B91C1C", color: T.white, boxShadow: "0 4px 12px rgba(185,28,28,0.25)" }}>
                                                <XCircle className="w-4 h-4" />{processing ? "Processing…" : "Reject"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* REGULAR CLAIM — Approved */}
                            {!isFinderReport(selectedClaim) && selectedClaim.status === "approved" && (
                                <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid rgba(2,132,199,0.2)` }}>
                                    <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: "rgba(224,242,254,0.5)", borderBottom: `1px solid rgba(2,132,199,0.15)` }}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        <p className="text-xs font-bold" style={{ color: "#0284C7" }}>Awaiting in-person collection — verify school ID before handover</p>
                                    </div>
                                    <div className="p-4">
                                        <button onClick={handleMarkPickedUp} disabled={processing}
                                            className="w-full py-3 rounded-xl font-extrabold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                                            style={{ backgroundColor: "#0284C7", color: T.white, boxShadow: "0 4px 12px rgba(2,132,199,0.3)" }}>
                                            <Star className="w-4 h-4" />{processing ? "Processing…" : "Confirm Item Collected"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* FINDER REPORT — Pending */}
                            {isFinderReport(selectedClaim) && selectedClaim.status === "pending" && (
                                <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                                    <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: "rgba(70,143,175,0.05)", borderBottom: `1px solid ${T.border}` }}>
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: T.steel }} />
                                        <p className="text-xs font-bold" style={{ color: T.steel }}>Only confirm after finder physically brings the item to SAO</p>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: T.textLight }}>Admin Notes <span className="normal-case font-normal">(optional)</span></label>
                                                <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)}
                                                    placeholder="Internal notes..."
                                                    rows={3}
                                                    className="w-full p-3 rounded-xl text-xs focus:outline-none resize-none"
                                                    style={{ backgroundColor: T.cool, border: `1.5px solid ${T.border}`, color: T.navy }}
                                                    onFocus={(e) => e.currentTarget.style.borderColor = T.steel}
                                                    onBlur={(e) => e.currentTarget.style.borderColor = T.border} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#991B1B" }}>Decline Reason <span className="normal-case font-normal text-gray-400">(if declining)</span></label>
                                                <textarea value={finderRejectionReason} onChange={(e) => setFinderRejectionReason(e.target.value)}
                                                    placeholder="Required to decline..."
                                                    rows={3}
                                                    className="w-full p-3 rounded-xl text-xs focus:outline-none resize-none"
                                                    style={{ backgroundColor: "rgba(254,226,226,0.4)", border: `1.5px solid rgba(239,68,68,0.15)`, color: T.navy }}
                                                    onFocus={(e) => e.currentTarget.style.borderColor = "#EF4444"}
                                                    onBlur={(e) => e.currentTarget.style.borderColor = "rgba(239,68,68,0.15)"} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button onClick={handleConfirmFinderReceived} disabled={processing}
                                                className="py-3 rounded-xl font-extrabold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                                                style={{ backgroundColor: T.steel, color: T.white, boxShadow: "0 4px 12px rgba(70,143,175,0.3)" }}>
                                                <MapPin className="w-4 h-4" />{processing ? "Processing…" : "Confirm at SAO"}
                                            </button>
                                            <button onClick={handleDeclineFinderReport} disabled={processing}
                                                className="py-3 rounded-xl font-extrabold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                                                style={{ backgroundColor: "#B91C1C", color: T.white, boxShadow: "0 4px 12px rgba(185,28,28,0.25)" }}>
                                                <XCircle className="w-4 h-4" />{processing ? "Processing…" : "Decline"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* FINDER REPORT — Approved */}
                            {isFinderReport(selectedClaim) && selectedClaim.status === "approved" && (
                                <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid rgba(2,132,199,0.2)` }}>
                                    <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: "rgba(224,242,254,0.5)", borderBottom: `1px solid rgba(2,132,199,0.15)` }}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        <p className="text-xs font-bold" style={{ color: "#0284C7" }}>Owner has been notified — verify ID before releasing item</p>
                                    </div>
                                    <div className="p-4">
                                        <button onClick={handleOwnerCollected} disabled={processing}
                                            className="w-full py-3 rounded-xl font-extrabold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                                            style={{ backgroundColor: "#0284C7", color: T.white, boxShadow: "0 4px 12px rgba(2,132,199,0.3)" }}>
                                            <Star className="w-4 h-4" />{processing ? "Processing…" : "Owner Collected"}
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* ── Footer close ── */}
                        <div className="px-6 py-4 flex justify-end" style={{ borderTop: `1px solid ${T.border}` }}>
                            <button onClick={closeModal}
                                className="px-5 py-2 rounded-xl text-sm font-semibold border transition-all"
                                style={{ color: T.textLight, borderColor: T.border, backgroundColor: T.white }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.cool; e.currentTarget.style.color = T.navy; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.white; e.currentTarget.style.color = T.textLight; }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StaffClaims;