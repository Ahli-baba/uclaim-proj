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
                                        onClick={() => setSelectedClaim(claim)}
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
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(29,53,87,0.4)" }}>
                    <div className="rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white" style={{ boxShadow: "0 25px 50px -12px rgba(29,53,87,0.25)" }}>

                        {/* ── Sticky Header ── */}
                        <div className="sticky top-0 z-10 p-5 border-b flex items-center justify-between bg-white"
                            style={{ borderColor: T.border }}>
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-bold" style={{ color: T.navy }}>
                                    {isFinderReport(selectedClaim) ? "Finder Report" : "Claim Request"}
                                </h2>
                                <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold"
                                    style={{
                                        backgroundColor: isFinderReport(selectedClaim) ? "rgba(70,143,175,0.1)" : "rgba(29,53,87,0.08)",
                                        color: isFinderReport(selectedClaim) ? T.steel : T.navy,
                                    }}>
                                    {isFinderReport(selectedClaim) ? "Finder Report" : "Regular Claim"}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                                    style={{
                                        backgroundColor: getStatusColor(selectedClaim.status).bg,
                                        color: getStatusColor(selectedClaim.status).text,
                                        borderColor: getStatusColor(selectedClaim.status).border,
                                    }}>
                                    {getStatusLabel(selectedClaim.status)}
                                </span>
                            </div>
                            <button onClick={closeModal}
                                className="p-1.5 rounded-full transition-colors"
                                style={{ color: T.textLight }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = T.cool}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">

                            {/* ── Item + Person (2-column grid) ── */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Item */}
                                <div className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: T.cool }}>
                                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                                        style={{ backgroundColor: "rgba(29,53,87,0.06)" }}>
                                        {selectedClaim.item?.images?.[0]
                                            ? <img src={selectedClaim.item.images[0]} alt="" className="w-full h-full object-cover" />
                                            : <Package className="w-5 h-5" style={{ color: T.textLight }} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold truncate" style={{ color: T.navy }}>{selectedClaim.item?.title}</p>
                                        <p className="text-[11px] mt-0.5" style={{ color: T.textLight }}>{selectedClaim.item?.location}</p>
                                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
                                            style={{
                                                backgroundColor: selectedClaim.item?.type === "lost" ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
                                                color: selectedClaim.item?.type === "lost" ? "#B91C1C" : "#047857",
                                            }}>
                                            {selectedClaim.item?.type}
                                        </span>
                                    </div>
                                </div>

                                {/* Person */}
                                <div className="p-3 rounded-xl" style={{ backgroundColor: T.cool }}>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: T.textLight }}>
                                        {isFinderReport(selectedClaim) ? "Finder" : "Claimant"}
                                    </p>
                                    <p className="text-sm font-semibold" style={{ color: T.navy }}>{selectedClaim.claimant?.name}</p>
                                    <p className="text-[11px]" style={{ color: T.textLight }}>{selectedClaim.contactEmail}</p>
                                    <p className="text-[11px]" style={{ color: T.textLight }}>{selectedClaim.contactPhone}</p>
                                </div>
                            </div>

                            {/* ── Description ── */}
                            <div className="p-3 rounded-xl" style={{ backgroundColor: T.cool }}>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: T.textLight }}>
                                    {isFinderReport(selectedClaim) ? "Where / How Found" : "Proof of Ownership"}
                                </p>
                                <p className="text-[13px] leading-relaxed" style={{ color: T.navy }}>
                                    {selectedClaim.finderDescription || selectedClaim.proofDescription || "—"}
                                </p>
                            </div>

                            {/* ── Photos (horizontal scroll) ── */}
                            {selectedClaim.proofImages?.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: T.textLight }}>
                                        Photos
                                    </p>
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {selectedClaim.proofImages.map((img, idx) => (
                                            <img key={idx} src={img} alt={`${idx + 1}`}
                                                className="w-16 h-16 object-cover rounded-lg border cursor-pointer flex-shrink-0 hover:opacity-80 transition"
                                                style={{ borderColor: T.border }}
                                                onClick={() => window.open(img, "_blank")} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Review History (compact) ── */}
                            {selectedClaim.status !== "pending" && (
                                <div className="p-3 rounded-xl" style={{ backgroundColor: T.cool }}>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: T.textLight }}>Review History</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
                                        {selectedClaim.reviewedBy && (
                                            <p><span style={{ color: T.textLight }}>By:</span> <span className="font-semibold" style={{ color: T.navy }}>{selectedClaim.reviewedBy?.name || "Admin"}</span></p>
                                        )}
                                        {selectedClaim.reviewedAt && (
                                            <p><span style={{ color: T.textLight }}>Date:</span> <span className="font-semibold" style={{ color: T.navy }}>{new Date(selectedClaim.reviewedAt).toLocaleDateString()}</span></p>
                                        )}
                                        {selectedClaim.reviewNotes && (
                                            <p className="col-span-2"><span style={{ color: T.textLight }}>Notes:</span> <span style={{ color: T.navy }}>{selectedClaim.reviewNotes}</span></p>
                                        )}
                                        {selectedClaim.rejectionReason && (
                                            <p className="col-span-2" style={{ color: "#B91C1C" }}><span className="font-semibold">Reason:</span> {selectedClaim.rejectionReason}</p>
                                        )}
                                        {selectedClaim.pickedUpAt && (
                                            <p className="col-span-2"><span style={{ color: T.textLight }}>Resolved:</span> <span style={{ color: "#0284C7" }}>{new Date(selectedClaim.pickedUpAt).toLocaleString()}</span></p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── ADMIN ACTIONS ── */}

                            {/* REGULAR CLAIM — Pending */}
                            {!isFinderReport(selectedClaim) && selectedClaim.status === "pending" && (
                                <div className="space-y-3 pt-2 border-t" style={{ borderColor: T.border }}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: T.textLight }}>Review Notes</label>
                                            <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)}
                                                placeholder="Optional notes for claimant..."
                                                className="w-full p-2.5 rounded-xl text-[12px] focus:outline-none"
                                                style={{ backgroundColor: T.cool, border: `1px solid ${T.border}`, color: T.navy, minHeight: "60px" }}
                                                onFocus={(e) => e.currentTarget.style.borderColor = T.steel}
                                                onBlur={(e) => e.currentTarget.style.borderColor = T.border} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: T.textLight }}>Rejection Reason</label>
                                            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                                                placeholder="Required if rejecting..."
                                                className="w-full p-2.5 rounded-xl text-[12px] focus:outline-none"
                                                style={{ backgroundColor: T.cool, border: `1px solid ${T.border}`, color: T.navy, minHeight: "60px" }}
                                                onFocus={(e) => e.currentTarget.style.borderColor = "#EF4444"}
                                                onBlur={(e) => e.currentTarget.style.borderColor = T.border} />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleApprove} disabled={processing}
                                            className="flex-1 py-2.5 rounded-xl font-bold text-[12px] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                                            style={{ backgroundColor: "#047857", color: T.white }}>
                                            <CheckCircle className="w-3.5 h-3.5" />{processing ? "..." : "Approve"}
                                        </button>
                                        <button onClick={handleReject} disabled={processing}
                                            className="flex-1 py-2.5 rounded-xl font-bold text-[12px] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                                            style={{ backgroundColor: "#B91C1C", color: T.white }}>
                                            <XCircle className="w-3.5 h-3.5" />{processing ? "..." : "Reject"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* REGULAR CLAIM — Approved */}
                            {!isFinderReport(selectedClaim) && selectedClaim.status === "approved" && (
                                <div className="pt-2 border-t space-y-2" style={{ borderColor: T.border }}>
                                    <p className="text-[11px]" style={{ color: "#92400E" }}>Verify ID before handing over item.</p>
                                    <button onClick={handleMarkPickedUp} disabled={processing}
                                        className="w-full py-2.5 rounded-xl font-bold text-[12px] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                                        style={{ backgroundColor: "#0284C7", color: T.white }}>
                                        <Star className="w-3.5 h-3.5" />{processing ? "..." : "Confirm Collected"}
                                    </button>
                                </div>
                            )}

                            {/* FINDER REPORT — Pending */}
                            {isFinderReport(selectedClaim) && selectedClaim.status === "pending" && (
                                <div className="space-y-3 pt-2 border-t" style={{ borderColor: T.border }}>
                                    <p className="text-[11px] font-medium" style={{ color: T.navy }}>
                                        Only confirm after finder physically brings item to SAO.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: T.textLight }}>Admin Notes</label>
                                            <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)}
                                                placeholder="Internal notes..."
                                                className="w-full p-2.5 rounded-xl text-[12px] focus:outline-none"
                                                style={{ backgroundColor: T.cool, border: `1px solid ${T.border}`, color: T.navy, minHeight: "60px" }}
                                                onFocus={(e) => e.currentTarget.style.borderColor = T.steel}
                                                onBlur={(e) => e.currentTarget.style.borderColor = T.border} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: T.textLight }}>Decline Reason</label>
                                            <textarea value={finderRejectionReason} onChange={(e) => setFinderRejectionReason(e.target.value)}
                                                placeholder="Required if declining..."
                                                className="w-full p-2.5 rounded-xl text-[12px] focus:outline-none"
                                                style={{ backgroundColor: T.cool, border: `1px solid ${T.border}`, color: T.navy, minHeight: "60px" }}
                                                onFocus={(e) => e.currentTarget.style.borderColor = "#EF4444"}
                                                onBlur={(e) => e.currentTarget.style.borderColor = T.border} />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleConfirmFinderReceived} disabled={processing}
                                            className="flex-1 py-2.5 rounded-xl font-bold text-[12px] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                                            style={{ backgroundColor: T.steel, color: T.white }}>
                                            <MapPin className="w-3.5 h-3.5" />{processing ? "..." : "Confirm at SAO"}
                                        </button>
                                        <button onClick={handleDeclineFinderReport} disabled={processing}
                                            className="flex-1 py-2.5 rounded-xl font-bold text-[12px] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                                            style={{ backgroundColor: "#B91C1C", color: T.white }}>
                                            <XCircle className="w-3.5 h-3.5" />{processing ? "..." : "Decline"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* FINDER REPORT — Approved */}
                            {isFinderReport(selectedClaim) && selectedClaim.status === "approved" && (
                                <div className="pt-2 border-t space-y-2" style={{ borderColor: T.border }}>
                                    <p className="text-[11px]" style={{ color: T.navy }}>Owner notified. Verify ID before handover.</p>
                                    <button onClick={handleOwnerCollected} disabled={processing}
                                        className="w-full py-2.5 rounded-xl font-bold text-[12px] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                                        style={{ backgroundColor: "#0284C7", color: T.white }}>
                                        <Star className="w-3.5 h-3.5" />{processing ? "..." : "Owner Collected"}
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StaffClaims;