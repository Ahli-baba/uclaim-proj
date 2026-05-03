import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../services/api";
import { useSettings } from "../../contexts/SettingsContext";
import {
    ArrowLeft, MapPin, Calendar, User, Tag, X,
    Upload, CheckCircle, Clock, Phone, Mail, Star,
    ChevronRight, Package, MoreVertical, Pencil, Trash2,
    Flag, Share2, AlertTriangle, Check
} from "lucide-react";

/* ─── Info card ──────────────────────────────────────────────────────────────── */
const InfoCard = ({ icon, label, value }) => (
    <div className="flex items-start gap-4 p-4 bg-[#F5F6F8] rounded-2xl border border-gray-100">
        <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 border border-gray-100">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="font-bold text-[#001F3F] text-sm">{value}</p>
        </div>
    </div>
);

/* ─── Kebab Menu ─────────────────────────────────────────────────────────────── */
const KebabMenu = ({ isMyItem, onEdit, onDelete, onReport, onShare }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const MenuItem = ({ icon, label, onClick, danger }) => (
        <button
            onClick={() => { onClick(); setOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors rounded-xl
                ${danger
                    ? "text-red-500 hover:bg-red-50"
                    : "text-[#001F3F] hover:bg-[#F5F6F8]"
                }`}
        >
            {icon}
            {label}
        </button>
    );

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(prev => !prev)}
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all border
                    ${open
                        ? "bg-[#001F3F] text-white border-[#001F3F] shadow-lg"
                        : "bg-white text-gray-400 border-gray-200 hover:bg-[#F5F6F8] hover:text-[#001F3F]"
                    }`}
            >
                <MoreVertical size={16} />
            </button>

            {open && (
                <div className="absolute right-0 top-11 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-black/8 z-30 p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    {isMyItem ? (
                        <>
                            <MenuItem
                                icon={<Pencil size={15} />}
                                label="Edit Post"
                                onClick={onEdit}
                            />
                            <div className="my-1 border-t border-gray-100" />
                            <MenuItem
                                icon={<Trash2 size={15} />}
                                label="Delete Post"
                                onClick={onDelete}
                                danger
                            />
                        </>
                    ) : (
                        <>
                            <MenuItem
                                icon={<Share2 size={15} />}
                                label="Share Item"
                                onClick={onShare}
                            />
                            <div className="my-1 border-t border-gray-100" />
                            <MenuItem
                                icon={<Flag size={15} />}
                                label="Report Post"
                                onClick={onReport}
                                danger
                            />
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

/* ─── Claim Tracker ──────────────────────────────────────────────────────────── */
const ClaimTracker = ({ existingClaim, formatDate }) => {
    if (!existingClaim) return null;

    const status = existingClaim.status;

    const steps = [
        {
            key: "submitted",
            label: "Claim submitted",
            time: formatDate(existingClaim.createdAt),
            isDone: true,
            isActive: false,
            isRejected: false,
        },
        {
            key: "reviewing",
            label: "Under admin review",
            time: status === "pending" ? "Waiting for decision…" : formatDate(existingClaim.reviewedAt),
            isDone: status !== "pending",
            isActive: status === "pending",
            isRejected: false,
        },
        {
            key: "decision",
            label: status === "rejected" ? "Claim rejected" : status === "pending" ? "Decision pending" : "Claim approved",
            time: status === "pending" ? null : formatDate(existingClaim.reviewedAt),
            isDone: status === "approved" || status === "picked_up",
            isActive: false,
            isRejected: status === "rejected",
            isPending: status === "pending",
            note: status === "rejected"
                ? (existingClaim.rejectionReason || "Your claim was not approved.")
                : status !== "pending" && existingClaim.reviewNotes
                    ? existingClaim.reviewNotes
                    : null,
        },
        {
            key: "pickup",
            label: "Ready for pickup at SAO",
            time: status === "approved"
                ? "Bring a valid school ID"
                : status === "picked_up"
                    ? formatDate(existingClaim.pickedUpAt)
                    : null,
            isDone: status === "picked_up",
            isActive: status === "approved",
            isRejected: false,
            isPending: status === "pending",
            note: status === "approved"
                ? "Visit the SAO office to collect your item."
                : null,
        },
        {
            key: "collected",
            label: "Item collected",
            time: status === "picked_up" ? formatDate(existingClaim.pickedUpAt) : null,
            isDone: status === "picked_up",
            isActive: false,
            isRejected: false,
            isPending: status !== "picked_up",
        },
    ];

    const visibleSteps = status === "rejected" ? steps.slice(0, 3) : steps;

    const badgeMap = {
        pending: { label: "Pending review", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
        approved: { label: "Approved", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
        rejected: { label: "Rejected", bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
        picked_up: { label: "Completed", bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
    };
    const badge = badgeMap[status] || badgeMap.pending;

    return (
        <div className="mt-8 rounded-2xl border-2 border-[#00A8E8]/25 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#F5F6F8] border-b border-gray-100">
                <div>
                    <h3 className="text-sm font-black text-[#001F3F]">Your Claim Status</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                        #{existingClaim._id?.slice(-8).toUpperCase()}
                    </p>
                </div>
                <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                    {badge.label}
                </span>
            </div>

            {/* Timeline */}
            <div className="px-6 py-5 bg-white">
                {visibleSteps.map((step, idx) => {
                    const isLast = idx === visibleSteps.length - 1;
                    return (
                        <div key={step.key} className="flex gap-4">
                            {/* Dot + connector */}
                            <div className="flex flex-col items-center">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${step.isRejected ? "bg-red-50     border-red-300"
                                    : step.isDone ? "bg-emerald-50 border-emerald-300"
                                        : step.isActive ? "bg-amber-50   border-amber-300"
                                            : "bg-gray-50 border-gray-200"
                                    }`}>
                                    {step.isRejected ? (
                                        <X size={11} className="text-red-500" />
                                    ) : step.isDone ? (
                                        <CheckCircle size={11} className="text-emerald-500" />
                                    ) : step.isActive ? (
                                        <Clock size={11} className="text-amber-500" />
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                                    )}
                                </div>
                                {!isLast && (
                                    <div className={`w-0.5 flex-1 my-1 min-h-[20px] ${step.isDone ? "bg-emerald-200" : "bg-gray-100"}`} />
                                )}
                            </div>

                            {/* Content */}
                            <div className={`flex-1 ${isLast ? "pb-0" : "pb-5"}`}>
                                <p className={`text-sm font-bold ${step.isRejected ? "text-red-600"
                                    : step.isDone ? "text-[#001F3F]"
                                        : step.isActive ? "text-amber-600"
                                            : "text-gray-300"
                                    }`}>
                                    {step.label}
                                </p>
                                {step.time && (
                                    <p className={`text-[11px] mt-0.5 ${step.isRejected || step.isDone || step.isActive
                                        ? "text-gray-400"
                                        : "text-gray-200"
                                        }`}>
                                        {step.time}
                                    </p>
                                )}
                                {step.note && (
                                    <p className={`mt-2 text-xs rounded-xl px-3 py-2.5 leading-relaxed ${step.isRejected
                                        ? "bg-red-50 text-red-500"
                                        : "bg-[#F5F6F8] text-gray-500"
                                        }`}>
                                        {step.note}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ─── Finder Tracker ─────────────────────────────────────────────────────────── */
const FinderTracker = ({ existingFinderReport, formatDate }) => {
    if (!existingFinderReport) return null;

    const status = existingFinderReport.status;

    const steps = [
        {
            key: "submitted",
            label: "Finder report submitted",
            time: formatDate(existingFinderReport.createdAt),
            isDone: true,
            isActive: false,
            isRejected: false,
        },
        {
            key: "reviewing",
            label: "Admin verifying report",
            time: status === "pending" ? "Waiting for admin…" : formatDate(existingFinderReport.reviewedAt),
            isDone: status !== "pending",
            isActive: status === "pending",
            isRejected: false,
        },
        {
            key: "decision",
            label: status === "rejected"
                ? "Report declined"
                : status === "pending"
                    ? "Decision pending"
                    : "Item confirmed at SAO",
            time: status === "pending" ? null : formatDate(existingFinderReport.reviewedAt),
            isDone: status === "approved" || status === "picked_up",
            isActive: false,
            isRejected: status === "rejected",
            isPending: status === "pending",
            note: status === "rejected"
                ? (existingFinderReport.rejectionReason || "Your report was not approved.")
                : status !== "pending" && existingFinderReport.reviewNotes
                    ? existingFinderReport.reviewNotes
                    : null,
        },
        {
            key: "owner_notified",
            label: "Owner notified to claim",
            time: status === "approved" || status === "picked_up"
                ? "Owner has been emailed"
                : null,
            isDone: status === "approved" || status === "picked_up",
            isActive: false,
            isRejected: false,
            isPending: status === "pending",
        },
        {
            key: "collected",
            label: "Owner collected the item",
            time: status === "picked_up" ? formatDate(existingFinderReport.pickedUpAt) : null,
            isDone: status === "picked_up",
            isActive: false,
            isRejected: false,
            isPending: status !== "picked_up",
            note: status === "picked_up"
                ? "Thanks for being a good samaritan! 🎉"
                : null,
        },
    ];

    const visibleSteps = status === "rejected" ? steps.slice(0, 3) : steps;

    const badgeMap = {
        pending: { label: "Pending review", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
        approved: { label: "Item at SAO", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
        rejected: { label: "Report declined", bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
        picked_up: { label: "Owner collected", bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
    };
    const badge = badgeMap[status] || badgeMap.pending;

    return (
        <div className="mt-8 rounded-2xl border-2 border-emerald-300/40 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-50/60 border-b border-emerald-100">
                <div>
                    <h3 className="text-sm font-black text-[#001F3F]">Your Finder Report Status</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                        #{existingFinderReport._id?.slice(-8).toUpperCase()}
                    </p>
                </div>
                <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                    {badge.label}
                </span>
            </div>

            {/* Timeline */}
            <div className="px-6 py-5 bg-white">
                {visibleSteps.map((step, idx) => {
                    const isLast = idx === visibleSteps.length - 1;
                    return (
                        <div key={step.key} className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${step.isRejected ? "bg-red-50 border-red-300"
                                    : step.isDone ? "bg-emerald-50 border-emerald-300"
                                        : step.isActive ? "bg-amber-50 border-amber-300"
                                            : "bg-gray-50 border-gray-200"
                                    }`}>
                                    {step.isRejected ? (
                                        <X size={11} className="text-red-500" />
                                    ) : step.isDone ? (
                                        <CheckCircle size={11} className="text-emerald-500" />
                                    ) : step.isActive ? (
                                        <Clock size={11} className="text-amber-500" />
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                                    )}
                                </div>
                                {!isLast && (
                                    <div className={`w-0.5 flex-1 my-1 min-h-[20px] ${step.isDone ? "bg-emerald-200" : "bg-gray-100"}`} />
                                )}
                            </div>

                            <div className={`flex-1 ${isLast ? "pb-0" : "pb-5"}`}>
                                <p className={`text-sm font-bold ${step.isRejected ? "text-red-600"
                                    : step.isDone ? "text-[#001F3F]"
                                        : step.isActive ? "text-amber-600"
                                            : "text-gray-300"
                                    }`}>
                                    {step.label}
                                </p>
                                {step.time && (
                                    <p className={`text-[11px] mt-0.5 ${step.isRejected || step.isDone || step.isActive ? "text-gray-400" : "text-gray-200"
                                        }`}>
                                        {step.time}
                                    </p>
                                )}
                                {step.note && (
                                    <p className={`mt-2 text-xs rounded-xl px-3 py-2.5 leading-relaxed ${step.isRejected ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"
                                        }`}>
                                        {step.note}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ─── Owner Finder Tracker ───────────────────────────────────────────────────── */
const OwnerFinderTracker = ({ item }) => {
    if (!item) return null;
    const isAtSAO = item.isAtSAO;
    const isResolved = item.status === "claimed" || item.status === "resolved";
    if (!isAtSAO && !isResolved) return null;

    const steps = [
        {
            key: "lost",
            label: "You reported this item as lost",
            isDone: true,
            isActive: false,
        },
        {
            key: "found",
            label: "Someone found your item",
            sub: "A finder submitted a report and turned it over",
            isDone: true,
            isActive: false,
        },
        {
            key: "sao",
            label: "Item confirmed at SAO",
            sub: isAtSAO ? "Your item is at the Student Affairs Office" : null,
            isDone: isAtSAO || isResolved,
            isActive: false,
        },
        {
            key: "claim",
            label: isResolved ? "You collected your item" : "Ready for you to claim",
            sub: isResolved
                ? "Item successfully returned to you 🎉"
                : "Visit the SAO with a valid school ID to pick it up",
            isDone: isResolved,
            isActive: isAtSAO && !isResolved,
        },
    ];

    return (
        <div className="mt-8 rounded-2xl border-2 border-[#00A8E8]/25 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-sky-50/60 border-b border-sky-100">
                <div>
                    <h3 className="text-sm font-black text-[#001F3F]">Your Item Was Found!</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Here's the current status of your lost item</p>
                </div>
                <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full border ${isResolved
                    ? "bg-purple-50 text-purple-600 border-purple-200"
                    : "bg-emerald-50 text-emerald-600 border-emerald-200"
                    }`}>
                    {isResolved ? "Returned to you" : "At SAO — go claim it"}
                </span>
            </div>

            <div className="px-6 py-5 bg-white">
                {steps.map((step, idx) => {
                    const isLast = idx === steps.length - 1;
                    return (
                        <div key={step.key} className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${step.isDone ? "bg-emerald-50 border-emerald-300"
                                    : step.isActive ? "bg-amber-50 border-amber-300"
                                        : "bg-gray-50 border-gray-200"
                                    }`}>
                                    {step.isDone ? (
                                        <CheckCircle size={11} className="text-emerald-500" />
                                    ) : step.isActive ? (
                                        <Clock size={11} className="text-amber-500" />
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                                    )}
                                </div>
                                {!isLast && (
                                    <div className={`w-0.5 flex-1 my-1 min-h-[20px] ${step.isDone ? "bg-emerald-200" : "bg-gray-100"}`} />
                                )}
                            </div>

                            <div className={`flex-1 ${isLast ? "pb-0" : "pb-5"}`}>
                                <p className={`text-sm font-bold ${step.isDone ? "text-[#001F3F]"
                                    : step.isActive ? "text-amber-600"
                                        : "text-gray-300"
                                    }`}>
                                    {step.label}
                                </p>
                                {step.sub && (
                                    <p className={`mt-1.5 text-xs rounded-xl px-3 py-2.5 leading-relaxed ${step.isActive
                                        ? "bg-amber-50 text-amber-600"
                                        : step.isDone
                                            ? "bg-[#F5F6F8] text-gray-500"
                                            : "text-gray-300"
                                        }`}>
                                        {step.sub}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ─── Found Item Owner Tracker (shown to User II who posted the found item) ──── */
const FoundItemOwnerTracker = ({ item }) => {
    if (!item) return null;
    const isAtSAO = item.isAtSAO;
    const isClaimed = item.status === "claimed" || item.status === "resolved";
    // Only show if there's something happening (claim activity)
    if (!isAtSAO && !isClaimed) return null;

    const steps = [
        {
            key: "reported",
            label: "You reported this item as found",
            sub: "Thank you for turning it over to SAO",
            isDone: true,
            isActive: false,
        },
        {
            key: "claimed",
            label: "Someone submitted a claim",
            sub: "A user has submitted a claim for this item",
            isDone: true,
            isActive: false,
        },
        {
            key: "approved",
            label: "Claim approved by admin",
            sub: isAtSAO ? "Admin has verified and approved the claim" : null,
            isDone: isAtSAO || isClaimed,
            isActive: false,
        },
        {
            key: "collected",
            label: isClaimed ? "Owner collected the item" : "Waiting for owner to collect",
            sub: isClaimed
                ? "The item has been successfully returned to its owner 🎉"
                : "The owner has been notified to visit SAO",
            isDone: isClaimed,
            isActive: isAtSAO && !isClaimed,
        },
    ];

    return (
        <div className="mt-8 rounded-2xl border-2 border-emerald-300/40 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-50/60 border-b border-emerald-100">
                <div>
                    <h3 className="text-sm font-black text-[#001F3F]">Claim Status for Your Found Report</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Here's what's happening with the item you found</p>
                </div>
                <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full border ${isClaimed
                    ? "bg-purple-50 text-purple-600 border-purple-200"
                    : "bg-amber-50 text-amber-600 border-amber-200"
                    }`}>
                    {isClaimed ? "Successfully returned" : "Waiting for pickup"}
                </span>
            </div>

            <div className="px-6 py-5 bg-white">
                {steps.map((step, idx) => {
                    const isLast = idx === steps.length - 1;
                    return (
                        <div key={step.key} className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${step.isDone ? "bg-emerald-50 border-emerald-300"
                                    : step.isActive ? "bg-amber-50 border-amber-300"
                                        : "bg-gray-50 border-gray-200"
                                    }`}>
                                    {step.isDone ? (
                                        <CheckCircle size={11} className="text-emerald-500" />
                                    ) : step.isActive ? (
                                        <Clock size={11} className="text-amber-500" />
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                                    )}
                                </div>
                                {!isLast && (
                                    <div className={`w-0.5 flex-1 my-1 min-h-[20px] ${step.isDone ? "bg-emerald-200" : "bg-gray-100"}`} />
                                )}
                            </div>

                            <div className={`flex-1 ${isLast ? "pb-0" : "pb-5"}`}>
                                <p className={`text-sm font-bold ${step.isDone ? "text-[#001F3F]"
                                    : step.isActive ? "text-amber-600"
                                        : "text-gray-300"
                                    }`}>
                                    {step.label}
                                </p>
                                {step.sub && (
                                    <p className={`mt-1.5 text-xs rounded-xl px-3 py-2.5 leading-relaxed ${step.isActive
                                        ? "bg-amber-50 text-amber-600"
                                        : step.isDone
                                            ? "bg-[#F5F6F8] text-gray-500"
                                            : "text-gray-300"
                                        }`}>
                                        {step.sub}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ─── Main Component ─────────────────────────────────────────────────────────── */
function ItemDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { settings } = useSettings();
    const { siteName } = settings;

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);

    const [existingClaim, setExistingClaim] = useState(null);
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [claimForm, setClaimForm] = useState({ proofDescription: "", contactPhone: "", contactEmail: "" });
    const [claimProofs, setClaimProofs] = useState([]);
    const [submittingClaim, setSubmittingClaim] = useState(false);
    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const [showDetails, setShowDetails] = useState(true);

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ title: "", description: "", location: "", category: "", date: "" });
    const [editImages, setEditImages] = useState([]);
    const [submittingEdit, setSubmittingEdit] = useState(false);

    // Delete confirm state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingItem, setDeletingItem] = useState(false);

    // Report modal state
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [reportDetails, setReportDetails] = useState("");
    const [submittingReport, setSubmittingReport] = useState(false);
    const [reportSubmitted, setReportSubmitted] = useState(false);

    // Finder report modal state
    const [showFinderModal, setShowFinderModal] = useState(false);
    const [finderForm, setFinderForm] = useState({ finderDescription: "", contactPhone: "", contactEmail: "" });
    const [finderProofs, setFinderProofs] = useState([]);
    const [submittingFinder, setSubmittingFinder] = useState(false);
    const [existingFinderReport, setExistingFinderReport] = useState(null);

    // Share toast
    const [showShareToast, setShowShareToast] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            const user = JSON.parse(savedUser);
            setClaimForm(prev => ({ ...prev, contactEmail: user.email || "" }));
            setFinderForm(prev => ({ ...prev, contactEmail: user.email || "" }));
        } else {
            navigate("/login", { state: { from: `/item/${id}` } });
        }
        fetchItemDetails();
        checkExistingClaim();
    }, [id, navigate]);

    const fetchItemDetails = async () => {
        try {
            setLoading(true);
            const data = await api.getItem(id);
            setItem(data);
            // Pre-fill edit form
            setEditForm({
                title: data.title || "",
                description: data.description || "",
                location: data.location || "",
                category: data.category || "",
                date: data.date ? new Date(data.date).toISOString().split("T")[0] : "",
            });
            setEditImages(data.images || []);
            // Auto-hide details when a tracker is visible
            const savedUser = localStorage.getItem("user");
            const currentUserId = savedUser ? JSON.parse(savedUser).id : null;
            const isOwner = data.reportedBy?._id === currentUserId;
            const isFoundItem = data.type === "found";
            const isLostItem = data.type === "lost";
            if (isOwner && isFoundItem && (data.isAtSAO || data.status === "claimed" || data.status === "resolved")) {
                setShowDetails(false);
            }
            if (isOwner && isLostItem && (data.isAtSAO || data.status === "claimed" || data.status === "resolved")) {
                setShowDetails(false);
            }
        } catch (err) {
            if (err.message.includes("401")) navigate("/login", { state: { from: `/item/${id}` } });
            else if (err.message.includes("404")) navigate("/search");
        } finally {
            setLoading(false);
        }
    };

    const checkExistingClaim = async () => {
        try {
            const myClaims = await api.getMyClaims();
            const existing = myClaims.find(c =>
                (c.item._id === id || c.item === id) && c.type !== "finder_report"
            );
            const existingFinder = myClaims.find(c =>
                (c.item._id === id || c.item === id) && c.type === "finder_report"
            );
            setExistingClaim(existing);
            setExistingFinderReport(existingFinder);
            if (existing || existingFinder) {
                setShowDetails(false);
            }
        } catch (_) { }
    };

    // ── Claim handlers ─────────────────────────────────────────────────────────
    const handleOpenClaimModal = () => setShowClaimModal(true);
    const handleCloseClaimModal = () => {
        setShowClaimModal(false);
        const savedUser = localStorage.getItem("user");
        const userEmail = savedUser ? JSON.parse(savedUser).email || "" : "";
        setClaimForm({ proofDescription: "", contactPhone: "", contactEmail: userEmail });
        setClaimProofs([]);
    };

    const handleProofUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + claimProofs.length > 3) { alert("Maximum 3 images allowed"); return; }
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => setClaimProofs(prev => [...prev, reader.result]);
            reader.readAsDataURL(file);
        });
    };

    const removeProof = (index) => setClaimProofs(prev => prev.filter((_, i) => i !== index));

    const handleSubmitClaim = async (e) => {
        e.preventDefault();
        if (!claimForm.proofDescription.trim()) { alert("Please provide proof of ownership description"); return; }
        if (!claimForm.contactPhone.trim()) { alert("Please provide contact phone number"); return; }
        try {
            setSubmittingClaim(true);
            await api.submitClaim({
                itemId: id,
                proofDescription: claimForm.proofDescription,
                contactPhone: claimForm.contactPhone,
                contactEmail: claimForm.contactEmail,
                proofImages: claimProofs
            });
            handleCloseClaimModal();
            checkExistingClaim();
            alert("Claim submitted successfully! An admin will review your request.");
        } catch (err) {
            alert(err.message || "Failed to submit claim. Please try again.");
        } finally {
            setSubmittingClaim(false);
        }
    };

    // ── Edit handlers ──────────────────────────────────────────────────────────
    const handleOpenEditModal = () => setShowEditModal(true);
    const handleCloseEditModal = () => {
        setShowEditModal(false);
        // Reset to original values
        setEditForm({
            title: item.title || "",
            description: item.description || "",
            location: item.location || "",
            category: item.category || "",
            date: item.date ? new Date(item.date).toISOString().split("T")[0] : "",
        });
        setEditImages(item.images || []);
    };

    const handleEditImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + editImages.length > 5) { alert("Maximum 5 images allowed"); return; }
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => setEditImages(prev => [...prev, reader.result]);
            reader.readAsDataURL(file);
        });
    };

    const removeEditImage = (index) => setEditImages(prev => prev.filter((_, i) => i !== index));

    const handleSubmitEdit = async (e) => {
        e.preventDefault();
        if (!editForm.title.trim()) { alert("Title is required"); return; }
        try {
            setSubmittingEdit(true);
            await api.updateItem(id, { ...editForm, images: editImages });
            handleCloseEditModal();
            fetchItemDetails();
        } catch (err) {
            alert(err.message || "Failed to update item. Please try again.");
        } finally {
            setSubmittingEdit(false);
        }
    };

    // ── Delete handlers ────────────────────────────────────────────────────────
    const handleDeleteItem = async () => {
        try {
            setDeletingItem(true);
            await api.deleteItem(id);
            navigate("/search");
        } catch (err) {
            alert(err.message || "Failed to delete item. Please try again.");
        } finally {
            setDeletingItem(false);
            setShowDeleteConfirm(false);
        }
    };

    // ── Share handler ──────────────────────────────────────────────────────────
    const handleShare = () => {
        const url = window.location.href;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                setShowShareToast(true);
                setTimeout(() => setShowShareToast(false), 3000);
            });
        } else {
            setShowShareToast(true);
            setTimeout(() => setShowShareToast(false), 3000);
        }
    };

    // ── Report handlers ────────────────────────────────────────────────────────
    const handleSubmitReport = async (e) => {
        e.preventDefault();
        if (!reportReason) { alert("Please select a reason"); return; }
        try {
            setSubmittingReport(true);
            // api.reportItem would be called here
            // await api.reportItem({ itemId: id, reason: reportReason, details: reportDetails });
            await new Promise(res => setTimeout(res, 800)); // simulated delay
            setReportSubmitted(true);
        } catch (err) {
            alert(err.message || "Failed to submit report.");
        } finally {
            setSubmittingReport(false);
        }
    };

    const handleCloseReportModal = () => {
        setShowReportModal(false);
        setReportReason("");
        setReportDetails("");
        setReportSubmitted(false);
    };

    // ── Finder Report handlers ─────────────────────────────────────────────────
    const handleOpenFinderModal = () => setShowFinderModal(true);
    const handleCloseFinderModal = () => {
        setShowFinderModal(false);
        const savedUser = localStorage.getItem("user");
        const userEmail = savedUser ? JSON.parse(savedUser).email || "" : "";
        setFinderForm({ finderDescription: "", contactPhone: "", contactEmail: userEmail });
        setFinderProofs([]);
    };

    const handleFinderProofUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + finderProofs.length > 3) { alert("Maximum 3 images allowed"); return; }
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => setFinderProofs(prev => [...prev, reader.result]);
            reader.readAsDataURL(file);
        });
    };

    const removeFinderProof = (index) => setFinderProofs(prev => prev.filter((_, i) => i !== index));

    const handleSubmitFinderReport = async (e) => {
        e.preventDefault();
        if (!finderForm.finderDescription.trim()) { alert("Please describe where/how you found the item"); return; }
        if (!finderForm.contactPhone.trim()) { alert("Please provide your contact phone number"); return; }
        try {
            setSubmittingFinder(true);
            await api.submitFinderReport({
                itemId: id,
                finderDescription: finderForm.finderDescription,
                contactPhone: finderForm.contactPhone,
                contactEmail: finderForm.contactEmail,
                proofImages: finderProofs
            });
            handleCloseFinderModal();
            checkExistingClaim();
            alert("Thank you! Please bring the item to the SAO office now so it can be returned to its owner.");
        } catch (err) {
            alert(err.message || "Failed to submit. Please try again.");
        } finally {
            setSubmittingFinder(false);
        }
    };

    // ── Utils ──────────────────────────────────────────────────────────────────
    const formatDate = (ds) => {
        if (!ds) return "N/A";
        return new Date(ds).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    };

    const getClaimStatusConfig = () => {
        if (!existingClaim) return null;
        const map = {
            pending: { text: "Claim Pending Review", bg: "bg-amber-50", text_c: "text-amber-600", border: "border-amber-200", icon: Clock },
            approved: { text: "Approved – Ready for Pickup at SAO", bg: "bg-emerald-50", text_c: "text-emerald-600", border: "border-emerald-200", icon: CheckCircle },
            rejected: { text: "Claim Rejected", bg: "bg-red-50", text_c: "text-red-600", border: "border-red-200", icon: X },
            picked_up: { text: "Picked Up from SAO ✓", bg: "bg-purple-50", text_c: "text-purple-600", border: "border-purple-200", icon: Star },
        };
        return map[existingClaim.status] || null;
    };

    const CATEGORIES = ["Electronics", "Documents", "Clothing", "Accessories", "Books", "Keys", "Bags", "Sports", "Other"];
    const REPORT_REASONS = [
        { value: "fake", label: "Fake or misleading post" },
        { value: "spam", label: "Spam or duplicate" },
        { value: "inappropriate", label: "Inappropriate content" },
        { value: "wrong_info", label: "Wrong information" },
        { value: "other", label: "Other" },
    ];

    /* ─── Loading ──────────────────────────────────────────────────────────── */
    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#001F3F] animate-pulse" />
                <p className="text-sm font-semibold text-gray-400">Loading item…</p>
            </div>
        </div>
    );

    if (!item) return (
        <div className="flex items-center justify-center flex-col gap-4 py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl">📦</div>
            <h2 className="text-xl font-bold text-[#001F3F]">Item not found</h2>
            <button onClick={() => navigate("/search")} className="text-[#00A8E8] font-bold hover:underline text-sm">
                Back to Search
            </button>
        </div>
    );

    const isLost = item.type === "lost";
    const isClaimed = item.status === "claimed";
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const isMyItem = item.reportedBy?._id === currentUser.id;
    const claimConfig = getClaimStatusConfig();
    const allImages = item.images || [];

    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">

            {/* Share toast */}
            {showShareToast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-[#001F3F] text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold animate-in fade-in slide-in-from-bottom-2">
                    <Check size={16} className="text-emerald-400" />
                    Link copied to clipboard!
                </div>
            )}

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-6 text-sm">
                <button
                    onClick={() => navigate("/search")}
                    className="flex items-center gap-1.5 text-gray-400 hover:text-[#00A8E8] transition-colors font-medium group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    Search Items
                </button>
                <ChevronRight size={14} className="text-gray-300" />
                <span className="font-semibold text-[#001F3F] truncate max-w-xs">{item.title}</span>
            </div>

            {/* ✅ Resolved banner — shown when item is resolved/claimed */}
            {(item.status === "resolved" || item.status === "claimed") && (
                <div className="mb-4 flex items-start gap-3 bg-purple-50 border border-purple-200 rounded-2xl px-5 py-4">
                    <Star size={18} className="text-purple-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-black text-purple-700">This item has already been resolved</p>
                        <p className="text-xs text-purple-500 mt-0.5">
                            This item was successfully returned to its owner and is no longer available.
                            It is kept here for record purposes only.
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">

                {/* ── Hero Image ────────────────────────────────────────────── */}
                <div className="relative h-96 bg-[#F5F6F8]">
                    {allImages[activeImageIdx] ? (
                        <img src={allImages[activeImageIdx]} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                                <Package size={52} className="mx-auto mb-2 text-gray-200" />
                                <p className="text-sm font-medium text-gray-300">No image available</p>
                            </div>
                        </div>
                    )}

                    {/* Type badge (bottom-left) + Kebab menu (bottom-right) */}
                    <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
                        <div className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md ${isLost
                            ? "bg-red-500 text-white shadow-red-200"
                            : "bg-emerald-500 text-white shadow-emerald-200"
                            }`}>
                            {isLost ? "Lost" : "Found"}
                        </div>

                        {/* ─── 3-dot kebab menu ─── */}
                        <div className="backdrop-blur-sm bg-white/80 rounded-xl shadow-sm border border-white/60">
                            <KebabMenu
                                isMyItem={isMyItem}
                                onEdit={handleOpenEditModal}
                                onDelete={() => setShowDeleteConfirm(true)}
                                onReport={() => setShowReportModal(true)}
                                onShare={handleShare}
                            />
                        </div>
                    </div>
                </div>

                {/* Thumbnails */}
                {allImages.length > 1 && (
                    <div className="px-8 pt-4 flex gap-3 border-b border-gray-100 pb-4">
                        {allImages.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveImageIdx(idx)}
                                className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${activeImageIdx === idx ? "border-[#00A8E8]" : "border-transparent hover:border-gray-200"}`}
                            >
                                <img src={img} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Details Body ──────────────────────────────────────────── */}
                <div className="p-8">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-black text-[#001F3F] leading-tight">{item.title}</h1>
                            <p className="text-xs text-gray-400 font-medium mt-1.5">ID: #{id?.slice(-8).toUpperCase()}</p>
                        </div>

                        {/* Right side — SAO badge + action button side by side */}
                        <div className="flex items-center gap-3 flex-shrink-0">

                            {/* SAO badge — Found items only, hide when resolved */}
                            {!isLost && item.status !== "resolved" && (
                                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black border shadow-sm
                    ${item.isAtSAO
                                        ? "bg-emerald-500 text-white border-emerald-400 shadow-emerald-200"
                                        : "bg-gray-50 text-gray-400 border-gray-200"
                                    }`}>
                                    <MapPin size={12} />
                                    {item.isAtSAO ? "Item at SAO" : "Not yet at SAO"}
                                </div>
                            )}

                            {/* Action button */}
                            {isClaimed ? (
                                <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-sm border border-emerald-200">
                                    <CheckCircle size={16} /> Claimed
                                </div>
                            ) : claimConfig ? (
                                <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border ${claimConfig.bg} ${claimConfig.text_c} ${claimConfig.border}`}>
                                    <claimConfig.icon size={16} /> {claimConfig.text}
                                </div>
                            ) : item.status === "resolved" ? (
                                <div className="flex items-center gap-2 px-5 py-2.5 bg-purple-50 text-purple-600 rounded-xl font-bold text-sm border border-purple-200">
                                    <Star size={16} /> Resolved
                                </div>
                            ) : isMyItem ? (
                                <div className="px-5 py-2.5 bg-gray-100 text-gray-400 rounded-xl font-bold text-sm border border-gray-200">
                                    YOUR REPORT
                                </div>
                            ) : isLost ? (
                                existingFinderReport ? (
                                    <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border bg-amber-50 text-amber-600 border-amber-200">
                                        <Clock size={16} /> Finder Report Pending
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleOpenFinderModal}
                                        className="px-7 py-2.5 bg-emerald-500 text-white rounded-xl font-black text-sm uppercase tracking-wide hover:bg-emerald-600 transition-all duration-200 shadow-lg shadow-emerald-200 hover:-translate-y-0.5"
                                    >
                                        I FOUND THIS
                                    </button>
                                )
                            ) : !item.isAtSAO ? (
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-300 rounded-xl font-black text-sm border border-gray-200 cursor-not-allowed select-none">
                                        CLAIM
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                                        <span className="text-amber-500 text-xs">⏳</span>
                                        <p className="text-[11px] text-amber-600 font-semibold">Available once item is at SAO</p>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={handleOpenClaimModal}
                                    className="px-7 py-2.5 bg-[#00A8E8] text-white rounded-xl font-black text-sm uppercase tracking-wide hover:bg-[#0096d1] transition-all duration-200 shadow-lg shadow-[#00A8E8]/25 hover:-translate-y-0.5"
                                >
                                    CLAIM
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mb-8">
                        <button
                            onClick={() => setShowDetails(prev => !prev)}
                            className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-[#00A8E8] transition-colors group"
                        >
                            <ChevronRight
                                size={14}
                                className={`transition-transform duration-200 group-hover:text-[#00A8E8] ${showDetails ? "rotate-90" : ""}`}
                            />
                            {showDetails ? "Hide item details" : "Show item details"}
                        </button>

                        {showDetails && (
                            <div className="mt-4 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InfoCard icon={<Tag size={16} className="text-[#00A8E8]" />} label="Category" value={item.category || "Uncategorized"} />
                                    <InfoCard icon={<Calendar size={16} className="text-[#00A8E8]" />} label="Date" value={formatDate(item.date)} />
                                    <InfoCard icon={<MapPin size={16} className="text-[#00A8E8]" />} label="Location" value={item.location} />
                                    <InfoCard icon={<User size={16} className="text-[#00A8E8]" />} label="Reported By" value={item.reportedBy?.name || "Anonymous"} />
                                </div>
                                <div className="border-t border-gray-100 pt-5">
                                    <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Description</h2>
                                    <p className="text-gray-600 leading-relaxed text-sm">{item.description || "No description provided."}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <ClaimTracker existingClaim={existingClaim} formatDate={formatDate} />
                    <FinderTracker existingFinderReport={existingFinderReport} formatDate={formatDate} />
                    {isMyItem && isLost && <OwnerFinderTracker item={item} />}
                    {isMyItem && !isLost && <FoundItemOwnerTracker item={item} />}
                </div>
            </div>

            {/* ═══ CLAIM MODAL ════════════════════════════════════════════════════ */}
            {showClaimModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#001F3F]/60 backdrop-blur-sm" onClick={handleCloseClaimModal} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-black text-[#001F3F]">Submit a Claim</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Prove ownership for <span className="font-semibold text-[#00A8E8]">{item.title}</span></p>
                            </div>
                            <button onClick={handleCloseClaimModal} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-gray-700">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitClaim} className="px-8 py-6 space-y-5">
                            <div>
                                <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">
                                    <Phone size={12} /> Contact Phone <span className="text-red-500">*</span>
                                </label>
                                <input type="tel" required value={claimForm.contactPhone} onChange={(e) => setClaimForm(prev => ({ ...prev, contactPhone: e.target.value.replace(/[^0-9+\s-]/g, "") }))} placeholder="+63 912 345 6789"
                                    className="w-full bg-[#F5F6F8] border border-gray-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/30 focus:border-[#00A8E8] transition text-sm font-medium text-[#001F3F] placeholder:text-gray-300" />
                            </div>
                            <div>
                                <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">
                                    <Mail size={12} /> Contact Email <span className="text-red-500">*</span>
                                </label>
                                <input type="email" required value={claimForm.contactEmail} onChange={(e) => setClaimForm(prev => ({ ...prev, contactEmail: e.target.value }))} placeholder="you@university.edu"
                                    className="w-full bg-[#F5F6F8] border border-gray-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/30 focus:border-[#00A8E8] transition text-sm font-medium text-[#001F3F] placeholder:text-gray-300" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 block">
                                    Proof of Ownership <span className="text-red-500">*</span>
                                </label>
                                <textarea value={claimForm.proofDescription} onChange={(e) => setClaimForm(prev => ({ ...prev, proofDescription: e.target.value }))}
                                    placeholder="Describe why this item belongs to you — serial numbers, marks, contents, when/where you lost it…" rows={4} required
                                    className="w-full bg-[#F5F6F8] border border-gray-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/30 focus:border-[#00A8E8] transition text-sm font-medium text-[#001F3F] placeholder:text-gray-300 resize-none" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 block">
                                    Proof Images <span className="text-gray-300 font-normal normal-case">(Optional · Max 3)</span>
                                </label>
                                {claimProofs.length > 0 && (
                                    <div className="flex gap-2 mb-3 flex-wrap">
                                        {claimProofs.map((proof, idx) => (
                                            <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-[#00A8E8]/30 group">
                                                <img src={proof} alt="" className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => removeProof(idx)} className="absolute inset-0 bg-[#001F3F]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <label className={`block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#00A8E8] hover:bg-[#00A8E8]/5 transition cursor-pointer group ${claimProofs.length >= 3 ? "opacity-40 cursor-not-allowed" : ""}`}>
                                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleProofUpload} disabled={claimProofs.length >= 3} />
                                    <Upload size={24} className="mx-auto mb-2 text-gray-300 group-hover:text-[#00A8E8] transition" />
                                    <p className="text-xs font-semibold text-gray-400 group-hover:text-[#00A8E8] transition">
                                        {claimProofs.length >= 3 ? "Maximum reached" : "Upload receipt, photo, or other proof"}
                                    </p>
                                </label>
                            </div>
                            <button type="submit" disabled={submittingClaim}
                                className="w-full bg-[#00A8E8] text-white py-3.5 rounded-xl font-black uppercase tracking-wide text-sm hover:bg-[#0096d1] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#00A8E8]/25">
                                {submittingClaim ? (<><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Submitting…</>) : "Submit Claim"}
                            </button>
                            <p className="text-[11px] text-gray-400 text-center">An admin will review your claim and notify you of the decision.</p>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══ EDIT MODAL ═════════════════════════════════════════════════════ */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#001F3F]/60 backdrop-blur-sm" onClick={handleCloseEditModal} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-black text-[#001F3F]">Edit Post</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Update the details for this item</p>
                            </div>
                            <button onClick={handleCloseEditModal} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-gray-700">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitEdit} className="px-8 py-6 space-y-5">
                            {/* Title */}
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 block">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input type="text" required value={editForm.title}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="What is the item?"
                                    className="w-full bg-[#F5F6F8] border border-gray-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/30 focus:border-[#00A8E8] transition text-sm font-medium text-[#001F3F] placeholder:text-gray-300" />
                            </div>

                            {/* Category + Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 block">Category</label>
                                    <select value={editForm.category} onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full bg-[#F5F6F8] border border-gray-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/30 focus:border-[#00A8E8] transition text-sm font-medium text-[#001F3F]">
                                        <option value="">Select…</option>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 block">Date</label>
                                    <input type="date" value={editForm.date} onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                                        className="w-full bg-[#F5F6F8] border border-gray-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/30 focus:border-[#00A8E8] transition text-sm font-medium text-[#001F3F]" />
                                </div>
                            </div>

                            {/* Location */}
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 block">Location</label>
                                <input type="text" value={editForm.location} onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                                    placeholder="Where was it lost/found?"
                                    className="w-full bg-[#F5F6F8] border border-gray-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/30 focus:border-[#00A8E8] transition text-sm font-medium text-[#001F3F] placeholder:text-gray-300" />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 block">Description</label>
                                <textarea value={editForm.description} onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Describe the item in detail…" rows={3}
                                    className="w-full bg-[#F5F6F8] border border-gray-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/30 focus:border-[#00A8E8] transition text-sm font-medium text-[#001F3F] placeholder:text-gray-300 resize-none" />
                            </div>

                            {/* Images */}
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 block">
                                    Photos <span className="text-gray-300 font-normal normal-case">(Max 5)</span>
                                </label>
                                {editImages.length > 0 && (
                                    <div className="flex gap-2 mb-3 flex-wrap">
                                        {editImages.map((img, idx) => (
                                            <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-[#00A8E8]/30 group">
                                                <img src={img} alt="" className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => removeEditImage(idx)}
                                                    className="absolute inset-0 bg-[#001F3F]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <label className={`block border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-[#00A8E8] hover:bg-[#00A8E8]/5 transition cursor-pointer group ${editImages.length >= 5 ? "opacity-40 cursor-not-allowed" : ""}`}>
                                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleEditImageUpload} disabled={editImages.length >= 5} />
                                    <Upload size={20} className="mx-auto mb-1.5 text-gray-300 group-hover:text-[#00A8E8] transition" />
                                    <p className="text-xs font-semibold text-gray-400 group-hover:text-[#00A8E8] transition">
                                        {editImages.length >= 5 ? "Maximum reached" : "Add or replace photos"}
                                    </p>
                                </label>
                            </div>

                            <button type="submit" disabled={submittingEdit}
                                className="w-full bg-[#00A8E8] text-white py-3.5 rounded-xl font-black uppercase tracking-wide text-sm hover:bg-[#0096d1] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#00A8E8]/25">
                                {submittingEdit ? (<><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>) : "Save Changes"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══ DELETE CONFIRM ══════════════════════════════════════════════════ */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#001F3F]/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
                        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={26} className="text-red-500" />
                        </div>
                        <h2 className="text-lg font-black text-[#001F3F] mb-2">Delete this post?</h2>
                        <p className="text-sm text-gray-400 mb-7 leading-relaxed">
                            This action cannot be undone. The item and all associated claims will be permanently removed.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-3 rounded-xl border border-gray-200 text-[#001F3F] font-bold text-sm hover:bg-gray-50 transition">
                                Cancel
                            </button>
                            <button onClick={handleDeleteItem} disabled={deletingItem}
                                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-black text-sm hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
                                {deletingItem ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Trash2 size={15} />}
                                {deletingItem ? "Deleting…" : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ REPORT MODAL ════════════════════════════════════════════════════ */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#001F3F]/60 backdrop-blur-sm" onClick={handleCloseReportModal} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
                            <div>
                                <h2 className="text-base font-black text-[#001F3F]">Report Post</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Help keep UClaim accurate</p>
                            </div>
                            <button onClick={handleCloseReportModal} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-gray-400">
                                <X size={16} />
                            </button>
                        </div>

                        {reportSubmitted ? (
                            <div className="p-8 text-center">
                                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={26} className="text-emerald-500" />
                                </div>
                                <h3 className="font-black text-[#001F3F] mb-2">Report Submitted</h3>
                                <p className="text-sm text-gray-400 mb-6">Thanks for helping keep UClaim accurate. Our team will review this post.</p>
                                <button onClick={handleCloseReportModal}
                                    className="w-full py-3 rounded-xl bg-[#001F3F] text-white font-bold text-sm hover:bg-[#002d5a] transition">
                                    Done
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmitReport} className="px-7 py-5 space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 block">
                                        Reason <span className="text-red-500">*</span>
                                    </label>
                                    <div className="space-y-2">
                                        {REPORT_REASONS.map(({ value, label }) => (
                                            <label key={value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${reportReason === value ? "border-[#00A8E8] bg-[#00A8E8]/5" : "border-gray-100 hover:border-gray-200"}`}>
                                                <input type="radio" name="reportReason" value={value} checked={reportReason === value}
                                                    onChange={(e) => setReportReason(e.target.value)} className="sr-only" />
                                                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${reportReason === value ? "border-[#00A8E8] bg-[#00A8E8]" : "border-gray-300"}`}>
                                                    {reportReason === value && <div className="w-full h-full rounded-full bg-white scale-[0.4]" />}
                                                </div>
                                                <span className="text-sm font-semibold text-[#001F3F]">{label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 block">
                                        Additional Details <span className="text-gray-300 font-normal normal-case">(Optional)</span>
                                    </label>
                                    <textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)}
                                        placeholder="Any additional context…" rows={3}
                                        className="w-full bg-[#F5F6F8] border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/30 focus:border-[#00A8E8] transition text-sm font-medium text-[#001F3F] placeholder:text-gray-300 resize-none" />
                                </div>

                                <button type="submit" disabled={submittingReport || !reportReason}
                                    className="w-full bg-red-500 text-white py-3 rounded-xl font-black text-sm hover:bg-red-600 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {submittingReport ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Flag size={15} />}
                                    {submittingReport ? "Submitting…" : "Submit Report"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ FINDER REPORT MODAL ══════════════════════════════════════════════════ */}
            {showFinderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#001F3F]/60 backdrop-blur-sm" onClick={handleCloseFinderModal} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-black text-[#001F3F]">I Found This Item</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Help return <span className="font-semibold text-emerald-500">{item.title}</span> to its owner</p>
                            </div>
                            <button onClick={handleCloseFinderModal} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-gray-700">
                                <X size={18} />
                            </button>
                        </div>

                        {/* SAO reminder banner */}
                        <div className="mx-8 mt-6 flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
                            <MapPin size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-black text-emerald-700">You must bring this item to the SAO</p>
                                <p className="text-xs text-emerald-600 mt-0.5">After submitting this form, please turn over the item to the Student Affairs Office so it can be returned to its owner.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitFinderReport} className="px-8 py-6 space-y-5">
                            <div>
                                <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">
                                    <Phone size={12} /> Your Contact Phone <span className="text-red-500">*</span>
                                </label>
                                <input type="tel" required value={finderForm.contactPhone}
                                    onChange={(e) => setFinderForm(prev => ({ ...prev, contactPhone: e.target.value.replace(/[^0-9+\s-]/g, "") }))}
                                    placeholder="+63 912 345 6789"
                                    className="w-full bg-[#F5F6F8] border border-gray-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition text-sm font-medium text-[#001F3F] placeholder:text-gray-300" />
                            </div>

                            <div>
                                <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">
                                    <Mail size={12} /> Your Contact Email <span className="text-red-500">*</span>
                                </label>
                                <input type="email" required value={finderForm.contactEmail}
                                    onChange={(e) => setFinderForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                                    placeholder="you@university.edu"
                                    className="w-full bg-[#F5F6F8] border border-gray-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition text-sm font-medium text-[#001F3F] placeholder:text-gray-300" />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 block">
                                    Where / How did you find it? <span className="text-red-500">*</span>
                                </label>
                                <textarea required value={finderForm.finderDescription}
                                    onChange={(e) => setFinderForm(prev => ({ ...prev, finderDescription: e.target.value }))}
                                    placeholder="Describe where you found it, when, and any details that might help identify the owner…"
                                    rows={4}
                                    className="w-full bg-[#F5F6F8] border border-gray-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition text-sm font-medium text-[#001F3F] placeholder:text-gray-300 resize-none" />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 block">
                                    Photos of Item <span className="text-gray-300 font-normal normal-case">(Optional · Max 3)</span>
                                </label>
                                {finderProofs.length > 0 && (
                                    <div className="flex gap-2 mb-3 flex-wrap">
                                        {finderProofs.map((proof, idx) => (
                                            <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-emerald-300/50 group">
                                                <img src={proof} alt="" className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => removeFinderProof(idx)}
                                                    className="absolute inset-0 bg-[#001F3F]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <label className={`block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-emerald-400 hover:bg-emerald-50/50 transition cursor-pointer group ${finderProofs.length >= 3 ? "opacity-40 cursor-not-allowed" : ""}`}>
                                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleFinderProofUpload} disabled={finderProofs.length >= 3} />
                                    <Upload size={24} className="mx-auto mb-2 text-gray-300 group-hover:text-emerald-500 transition" />
                                    <p className="text-xs font-semibold text-gray-400 group-hover:text-emerald-500 transition">
                                        {finderProofs.length >= 3 ? "Maximum reached" : "Upload a photo of the item you found"}
                                    </p>
                                </label>
                            </div>

                            <button type="submit" disabled={submittingFinder}
                                className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-black uppercase tracking-wide text-sm hover:bg-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
                                {submittingFinder
                                    ? (<><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Submitting…</>)
                                    : (<><MapPin size={15} />Submit & Bring to SAO</>)
                                }
                            </button>
                            <p className="text-[11px] text-gray-400 text-center">
                                An admin will verify your report and connect you with the item's owner.
                            </p>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ItemDetail;