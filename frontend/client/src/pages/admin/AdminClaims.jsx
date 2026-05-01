import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import {
    CheckCircle, XCircle, Clock, Eye, Star, User,
    Package, MessageSquare, AlertCircle, MapPin, Search
} from "lucide-react";

function AdminClaims() {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all"); // "all" | "claim" | "finder_report"
    const [selectedClaim, setSelectedClaim] = useState(null);

    // Regular claim fields
    const [reviewNotes, setReviewNotes] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");

    // Finder report fields
    const [adminNotes, setAdminNotes] = useState("");
    const [finderRejectionReason, setFinderRejectionReason] = useState("");

    const [processing, setProcessing] = useState(false);

    useEffect(() => { fetchClaims(); }, [filter]);

    const fetchClaims = async () => {
        setLoading(true);
        try {
            const status = filter === "all" ? "" : filter;
            const data = await api.getAllClaimsAdmin(status);
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
            alert("Claim approved! The claimant has been notified.");
            closeModal();
            fetchClaims();
        } catch (err) {
            alert("Failed to approve claim: " + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedClaim) return;
        if (!rejectionReason.trim()) { alert("Please provide a rejection reason"); return; }
        setProcessing(true);
        try {
            await api.rejectClaim(selectedClaim._id, rejectionReason);
            alert("Claim rejected. The claimant has been notified.");
            closeModal();
            fetchClaims();
        } catch (err) {
            alert("Failed to reject claim: " + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleMarkPickedUp = async () => {
        if (!selectedClaim) return;
        if (!window.confirm("Confirm the claimant has physically collected the item from SAO?")) return;
        setProcessing(true);
        try {
            await api.markPickedUp(selectedClaim._id);
            alert("Item marked as collected. Case resolved!");
            closeModal();
            fetchClaims();
        } catch (err) {
            alert("Failed: " + err.message);
        } finally {
            setProcessing(false);
        }
    };

    // ── Finder Report Actions ──────────────────────────────────────────────────
    const handleConfirmFinderReceived = async () => {
        if (!selectedClaim) return;
        if (!window.confirm("Confirm that the finder has physically brought the item to SAO? This will notify the owner.")) return;
        setProcessing(true);
        try {
            await api.confirmFinderReceived(selectedClaim._id, adminNotes);
            alert("Item received at SAO confirmed! The owner has been notified to come collect it.");
            closeModal();
            fetchClaims();
        } catch (err) {
            alert("Failed: " + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleDeclineFinderReport = async () => {
        if (!selectedClaim) return;
        if (!finderRejectionReason.trim()) { alert("Please provide a reason for declining"); return; }
        setProcessing(true);
        try {
            await api.declineFinderReport(selectedClaim._id, finderRejectionReason);
            alert("Finder report declined. The finder has been notified.");
            closeModal();
            fetchClaims();
        } catch (err) {
            alert("Failed: " + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleOwnerCollected = async () => {
        if (!selectedClaim) return;
        if (!window.confirm("Confirm the owner has physically collected their item from SAO?")) return;
        setProcessing(true);
        try {
            await api.ownerCollected(selectedClaim._id);
            alert("Owner collected item. Case resolved!");
            closeModal();
            fetchClaims();
        } catch (err) {
            alert("Failed: " + err.message);
        } finally {
            setProcessing(false);
        }
    };

    // ── Helpers ────────────────────────────────────────────────────────────────
    const getStatusColor = (status) => {
        switch (status) {
            case "pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "approved": return "bg-green-100 text-green-700 border-green-200";
            case "rejected": return "bg-red-100 text-red-700 border-red-200";
            case "picked_up": return "bg-purple-100 text-purple-700 border-purple-200";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "pending": return <Clock className="w-4 h-4" />;
            case "approved": return <CheckCircle className="w-4 h-4" />;
            case "rejected": return <XCircle className="w-4 h-4" />;
            case "picked_up": return <Star className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case "picked_up": return "Resolved";
            case "approved": return "Confirmed at SAO";
            default: return status.charAt(0).toUpperCase() + status.slice(1);
        }
    };

    const isFinderReport = (claim) => claim.type === "finder_report";

    const filterTabs = ["all", "pending", "approved", "picked_up", "rejected"];

    const filteredClaims = claims
        .filter(c => filter === "all" ? true : c.status === filter)
        .filter(c => typeFilter === "all" ? true : c.type === typeFilter);

    // Summary counts
    const regularClaims = claims.filter(c => c.type !== "finder_report");
    const finderReports = claims.filter(c => c.type === "finder_report");

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Claim Requests</h1>
                <p className="text-slate-500 mt-1">Review and manage item claims and finder reports</p>
            </div>

            {/* ── Summary Bar ── */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-3">
                        📋 Regular Claims (Found Items)
                    </p>
                    <div className="flex gap-4 text-center">
                        <div>
                            <p className="text-xl font-black text-yellow-600">{regularClaims.filter(c => c.status === "pending").length}</p>
                            <p className="text-xs text-slate-500">Pending</p>
                        </div>
                        <div>
                            <p className="text-xl font-black text-green-600">{regularClaims.filter(c => c.status === "approved").length}</p>
                            <p className="text-xs text-slate-500">Approved</p>
                        </div>
                        <div>
                            <p className="text-xl font-black text-purple-600">{regularClaims.filter(c => c.status === "picked_up").length}</p>
                            <p className="text-xs text-slate-500">Resolved</p>
                        </div>
                    </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-wide mb-3">
                        🔍 Finder Reports (Lost Items)
                    </p>
                    <div className="flex gap-4 text-center">
                        <div>
                            <p className="text-xl font-black text-yellow-600">{finderReports.filter(c => c.status === "pending").length}</p>
                            <p className="text-xs text-slate-500">Pending</p>
                        </div>
                        <div>
                            <p className="text-xl font-black text-green-600">{finderReports.filter(c => c.status === "approved").length}</p>
                            <p className="text-xs text-slate-500">At SAO</p>
                        </div>
                        <div>
                            <p className="text-xl font-black text-purple-600">{finderReports.filter(c => c.status === "picked_up").length}</p>
                            <p className="text-xs text-slate-500">Resolved</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Filters ── */}
            <div className="flex flex-wrap gap-3 items-center">
                {/* Status filter */}
                <div className="flex gap-2 flex-wrap">
                    {filterTabs.map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${filter === status
                                ? "bg-indigo-600 text-white"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                }`}
                        >
                            {status === "all" ? "All" : getStatusLabel(status)}
                            {status !== "all" && (
                                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                                    {claims.filter(c => c.status === status).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Type filter */}
                <div className="flex gap-2 ml-auto">
                    {["all", "claim", "finder_report"].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTypeFilter(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${typeFilter === t
                                ? t === "finder_report"
                                    ? "bg-emerald-500 text-white border-emerald-500"
                                    : "bg-indigo-500 text-white border-indigo-500"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                }`}
                        >
                            {t === "all" ? "All Types" : t === "claim" ? "📋 Claims" : "🔍 Finder Reports"}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Table ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Item</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Type</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Submitted By</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Date</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Action Needed</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">View</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredClaims.map((claim) => (
                                <tr key={claim._id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center text-xl overflow-hidden">
                                                {claim.item?.images?.[0]
                                                    ? <img src={claim.item.images[0]} alt="" className="w-full h-full object-cover" />
                                                    : "📦"}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">{claim.item?.title}</p>
                                                <p className="text-xs text-slate-500 capitalize">{claim.item?.type}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {isFinderReport(claim) ? (
                                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
                                                🔍 Finder Report
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold">
                                                📋 Claim
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-900">{claim.claimant?.name}</p>
                                        <p className="text-sm text-slate-500">{claim.claimant?.email}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {new Date(claim.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(claim.status)}`}>
                                            {getStatusIcon(claim.status)}
                                            {getStatusLabel(claim.status)}
                                        </span>
                                    </td>
                                    {/* Action column */}
                                    <td className="px-6 py-4">
                                        {/* Regular claim actions */}
                                        {!isFinderReport(claim) && claim.status === "approved" && (
                                            <button
                                                onClick={async () => {
                                                    if (!window.confirm(`Confirm "${claim.item?.title}" has been collected by the claimant?`)) return;
                                                    try {
                                                        await api.markPickedUp(claim._id);
                                                        fetchClaims();
                                                    } catch (err) { alert("Failed: " + err.message); }
                                                }}
                                                className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 hover:bg-purple-100 transition"
                                            >
                                                ✓ Confirm Collected
                                            </button>
                                        )}
                                        {/* Finder report actions */}
                                        {isFinderReport(claim) && claim.status === "pending" && (
                                            <button
                                                onClick={() => setSelectedClaim(claim)}
                                                className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition"
                                            >
                                                📦 Review Report
                                            </button>
                                        )}
                                        {isFinderReport(claim) && claim.status === "approved" && (
                                            <button
                                                onClick={async () => {
                                                    if (!window.confirm(`Confirm the owner has collected "${claim.item?.title}" from SAO?`)) return;
                                                    try {
                                                        await api.ownerCollected(claim._id);
                                                        fetchClaims();
                                                    } catch (err) { alert("Failed: " + err.message); }
                                                }}
                                                className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition"
                                            >
                                                ✓ Owner Collected
                                            </button>
                                        )}
                                        {(claim.status === "pending" && !isFinderReport(claim)) ||
                                            claim.status === "rejected" ||
                                            claim.status === "picked_up" ? (
                                            <span className="text-xs text-slate-400">—</span>
                                        ) : null}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => setSelectedClaim(claim)}
                                            className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600 transition"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredClaims.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        <div className="text-4xl mb-2">📭</div>
                        <p>No records found matching your criteria</p>
                    </div>
                )}
            </div>

            {/* ═══ MODAL ═══════════════════════════════════════════════════════════ */}
            {selectedClaim && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

                        {/* Modal Header */}
                        <div className={`p-6 border-b border-slate-100 flex items-center justify-between ${isFinderReport(selectedClaim) ? "bg-emerald-50" : "bg-white"
                            }`}>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-xl font-bold text-slate-900">
                                        {isFinderReport(selectedClaim) ? "🔍 Finder Report" : "📋 Claim Details"}
                                    </h2>
                                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${isFinderReport(selectedClaim)
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-indigo-100 text-indigo-700"
                                        }`}>
                                        {isFinderReport(selectedClaim) ? "Finder Report" : "Regular Claim"}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500">
                                    Submitted on {new Date(selectedClaim.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full transition">
                                <XCircle className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Status Badge */}
                            <div className={`flex items-center gap-3 p-4 rounded-2xl border ${getStatusColor(selectedClaim.status)}`}>
                                {getStatusIcon(selectedClaim.status)}
                                <div>
                                    <p className="font-bold text-sm">Status: {getStatusLabel(selectedClaim.status)}</p>
                                    {selectedClaim.status === "picked_up" && selectedClaim.pickedUpAt && (
                                        <p className="text-xs mt-0.5">Resolved on {new Date(selectedClaim.pickedUpAt).toLocaleString()}</p>
                                    )}
                                </div>
                            </div>

                            {/* Item Info */}
                            <div className="p-4 bg-slate-50 rounded-2xl">
                                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4" /> Item Information
                                </h3>
                                <div className="flex items-center gap-3">
                                    <div className="w-16 h-16 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center text-2xl">
                                        {selectedClaim.item?.images?.[0]
                                            ? <img src={selectedClaim.item.images[0]} alt="" className="w-full h-full object-cover" />
                                            : "📦"}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{selectedClaim.item?.title}</p>
                                        <p className="text-sm text-slate-500">{selectedClaim.item?.location}</p>
                                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium capitalize ${selectedClaim.item?.type === "lost"
                                            ? "bg-red-100 text-red-700"
                                            : "bg-green-100 text-green-700"
                                            }`}>
                                            {selectedClaim.item?.type}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Person Info — label changes based on type */}
                            <div className="p-4 bg-slate-50 rounded-2xl">
                                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    {isFinderReport(selectedClaim) ? "Finder Information" : "Claimant Information"}
                                </h3>
                                <div className="space-y-1.5">
                                    <p className="text-sm"><span className="font-medium">Name:</span> {selectedClaim.claimant?.name}</p>
                                    <p className="text-sm"><span className="font-medium">Email:</span> {selectedClaim.contactEmail}</p>
                                    <p className="text-sm"><span className="font-medium">Phone:</span> {selectedClaim.contactPhone}</p>
                                </div>
                            </div>

                            {/* Description — label changes based on type */}
                            <div className="p-4 bg-slate-50 rounded-2xl">
                                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    {isFinderReport(selectedClaim) ? "Where / How Item Was Found" : "Proof of Ownership"}
                                </h3>
                                <p className="text-slate-700 text-sm leading-relaxed">
                                    {selectedClaim.finderDescription || selectedClaim.proofDescription}
                                </p>
                            </div>

                            {/* Proof Images */}
                            {selectedClaim.proofImages?.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-3">
                                        {isFinderReport(selectedClaim) ? "Photos Submitted by Finder" : "Proof Images"}
                                    </h3>
                                    <div className="flex gap-3 flex-wrap">
                                        {selectedClaim.proofImages.map((img, idx) => (
                                            <img key={idx} src={img} alt={`Proof ${idx + 1}`}
                                                className="w-24 h-24 object-cover rounded-xl border border-slate-200 cursor-pointer hover:scale-105 transition"
                                                onClick={() => window.open(img, "_blank")} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ═══ ADMIN ACTIONS ════════════════════════════════════ */}

                            {/* REGULAR CLAIM — Pending */}
                            {!isFinderReport(selectedClaim) && selectedClaim.status === "pending" && (
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Admin Actions</p>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            Review Notes (Optional — shown to claimant)
                                        </label>
                                        <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)}
                                            placeholder="Add any notes about this approval..."
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 min-h-[80px]" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            Rejection Reason (Required if rejecting)
                                        </label>
                                        <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Explain why the claim is being rejected..."
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 min-h-[80px]" />
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={handleApprove} disabled={processing}
                                            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                                            <CheckCircle className="w-5 h-5" />
                                            {processing ? "Processing..." : "Approve Claim"}
                                        </button>
                                        <button onClick={handleReject} disabled={processing}
                                            className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                                            <XCircle className="w-5 h-5" />
                                            {processing ? "Processing..." : "Reject Claim"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* REGULAR CLAIM — Approved (waiting for pickup) */}
                            {!isFinderReport(selectedClaim) && selectedClaim.status === "approved" && (
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Pickup Confirmation</p>
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
                                        <p className="font-bold mb-1">⚠️ Confirm Before Clicking</p>
                                        <p>Only confirm after verifying the claimant's ID and physically handing over the item.</p>
                                    </div>
                                    <button onClick={handleMarkPickedUp} disabled={processing}
                                        className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                                        <Star className="w-5 h-5" />
                                        {processing ? "Updating..." : "Confirm Item Collected by Claimant"}
                                    </button>
                                </div>
                            )}

                            {/* FINDER REPORT — Pending */}
                            {isFinderReport(selectedClaim) && selectedClaim.status === "pending" && (
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Finder Report Actions</p>

                                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-800">
                                        <p className="font-bold mb-1">📦 Waiting for Item Drop-off</p>
                                        <p>Only confirm receipt after the finder has <strong>physically brought the item to the SAO office</strong>. The owner will be notified immediately.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            Admin Notes (Optional — internal only)
                                        </label>
                                        <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)}
                                            placeholder="Any notes about receiving this item at SAO..."
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 min-h-[70px]" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            Decline Reason (Required if declining)
                                        </label>
                                        <textarea value={finderRejectionReason} onChange={(e) => setFinderRejectionReason(e.target.value)}
                                            placeholder="Explain why this finder report is being declined..."
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 min-h-[70px]" />
                                    </div>

                                    <div className="flex gap-3">
                                        <button onClick={handleConfirmFinderReceived} disabled={processing}
                                            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                                            <MapPin className="w-5 h-5" />
                                            {processing ? "Processing..." : "Confirm Item Received at SAO"}
                                        </button>
                                        <button onClick={handleDeclineFinderReport} disabled={processing}
                                            className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                                            <XCircle className="w-5 h-5" />
                                            {processing ? "Processing..." : "Decline Report"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* FINDER REPORT — Approved (item at SAO, waiting for owner) */}
                            {isFinderReport(selectedClaim) && selectedClaim.status === "approved" && (
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Owner Pickup Confirmation</p>
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-800">
                                        <p className="font-bold mb-1">📍 Item is at SAO — Waiting for Owner</p>
                                        <p>The owner has been notified. Once they come to SAO and collect the item, confirm it below.</p>
                                    </div>
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
                                        <p className="font-bold mb-1">⚠️ Confirm Before Clicking</p>
                                        <p>Only confirm after verifying the owner's ID and physically handing over the item.</p>
                                    </div>
                                    <button onClick={handleOwnerCollected} disabled={processing}
                                        className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                                        <Star className="w-5 h-5" />
                                        {processing ? "Updating..." : "Confirm Owner Collected Item"}
                                    </button>
                                </div>
                            )}

                            {/* Review History */}
                            {selectedClaim.status !== "pending" && (
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <h3 className="font-bold text-slate-900 mb-3">Review History</h3>
                                    <div className="space-y-1.5">
                                        {selectedClaim.reviewedBy && (
                                            <p className="text-sm text-slate-600">
                                                <span className="font-medium">Reviewed by:</span> {selectedClaim.reviewedBy?.name || "Admin"}
                                            </p>
                                        )}
                                        {selectedClaim.reviewedAt && (
                                            <p className="text-sm text-slate-600">
                                                <span className="font-medium">Review date:</span> {new Date(selectedClaim.reviewedAt).toLocaleString()}
                                            </p>
                                        )}
                                        {selectedClaim.reviewNotes && (
                                            <p className="text-sm text-slate-600">
                                                <span className="font-medium">Notes:</span> {selectedClaim.reviewNotes}
                                            </p>
                                        )}
                                        {selectedClaim.rejectionReason && (
                                            <p className="text-sm text-red-600">
                                                <span className="font-medium">Decline reason:</span> {selectedClaim.rejectionReason}
                                            </p>
                                        )}
                                        {selectedClaim.pickedUpAt && (
                                            <p className="text-sm text-purple-600">
                                                <span className="font-medium">Resolved on:</span> {new Date(selectedClaim.pickedUpAt).toLocaleString()}
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