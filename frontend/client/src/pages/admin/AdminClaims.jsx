import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import {
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    Search,
    Filter,
    User,
    Package,
    MessageSquare
} from "lucide-react";

function AdminClaims() {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [reviewNotes, setReviewNotes] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchClaims();
    }, [filter]);

    const fetchClaims = async () => {
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

    const handleApprove = async () => {
        if (!selectedClaim) return;
        setProcessing(true);
        try {
            await api.approveClaim(selectedClaim._id, reviewNotes);
            alert("Claim approved successfully!");
            setSelectedClaim(null);
            setReviewNotes("");
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
            setSelectedClaim(null);
            setRejectionReason("");
            fetchClaims();
        } catch (err) {
            alert("Failed to reject claim: " + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "approved": return "bg-green-100 text-green-700 border-green-200";
            case "rejected": return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "pending": return <Clock className="w-4 h-4" />;
            case "approved": return <CheckCircle className="w-4 h-4" />;
            case "rejected": return <XCircle className="w-4 h-4" />;
            default: return null;
        }
    };

    const filteredClaims = claims.filter(claim => {
        if (filter === "all") return true;
        return claim.status === filter;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Claim Requests</h1>
                    <p className="text-slate-500 mt-1">Review and manage item claims from users</p>
                </div>
                <div className="flex gap-2">
                    {["all", "pending", "approved", "rejected"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${filter === status
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                }`}
                        >
                            {status}
                            {status !== "all" && (
                                <span className="ml-2 px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-xs">
                                    {claims.filter(c => c.status === status).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Claims List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Item</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Claimant</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Submitted</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Actions</th>
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
                                        <div>
                                            <p className="font-medium text-slate-900">{claim.claimant?.name}</p>
                                            <p className="text-sm text-slate-500">{claim.claimant?.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {new Date(claim.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(claim.status)}`}>
                                            {getStatusIcon(claim.status)}
                                            {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                                        </span>
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
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Claim Details</h2>
                                <p className="text-sm text-slate-500">
                                    Submitted on {new Date(selectedClaim.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedClaim(null);
                                    setReviewNotes("");
                                    setRejectionReason("");
                                }}
                                className="p-2 hover:bg-slate-100 rounded-full transition"
                            >
                                <XCircle className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Item Info */}
                            <div className="p-4 bg-slate-50 rounded-2xl">
                                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Item Information
                                </h3>
                                <div className="flex items-center gap-3">
                                    <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center text-2xl">
                                        {selectedClaim.item?.images?.[0] ? "📷" : "📦"}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{selectedClaim.item?.title}</p>
                                        <p className="text-sm text-slate-500">{selectedClaim.item?.location}</p>
                                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium capitalize ${selectedClaim.item?.type === "lost" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                            }`}>
                                            {selectedClaim.item?.type}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Claimant Info */}
                            <div className="p-4 bg-slate-50 rounded-2xl">
                                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Claimant Information
                                </h3>
                                <div className="space-y-2">
                                    <p className="text-sm"><span className="font-medium">Name:</span> {selectedClaim.claimant?.name}</p>
                                    <p className="text-sm"><span className="font-medium">Email:</span> {selectedClaim.contactEmail}</p>
                                    <p className="text-sm"><span className="font-medium">Phone:</span> {selectedClaim.contactPhone}</p>
                                </div>
                            </div>

                            {/* Proof Description */}
                            <div className="p-4 bg-slate-50 rounded-2xl">
                                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Proof Description
                                </h3>
                                <p className="text-slate-700 text-sm leading-relaxed">
                                    {selectedClaim.proofDescription}
                                </p>
                            </div>

                            {/* Proof Images */}
                            {selectedClaim.proofImages && selectedClaim.proofImages.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-3">Proof Images</h3>
                                    <div className="flex gap-3">
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

                            {/* Admin Actions - Only for pending claims */}
                            {selectedClaim.status === "pending" && (
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            Review Notes (Optional - shown to claimant if approved)
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

                            {/* Reviewed Info */}
                            {selectedClaim.status !== "pending" && (
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <h3 className="font-bold text-slate-900 mb-2">Review Information</h3>
                                    <p className="text-sm text-slate-600">
                                        <span className="font-medium">Reviewed by:</span> {selectedClaim.reviewedBy?.name || "Unknown"}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        <span className="font-medium">Date:</span> {selectedClaim.reviewedAt ? new Date(selectedClaim.reviewedAt).toLocaleString() : "N/A"}
                                    </p>
                                    {selectedClaim.reviewNotes && (
                                        <p className="text-sm text-slate-600 mt-2">
                                            <span className="font-medium">Notes:</span> {selectedClaim.reviewNotes}
                                        </p>
                                    )}
                                    {selectedClaim.rejectionReason && (
                                        <p className="text-sm text-red-600 mt-2">
                                            <span className="font-medium">Rejection Reason:</span> {selectedClaim.rejectionReason}
                                        </p>
                                    )}
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