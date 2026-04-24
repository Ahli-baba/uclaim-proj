import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import {
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    MapPin,
    Star,
    User,
    Package,
    MessageSquare,
    AlertCircle
} from "lucide-react";

function AdminClaims() {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [reviewNotes, setReviewNotes] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");
    const [saoNotes, setSaoNotes] = useState("Your item is now at the SAO. Please bring a valid ID to claim it.");
    const [pickupDeadlineDays, setPickupDeadlineDays] = useState(7);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchClaims();
    }, [filter]);

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
        setSaoNotes("Your item is now at the SAO. Please bring a valid ID to claim it.");
        setPickupDeadlineDays(7);
    };

    const handleApprove = async () => {
        if (!selectedClaim) return;
        setProcessing(true);
        try {
            await api.approveClaim(selectedClaim._id, reviewNotes);
            alert("Claim approved! Remind the finder to drop the item off at SAO.");
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
        if (!rejectionReason.trim()) {
            alert("Please provide a rejection reason");
            return;
        }
        setProcessing(true);
        try {
            await api.rejectClaim(selectedClaim._id, rejectionReason);
            alert("Claim rejected successfully!");
            closeModal();
            fetchClaims();
        } catch (err) {
            alert("Failed to reject claim: " + err.message);
        } finally {
            setProcessing(false);
        }
    };

    // ✅ NEW: Mark delivered to SAO
    const handleMarkDeliveredToSAO = async () => {
        if (!selectedClaim) return;
        setProcessing(true);
        try {
            await api.markDeliveredToSAO(selectedClaim._id, saoNotes, pickupDeadlineDays);
            alert("Item marked as delivered to SAO. The claimant has been notified.");
            closeModal();
            fetchClaims();
        } catch (err) {
            alert("Failed to update SAO status: " + err.message);
        } finally {
            setProcessing(false);
        }
    };

    // ✅ NEW: Mark picked up from SAO
    const handleMarkPickedUp = async () => {
        if (!selectedClaim) return;
        if (!window.confirm("Confirm that the claimant has physically picked up the item from SAO?")) return;
        setProcessing(true);
        try {
            await api.markPickedUp(selectedClaim._id);
            alert("Item marked as picked up. Case resolved!");
            closeModal();
            fetchClaims();
        } catch (err) {
            alert("Failed to update pickup status: " + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "approved": return "bg-green-100 text-green-700 border-green-200";
            case "rejected": return "bg-red-100 text-red-700 border-red-200";
            case "delivered_to_sao": return "bg-blue-100 text-blue-700 border-blue-200";   // ✅
            case "picked_up": return "bg-purple-100 text-purple-700 border-purple-200"; // ✅
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "pending": return <Clock className="w-4 h-4" />;
            case "approved": return <CheckCircle className="w-4 h-4" />;
            case "rejected": return <XCircle className="w-4 h-4" />;
            case "delivered_to_sao": return <MapPin className="w-4 h-4" />;  // ✅
            case "picked_up": return <Star className="w-4 h-4" />;    // ✅
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case "delivered_to_sao": return "At SAO";
            case "picked_up": return "Picked Up";
            default: return status.charAt(0).toUpperCase() + status.slice(1);
        }
    };

    // ✅ All filter tabs including new SAO statuses
    const filterTabs = ["all", "pending", "approved", "delivered_to_sao", "picked_up", "rejected"];

    const filteredClaims = filter === "all"
        ? claims
        : claims.filter(c => c.status === filter);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Claim Requests</h1>
                    <p className="text-slate-500 mt-1">Review and manage item claims from users</p>
                </div>
                {/* ✅ Filter tabs with SAO statuses */}
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
                            {status === "delivered_to_sao" ? "At SAO" : status === "all" ? "All" : getStatusLabel(status)}
                            {status !== "all" && (
                                <span className="ml-2 px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-xs">
                                    {claims.filter(c => c.status === status).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ✅ SAO Quick Summary Bar */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-black text-green-600">
                        {claims.filter(c => c.status === "approved").length}
                    </p>
                    <p className="text-xs font-bold text-green-700 mt-1">Approved – Awaiting SAO Drop-off</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-black text-blue-600">
                        {claims.filter(c => c.status === "delivered_to_sao").length}
                    </p>
                    <p className="text-xs font-bold text-blue-700 mt-1">At SAO – Awaiting Pickup</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-black text-purple-600">
                        {claims.filter(c => c.status === "picked_up").length}
                    </p>
                    <p className="text-xs font-bold text-purple-700 mt-1">Picked Up – Resolved</p>
                </div>
            </div>

            {/* Claims Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Item</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Claimant</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Submitted</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">SAO Action Needed</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">View</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredClaims.map((claim) => (
                                <tr key={claim._id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center text-xl">
                                                {claim.item?.images?.[0] ? "📷" : "📦"}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">{claim.item?.title}</p>
                                                <p className="text-xs text-slate-500 capitalize">{claim.item?.type}</p>
                                            </div>
                                        </div>
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
                                    {/* ✅ SAO action hint in table */}
                                    <td className="px-6 py-4">
                                        {claim.status === "approved" && (
                                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                                                Mark as at SAO
                                            </span>
                                        )}
                                        {claim.status === "delivered_to_sao" && (
                                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
                                                Mark as Picked Up
                                            </span>
                                        )}
                                        {(claim.status === "pending" || claim.status === "rejected" || claim.status === "picked_up") && (
                                            <span className="text-xs text-slate-400">—</span>
                                        )}
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
                        No claims found matching your criteria
                    </div>
                )}
            </div>

            {/* Claim Detail Modal */}
            {selectedClaim && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Claim Details</h2>
                                <p className="text-sm text-slate-500">
                                    Submitted on {new Date(selectedClaim.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full transition">
                                <XCircle className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Current Status Badge */}
                            <div className={`flex items-center gap-3 p-4 rounded-2xl border ${getStatusColor(selectedClaim.status)}`}>
                                {getStatusIcon(selectedClaim.status)}
                                <div>
                                    <p className="font-bold text-sm">Status: {getStatusLabel(selectedClaim.status)}</p>
                                    {selectedClaim.status === "delivered_to_sao" && selectedClaim.saoDeliveredAt && (
                                        <p className="text-xs mt-0.5">
                                            Delivered to SAO on {new Date(selectedClaim.saoDeliveredAt).toLocaleString()}
                                        </p>
                                    )}
                                    {selectedClaim.status === "picked_up" && selectedClaim.pickedUpAt && (
                                        <p className="text-xs mt-0.5">
                                            Picked up on {new Date(selectedClaim.pickedUpAt).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Item Info */}
                            <div className="p-4 bg-slate-50 rounded-2xl">
                                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4" /> Item Information
                                </h3>
                                <div className="flex items-center gap-3">
                                    <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center text-2xl">
                                        {selectedClaim.item?.images?.[0] ? "📷" : "📦"}
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

                            {/* Claimant Info */}
                            <div className="p-4 bg-slate-50 rounded-2xl">
                                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4" /> Claimant Information
                                </h3>
                                <div className="space-y-1.5">
                                    <p className="text-sm"><span className="font-medium">Name:</span> {selectedClaim.claimant?.name}</p>
                                    <p className="text-sm"><span className="font-medium">Email:</span> {selectedClaim.contactEmail}</p>
                                    <p className="text-sm"><span className="font-medium">Phone:</span> {selectedClaim.contactPhone}</p>
                                </div>
                            </div>

                            {/* Proof Description */}
                            <div className="p-4 bg-slate-50 rounded-2xl">
                                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> Proof Description
                                </h3>
                                <p className="text-slate-700 text-sm leading-relaxed">{selectedClaim.proofDescription}</p>
                            </div>

                            {/* Proof Images */}
                            {selectedClaim.proofImages?.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-3">Proof Images</h3>
                                    <div className="flex gap-3 flex-wrap">
                                        {selectedClaim.proofImages.map((img, idx) => (
                                            <img
                                                key={idx}
                                                src={img}
                                                alt={`Proof ${idx + 1}`}
                                                className="w-24 h-24 object-cover rounded-xl border border-slate-200 cursor-pointer hover:scale-105 transition"
                                                onClick={() => window.open(img, "_blank")}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* =================== ADMIN ACTIONS =================== */}

                            {/* Action 1: PENDING — Approve or Reject */}
                            {selectedClaim.status === "pending" && (
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Admin Actions</p>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            Review Notes (Optional — shown to claimant if approved)
                                        </label>
                                        <textarea
                                            value={reviewNotes}
                                            onChange={(e) => setReviewNotes(e.target.value)}
                                            placeholder="Add any notes about this approval..."
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 min-h-[80px]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            Rejection Reason (Required if rejecting)
                                        </label>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Explain why the claim is being rejected..."
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 min-h-[80px]"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleApprove}
                                            disabled={processing}
                                            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            {processing ? "Processing..." : "Approve Claim"}
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            disabled={processing}
                                            className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <XCircle className="w-5 h-5" />
                                            {processing ? "Processing..." : "Reject Claim"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ✅ Action 2: APPROVED — Mark as Delivered to SAO */}
                            {selectedClaim.status === "approved" && (
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">SAO Drop-off Action</p>
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-800">
                                        <p className="font-bold mb-1">Next Step: SAO Drop-off</p>
                                        <p>Once the finder physically drops off the item at the SAO, mark it below to notify the claimant.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            SAO Pickup Instructions (shown to claimant)
                                        </label>
                                        <textarea
                                            value={saoNotes}
                                            onChange={(e) => setSaoNotes(e.target.value)}
                                            rows={3}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            Pickup Deadline (days from today)
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={30}
                                            value={pickupDeadlineDays}
                                            onChange={(e) => setPickupDeadlineDays(e.target.value)}
                                            className="w-32 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-bold"
                                        />
                                        <span className="ml-3 text-sm text-slate-500">days</span>
                                    </div>
                                    <button
                                        onClick={handleMarkDeliveredToSAO}
                                        disabled={processing}
                                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <MapPin className="w-5 h-5" />
                                        {processing ? "Updating..." : "Mark as Delivered to SAO"}
                                    </button>
                                </div>
                            )}

                            {/* ✅ Action 3: DELIVERED_TO_SAO — Mark as Picked Up */}
                            {selectedClaim.status === "delivered_to_sao" && (
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">SAO Pickup Confirmation</p>

                                    {/* SAO info recap */}
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-1">
                                        <p className="text-sm font-bold text-blue-800">Item currently at SAO</p>
                                        {selectedClaim.saoNotes && (
                                            <p className="text-sm text-blue-700">{selectedClaim.saoNotes}</p>
                                        )}
                                        {selectedClaim.saoDeliveredAt && (
                                            <p className="text-xs text-blue-500">
                                                Delivered: {new Date(selectedClaim.saoDeliveredAt).toLocaleString()}
                                            </p>
                                        )}
                                    </div>

                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
                                        <p className="font-bold mb-1">⚠️ Confirm Before Clicking</p>
                                        <p>Only mark as picked up after you have verified the claimant's ID and physically handed over the item at the SAO counter.</p>
                                    </div>
                                    <button
                                        onClick={handleMarkPickedUp}
                                        disabled={processing}
                                        className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Star className="w-5 h-5" />
                                        {processing ? "Updating..." : "Confirm Item Picked Up at SAO"}
                                    </button>
                                </div>
                            )}

                            {/* Review History (non-pending claims) */}
                            {selectedClaim.status !== "pending" && (
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <h3 className="font-bold text-slate-900 mb-3">Review History</h3>
                                    <div className="space-y-1.5">
                                        {selectedClaim.reviewedBy && (
                                            <p className="text-sm text-slate-600">
                                                <span className="font-medium">Reviewed by:</span> {selectedClaim.reviewedBy?.name || "Unknown"}
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
                                                <span className="font-medium">Rejection reason:</span> {selectedClaim.rejectionReason}
                                            </p>
                                        )}
                                        {selectedClaim.saoDeliveredBy && (
                                            <p className="text-sm text-blue-600">
                                                <span className="font-medium">SAO delivery confirmed by:</span> {selectedClaim.saoDeliveredBy?.name}
                                            </p>
                                        )}
                                        {selectedClaim.pickedUpConfirmedBy && (
                                            <p className="text-sm text-purple-600">
                                                <span className="font-medium">Pickup confirmed by:</span> {selectedClaim.pickedUpConfirmedBy?.name}
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