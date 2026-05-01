import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import {
    Clock,
    CheckCircle,
    XCircle,
    Package,
    ChevronRight,
    AlertCircle,
    MapPin,
    Star
} from "lucide-react";

function MyClaims() {
    const navigate = useNavigate();
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("");

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            setUserName(JSON.parse(savedUser).name.split(" ")[0]);
        }
        fetchClaims();
    }, []);

    const fetchClaims = async () => {
        try {
            const data = await api.getMyClaims();
            setClaims(data);
        } catch (err) {
            console.error("Failed to fetch claims:", err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case "pending":
                return {
                    icon: Clock,
                    color: "text-amber-600",
                    bg: "bg-amber-50",
                    border: "border-amber-200",
                    label: "Pending Review",
                    description: "An admin is reviewing your claim."
                };
            case "approved":
                return {
                    icon: CheckCircle,
                    color: "text-emerald-600",
                    bg: "bg-emerald-50",
                    border: "border-emerald-200",
                    label: "Approved",
                    description: "Your claim was approved! The finder will drop off your item at the SAO."
                };
            case "rejected":
                return {
                    icon: XCircle,
                    color: "text-red-600",
                    bg: "bg-red-50",
                    border: "border-red-200",
                    label: "Rejected",
                    description: "Your claim was not approved. You may submit a new claim with additional proof."
                };
            // ✅ NEW: SAO statuses
            case "delivered_to_sao":
                return {
                    icon: MapPin,
                    color: "text-blue-600",
                    bg: "bg-blue-50",
                    border: "border-blue-200",
                    label: "Ready for Pickup at SAO",
                    description: "Your item is now at the Student Affairs Office (SAO). Please visit SAO to pick it up and bring a valid ID."
                };
            case "picked_up":
                return {
                    icon: Star,
                    color: "text-purple-600",
                    bg: "bg-purple-50",
                    border: "border-purple-200",
                    label: "Picked Up",
                    description: "You have successfully picked up your item from SAO. Case closed!"
                };
            default:
                return {
                    icon: AlertCircle,
                    color: "text-gray-600",
                    bg: "bg-gray-50",
                    border: "border-gray-200",
                    label: status,
                    description: ""
                };
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    // ✅ Count claims at SAO to show top alert
    const saoReadyClaims = claims.filter(c => c.status === "delivered_to_sao");
    const approvedClaims = claims.filter(c => c.status === "approved");

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="text-sm text-blue-600 font-medium mb-4 hover:underline flex items-center gap-1"
                    >
                        ← Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">My Claims</h1>
                    <p className="text-gray-500 mt-2">Track the status of your item claims</p>
                </div>

                {/* ✅ Approved Banner - claim approved, waiting for item to arrive at SAO */}
                {approvedClaims.length > 0 && (
                    <div className="mb-4 p-5 bg-emerald-500 text-white rounded-3xl flex items-start gap-4 shadow-lg shadow-emerald-200">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="font-black text-lg">
                                {approvedClaims.length === 1
                                    ? "Your claim was approved! 🎉"
                                    : `${approvedClaims.length} claims were approved! 🎉`}
                            </p>
                            <p className="text-emerald-100 text-sm mt-1">
                                The finder will drop off your item at the SAO office.
                                You'll be notified again once it's ready for pickup — stay tuned!
                            </p>
                        </div>
                    </div>
                )}

                {/* ✅ SAO Alert Banner - shown when item(s) are ready for pickup */}
                {saoReadyClaims.length > 0 && (
                    <div className="mb-6 p-5 bg-blue-600 text-white rounded-3xl flex items-start gap-4 shadow-lg shadow-blue-200">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="font-black text-lg">
                                {saoReadyClaims.length === 1
                                    ? "Your item is ready for pickup at SAO!"
                                    : `${saoReadyClaims.length} items are ready for pickup at SAO!`}
                            </p>
                            <p className="text-blue-100 text-sm mt-1">
                                Please visit the Student Affairs Office (SAO) with a valid ID to collect your item(s).
                            </p>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : claims.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                            📋
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No claims yet</h3>
                        <p className="text-gray-500 mb-6">You haven't submitted any item claims yet.</p>
                        <button
                            onClick={() => navigate("/search")}
                            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition"
                        >
                            Search Items to Claim
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {claims.map((claim) => {
                            const status = getStatusConfig(claim.status);
                            const StatusIcon = status.icon;
                            const isSAOReady = claim.status === "delivered_to_sao";
                            const isPickedUp = claim.status === "picked_up";

                            return (
                                <div
                                    key={claim._id}
                                    className={`bg-white rounded-3xl border p-6 hover:shadow-lg transition ${isSAOReady ? "border-blue-300 shadow-md shadow-blue-50" : "border-gray-100"}`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Item Image */}
                                        <div className="w-24 h-24 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                                            {claim.item?.images?.[0] ? (
                                                <img
                                                    src={claim.item.images[0]}
                                                    alt={claim.item.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-lg">
                                                        {claim.item?.title || "Unknown Item"}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 capitalize mt-1">
                                                        {claim.item?.type} • {claim.item?.location}
                                                    </p>
                                                </div>
                                                <div className={`px-4 py-2 rounded-full border flex items-center gap-2 flex-shrink-0 ${status.bg} ${status.border}`}>
                                                    <StatusIcon className={`w-4 h-4 ${status.color}`} />
                                                    <span className={`text-sm font-bold ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Status description */}
                                            <p className={`text-sm mt-2 font-medium ${status.color}`}>
                                                {status.description}
                                            </p>

                                            {/* ✅ SAO Pickup Details Box */}
                                            {isSAOReady && (
                                                <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
                                                    <p className="text-sm font-black text-blue-800 uppercase tracking-wide">
                                                        📍 SAO Pickup Information
                                                    </p>
                                                    {claim.saoNotes && (
                                                        <p className="text-sm text-blue-700">{claim.saoNotes}</p>
                                                    )}
                                                    {claim.saoDeliveredAt && (
                                                        <p className="text-xs text-blue-500">
                                                            Delivered to SAO on {formatDate(claim.saoDeliveredAt)}
                                                        </p>
                                                    )}
                                                    {claim.item?.saoPickupDeadline && (
                                                        <p className="text-xs font-bold text-red-500">
                                                            ⚠️ Pickup deadline: {formatDate(claim.item.saoPickupDeadline)}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* ✅ Picked Up confirmation */}
                                            {isPickedUp && (
                                                <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-2xl">
                                                    <p className="text-sm text-purple-700 font-medium">
                                                        ✅ Picked up from SAO on {formatDate(claim.pickedUpAt)}
                                                    </p>
                                                </div>
                                            )}

                                            <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                                                <strong>Your proof:</strong> {claim.proofDescription}
                                            </p>

                                            {claim.reviewNotes && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                                                    <p className="text-sm text-gray-600">
                                                        <strong>Admin Note:</strong> {claim.reviewNotes}
                                                    </p>
                                                </div>
                                            )}

                                            {claim.rejectionReason && (
                                                <div className="mt-3 p-3 bg-red-50 rounded-xl">
                                                    <p className="text-sm text-red-600">
                                                        <strong>Rejection Reason:</strong> {claim.rejectionReason}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                                <div className="text-xs text-gray-400">
                                                    Submitted {formatDate(claim.createdAt)}
                                                    {claim.reviewedAt && (
                                                        <> • Reviewed {formatDate(claim.reviewedAt)}</>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => navigate(`/item/${claim.item?._id}`)}
                                                    className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline"
                                                >
                                                    View Item <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyClaims;