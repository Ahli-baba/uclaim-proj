import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import {
    Clock,
    CheckCircle,
    XCircle,
    Package,
    ChevronRight,
    AlertCircle
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
                    description: "An admin is reviewing your claim"
                };
            case "approved":
                return {
                    icon: CheckCircle,
                    color: "text-emerald-600",
                    bg: "bg-emerald-50",
                    border: "border-emerald-200",
                    label: "Approved!",
                    description: "Your claim was approved! Check your email for next steps"
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
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

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
                    <p className="text-gray-500 mt-2">
                        Track the status of your item claims
                    </p>
                </div>

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

                            return (
                                <div
                                    key={claim._id}
                                    className="bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-lg transition"
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
                                                <div className="w-full h-full flex items-center justify-center text-3xl">
                                                    📦
                                                </div>
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
                                                        {claim.item?.type} • {claim.item?.category} • {claim.item?.location}
                                                    </p>
                                                </div>
                                                <div className={`px-4 py-2 rounded-full border flex items-center gap-2 flex-shrink-0 ${status.bg} ${status.border}`}>
                                                    <StatusIcon className={`w-4 h-4 ${status.color}`} />
                                                    <span className={`text-sm font-bold ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                                                <strong>Your proof:</strong> {claim.proofDescription}
                                            </p>

                                            {claim.adminNotes && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                                                    <p className="text-sm text-gray-600">
                                                        <strong>Admin Note:</strong> {claim.adminNotes}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                                <div className="text-xs text-gray-400">
                                                    Submitted {formatDate(claim.createdAt)}
                                                    {claim.reviewDate && (
                                                        <> • Reviewed {formatDate(claim.reviewDate)}</>
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