import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../services/api";
import { useSettings } from "../../contexts/SettingsContext";
import {
    ArrowLeft, MapPin, Calendar, User, Tag, X,
    Upload, CheckCircle, Clock, Phone, Mail,
    ChevronLeft, ChevronRight, Package, MoreVertical, Pencil, Trash2,
    Flag, Share2, AlertTriangle, Check, Info
} from "lucide-react";

/* ─── Global styles injected once ───────────────────────────────────────────── */
const ITEM_DETAIL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
.uclaim-item * { font-family: 'Sora', sans-serif; }
.uclaim-input {
  width: 100%;
  background: #F8FAFC;
  border: 1.5px solid #E2E8F0;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  font-family: 'Sora', sans-serif;
  color: #001F3F;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}
.uclaim-input::placeholder { color: #94A3B8; }
.uclaim-input:focus {
  border-color: #00A8E8;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(0,168,232,0.12);
}
.uclaim-textarea { resize: none; }
`;

const injectStyles = () => {
    if (!document.getElementById("uclaim-item-styles")) {
        const el = document.createElement("style");
        el.id = "uclaim-item-styles";
        el.textContent = ITEM_DETAIL_CSS;
        document.head.appendChild(el);
    }
};

/* ─── Shared input class helper ──────────────────────────────────────────────── */
const inputCls = "uclaim-input";
const textareaCls = "uclaim-input uclaim-textarea";

/* ─── Info card ──────────────────────────────────────────────────────────────── */
const InfoCard = ({ icon, label, value }) => (
    <div className="flex items-start gap-4 p-4 bg-[#F8FAFC] rounded-2xl border border-[#F1F5F9]">
        <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0 border border-[#E2E8F0]"
            style={{ boxShadow: "0 1px 4px rgba(0,31,63,0.06)" }}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-1">{label}</p>
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
                ${danger ? "text-red-500 hover:bg-red-50" : "text-[#001F3F] hover:bg-[#F8FAFC]"}`}
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
                        ? "bg-white text-[#001F3F] border-white shadow-lg"
                        : "bg-white/20 text-white border-white/30 hover:bg-white/40"
                    }`}
            >
                <MoreVertical size={16} />
            </button>
            {open && (
                <div className="absolute right-0 top-11 w-48 bg-white border border-[#F1F5F9] rounded-2xl z-30 p-1.5"
                    style={{ boxShadow: "0 12px 28px rgba(0,31,63,0.12), 0 2px 8px rgba(0,31,63,0.06)" }}>
                    {isMyItem ? (
                        <>
                            <MenuItem icon={<Share2 size={15} />} label="Share Item" onClick={onShare} />
                            <div className="my-1 border-t border-[#F1F5F9]" />
                            <MenuItem icon={<Pencil size={15} />} label="Edit Post" onClick={onEdit} />
                            <div className="my-1 border-t border-[#F1F5F9]" />
                            <MenuItem icon={<Trash2 size={15} />} label="Delete Post" onClick={onDelete} danger />
                        </>
                    ) : (
                        <>
                            <MenuItem icon={<Share2 size={15} />} label="Share Item" onClick={onShare} />
                            <div className="my-1 border-t border-[#F1F5F9]" />
                            <MenuItem icon={<Flag size={15} />} label="Report Post" onClick={onReport} danger />
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

/* ─── Shared Timeline Step ───────────────────────────────────────────────────── */
const TimelineStep = ({ step, isLast }) => (
    <div className="flex gap-4">
        <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2
                ${step.isRejected ? "bg-red-50 border-red-300"
                    : step.isDone ? "bg-emerald-50 border-emerald-300"
                        : step.isActive ? "bg-amber-50 border-amber-300"
                            : "bg-[#F8FAFC] border-[#E2E8F0]"}`}>
                {step.isRejected ? <X size={11} className="text-red-500" />
                    : step.isDone ? <CheckCircle size={11} className="text-emerald-500" />
                        : step.isActive ? <Clock size={11} className="text-amber-500" />
                            : <div className="w-2 h-2 rounded-full bg-[#CBD5E1]" />}
            </div>
            {!isLast && (
                <div className={`w-0.5 flex-1 my-1 min-h-[20px] ${step.isDone ? "bg-emerald-200" : "bg-[#F1F5F9]"}`} />
            )}
        </div>
        <div className={`flex-1 ${isLast ? "pb-0" : "pb-5"}`}>
            <p className={`text-sm font-bold
                ${step.isRejected ? "text-red-600"
                    : step.isDone ? "text-[#001F3F]"
                        : step.isActive ? "text-amber-600"
                            : "text-[#CBD5E1]"}`}>
                {step.label}
            </p>
            {step.time && (
                <p className={`text-[11px] mt-0.5 ${step.isRejected || step.isDone || step.isActive ? "text-[#94A3B8]" : "text-[#E2E8F0]"}`}>
                    {step.time}
                </p>
            )}
            {step.note && (
                <p className={`mt-2 text-xs rounded-xl px-3 py-2.5 leading-relaxed
                    ${step.isRejected ? "bg-red-50 text-red-500" : "bg-[#F8FAFC] text-[#64748B]"}`}>
                    {step.note}
                </p>
            )}
        </div>
    </div>
);

/* ─── Claim Tracker ──────────────────────────────────────────────────────────── */
const ClaimTracker = ({ existingClaim, formatDate }) => {
    if (!existingClaim) return null;
    const status = existingClaim.status;

    const steps = [
        { key: "submitted", label: "Claim submitted", time: formatDate(existingClaim.createdAt), isDone: true, isActive: false, isRejected: false },
        { key: "reviewing", label: "Under admin review", time: status === "pending" ? "Waiting for decision…" : formatDate(existingClaim.reviewedAt), isDone: status !== "pending", isActive: status === "pending", isRejected: false },
        {
            key: "decision",
            label: status === "rejected" ? "Claim rejected" : status === "pending" ? "Decision pending" : "Claim approved",
            time: status === "pending" ? null : formatDate(existingClaim.reviewedAt),
            isDone: status === "approved" || status === "picked_up", isActive: false,
            isRejected: status === "rejected", isPending: status === "pending",
            note: status === "rejected" ? (existingClaim.rejectionReason || "Your claim was not approved.")
                : status !== "pending" && existingClaim.reviewNotes ? existingClaim.reviewNotes : null,
        },
        {
            key: "pickup", label: "Ready for pickup at SAO",
            time: status === "approved" ? "Bring a valid school ID" : status === "picked_up" ? formatDate(existingClaim.pickedUpAt) : null,
            isDone: status === "picked_up", isActive: status === "approved", isRejected: false, isPending: status === "pending",
            note: status === "approved" ? "Visit the SAO office to collect your item." : null,
        },
        { key: "collected", label: "Item collected", time: status === "picked_up" ? formatDate(existingClaim.pickedUpAt) : null, isDone: status === "picked_up", isActive: false, isRejected: false, isPending: status !== "picked_up" },
    ];

    const visibleSteps = status === "rejected" ? steps.slice(0, 3) : steps;

    return (
        <div className="mt-8 rounded-2xl overflow-hidden" style={{ border: "2px solid rgba(16,185,129,0.25)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-100" style={{ background: "rgba(236,253,245,0.7)" }}>
                <div>
                    <h3 className="text-sm font-black text-[#001F3F]">Your Claim Status</h3>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">#{existingClaim._id?.slice(-8).toUpperCase()}</p>
                </div>
            </div>
            <div className="px-6 py-5 bg-white">
                {visibleSteps.map((step, idx) => (
                    <TimelineStep key={step.key} step={step} isLast={idx === visibleSteps.length - 1} />
                ))}
            </div>
        </div>
    );
};

/* ─── Finder Tracker ─────────────────────────────────────────────────────────── */
const FinderTracker = ({ existingFinderReport, formatDate }) => {
    if (!existingFinderReport) return null;
    const status = existingFinderReport.status;

    const steps = [
        { key: "submitted", label: "Finder report submitted", time: formatDate(existingFinderReport.createdAt), isDone: true, isActive: false, isRejected: false },
        { key: "reviewing", label: "Admin verifying report", time: status === "pending" ? "Waiting for admin…" : formatDate(existingFinderReport.reviewedAt), isDone: status !== "pending", isActive: status === "pending", isRejected: false },
        {
            key: "decision",
            label: status === "rejected" ? "Report declined" : status === "pending" ? "Decision pending" : "Item confirmed at SAO",
            time: status === "pending" ? null : formatDate(existingFinderReport.reviewedAt),
            isDone: status === "approved" || status === "picked_up", isActive: false,
            isRejected: status === "rejected", isPending: status === "pending",
            note: status === "rejected" ? (existingFinderReport.rejectionReason || "Your report was not approved.")
                : status !== "pending" && existingFinderReport.reviewNotes ? existingFinderReport.reviewNotes : null,
        },
        { key: "owner_notified", label: "Owner notified to claim", time: status === "approved" || status === "picked_up" ? "Owner has been emailed" : null, isDone: status === "approved" || status === "picked_up", isActive: false, isRejected: false, isPending: status === "pending" },
        {
            key: "collected", label: "Owner collected the item",
            time: status === "picked_up" ? formatDate(existingFinderReport.pickedUpAt) : null,
            isDone: status === "picked_up", isActive: status === "approved", isRejected: false, isPending: status !== "picked_up",
            note: status === "picked_up" ? "Thanks for being a good samaritan! 🎉" : null,
        },
    ];

    const visibleSteps = status === "rejected" ? steps.slice(0, 3) : steps;

    return (
        <div className="mt-8 rounded-2xl overflow-hidden" style={{ border: "2px solid rgba(16,185,129,0.25)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-100" style={{ background: "rgba(236,253,245,0.7)" }}>
                <div>
                    <h3 className="text-sm font-black text-[#001F3F]">Your Finder Report Status</h3>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">#{existingFinderReport._id?.slice(-8).toUpperCase()}</p>
                </div>
            </div>
            <div className="px-6 py-5 bg-white">
                {visibleSteps.map((step, idx) => (
                    <TimelineStep key={step.key} step={step} isLast={idx === visibleSteps.length - 1} />
                ))}
            </div>
        </div>
    );
};

/* ─── Owner Finder Tracker ───────────────────────────────────────────────────── */
const OwnerFinderTracker = ({ item, existingFinderReport }) => {
    if (!item) return null;
    const isAtSAO = item.isAtSAO;
    const isResolved = item.status === "claimed" || item.status === "resolved";
    const finderReportExists = !!existingFinderReport;

    const steps = [
        { key: "lost", label: "You reported this item as lost", isDone: true, isActive: false },
        {
            key: "found", label: "Someone found your item",
            sub: isAtSAO || isResolved ? "A finder submitted a report and turned it over" : null,
            isDone: isAtSAO || isResolved, isActive: false,
        },
        {
            key: "sao", label: "Item confirmed at SAO",
            sub: isAtSAO ? "Your item is at the Student Affairs Office"
                : finderReportExists ? "Waiting for admin to confirm item received at SAO" : null,
            isDone: isAtSAO || isResolved, isActive: finderReportExists && !isAtSAO && !isResolved,
        },
        {
            key: "claim", label: isResolved ? "You collected your item" : "Ready for you to claim",
            sub: isResolved ? "Item successfully returned to you 🎉" : isAtSAO ? "Visit the SAO with a valid school ID to pick it up" : null,
            isDone: isResolved, isActive: isAtSAO && !isResolved,
        },
    ];

    return (
        <div className="mt-8 rounded-2xl overflow-hidden" style={{ border: "2px solid rgba(16,185,129,0.25)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-100" style={{ background: "rgba(236,253,245,0.7)" }}>
                <div>
                    <h3 className="text-sm font-black text-[#001F3F]">Lost Item Status</h3>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">Here's the current status of your lost item</p>
                </div>
            </div>
            <div className="px-6 py-5 bg-white">
                {steps.map((step, idx) => {
                    const isLast = idx === steps.length - 1;
                    return (
                        <div key={step.key} className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2
                                    ${step.isDone ? "bg-emerald-50 border-emerald-300" : step.isActive ? "bg-amber-50 border-amber-300" : "bg-[#F8FAFC] border-[#E2E8F0]"}`}>
                                    {step.isDone ? <CheckCircle size={11} className="text-emerald-500" />
                                        : step.isActive ? <Clock size={11} className="text-amber-500" />
                                            : <div className="w-2 h-2 rounded-full bg-[#CBD5E1]" />}
                                </div>
                                {!isLast && <div className={`w-0.5 flex-1 my-1 min-h-[20px] ${step.isDone ? "bg-emerald-200" : "bg-[#F1F5F9]"}`} />}
                            </div>
                            <div className={`flex-1 ${isLast ? "pb-0" : "pb-5"}`}>
                                <p className={`text-sm font-bold ${step.isDone ? "text-[#001F3F]" : step.isActive ? "text-amber-600" : "text-[#CBD5E1]"}`}>{step.label}</p>
                                {step.sub && (
                                    <p className={`mt-1.5 text-xs rounded-xl px-3 py-2.5 leading-relaxed
                                        ${step.isActive ? "bg-amber-50 text-amber-600" : step.isDone ? "bg-[#F8FAFC] text-[#64748B]" : "text-[#E2E8F0]"}`}>
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

/* ─── Found Item Owner Tracker ───────────────────────────────────────────────── */
const FoundItemOwnerTracker = ({ item, pendingClaimsCount = 0, approvedClaimsCount = 0 }) => {
    if (!item) return null;
    const isAtSAO = item.isAtSAO;
    const isClaimed = item.status === "claimed" || item.status === "resolved";
    if (!isAtSAO && !isClaimed) return null;

    const hasActiveClaim = pendingClaimsCount > 0;

    const steps = [
        {
            key: "reported",
            label: "You reported this item as found",
            sub: "Thank you for turning it over to SAO",
            isDone: true, isActive: false,
        },
        {
            key: "claimed",
            label: "A claimant submitted a claim",
            sub: isClaimed || approvedClaimsCount > 0
                ? "The claimant appeared at SAO for in-person verification"
                : hasActiveClaim
                    ? "A user submitted a claim and has been instructed to appear at the SAO for in-person verification"
                    : null,
            isDone: isClaimed || approvedClaimsCount > 0,
            isActive: isAtSAO && !isClaimed && hasActiveClaim && approvedClaimsCount === 0,
        },
        {
            key: "approved",
            label: "Claim approved by admin",
            sub: isClaimed || approvedClaimsCount > 0 ? "Admin verified and approved the claim" : null,
            isDone: isClaimed || approvedClaimsCount > 0,
            isActive: false,
        },
        {
            key: "collected",
            label: isClaimed ? "Owner collected the item" : "Waiting for owner to collect",
            sub: isClaimed
                ? "The item has been successfully returned to its owner 🎉"
                : approvedClaimsCount > 0
                    ? "The owner has been approved and notified to collect the item from SAO"
                    : null,
            isDone: isClaimed,
            isActive: approvedClaimsCount > 0 && !isClaimed,
        },
    ];

    return (
        <div className="mt-8 rounded-2xl overflow-hidden" style={{ border: "2px solid rgba(16,185,129,0.25)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-100" style={{ background: "rgba(236,253,245,0.7)" }}>
                <div>
                    <h3 className="text-sm font-black text-[#001F3F]">Claim Status for Your Found Report</h3>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">Here's what's happening with the item you found</p>
                </div>
            </div>
            <div className="px-6 py-5 bg-white">
                {steps.map((step, idx) => {
                    const isLast = idx === steps.length - 1;
                    return (
                        <div key={step.key} className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2
                                    ${step.isDone ? "bg-emerald-50 border-emerald-300"
                                        : step.isActive ? "bg-amber-50 border-amber-300"
                                            : "bg-[#F8FAFC] border-[#E2E8F0]"}`}>
                                    {step.isDone ? <CheckCircle size={11} className="text-emerald-500" />
                                        : step.isActive ? <Clock size={11} className="text-amber-500" />
                                            : <div className="w-2 h-2 rounded-full bg-[#CBD5E1]" />}
                                </div>
                                {!isLast && <div className={`w-0.5 flex-1 my-1 min-h-[20px] ${step.isDone ? "bg-emerald-200" : "bg-[#F1F5F9]"}`} />}
                            </div>
                            <div className={`flex-1 ${isLast ? "pb-0" : "pb-5"}`}>
                                <p className={`text-sm font-bold ${step.isDone ? "text-[#001F3F]" : step.isActive ? "text-amber-600" : "text-[#CBD5E1]"}`}>
                                    {step.label}
                                </p>
                                {step.sub && (
                                    <p className={`mt-1.5 text-xs rounded-xl px-3 py-2.5 leading-relaxed
                                        ${step.isActive ? "bg-amber-50 text-amber-600"
                                            : step.isDone ? "bg-[#F8FAFC] text-[#64748B]"
                                                : "text-[#E2E8F0]"}`}>
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

/* ─── Modal primitives — defined OUTSIDE ItemDetail to prevent remount on state change ── */
const Backdrop = ({ onClick }) => (
    <div className="absolute inset-0 bg-[#001F3F]/60 backdrop-blur-sm" onClick={onClick} />
);

const ModalCard = ({ children, maxW = "max-w-xl" }) => (
    <div className={`relative bg-white w-full ${maxW} max-h-[90vh] overflow-y-auto`}
        style={{ borderRadius: "24px", boxShadow: "0 32px 64px rgba(0,31,63,0.2), 0 8px 24px rgba(0,31,63,0.1)" }}>
        {children}
    </div>
);

const ModalHeader = ({ title, subtitle, onClose }) => (
    <div className="flex items-center justify-between px-8 py-6 border-b border-[#F1F5F9]">
        <div>
            <h2 className="text-lg font-extrabold text-[#001F3F] tracking-tight">{title}</h2>
            {subtitle && <p className="text-xs text-[#94A3B8] mt-0.5 font-medium">{subtitle}</p>}
        </div>
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F1F5F9] transition text-[#94A3B8] hover:text-[#001F3F]">
            <X size={18} />
        </button>
    </div>
);

const UploadZone = ({ disabled, onChange, hoverColor = "#00A8E8", hoverBg = "#EBF8FF" }) => (
    <label
        className={`block border-2 border-dashed border-[#E2E8F0] rounded-xl p-6 text-center transition cursor-pointer group ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
        onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = hoverColor; e.currentTarget.style.background = hoverBg; } }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.background = ""; }}>
        <input type="file" accept="image/*" multiple className="hidden" onChange={onChange} disabled={disabled} />
        <Upload size={22} className="mx-auto mb-2 text-[#CBD5E1] group-hover:text-[#00A8E8] transition" />
        <p className="text-xs font-semibold text-[#94A3B8] group-hover:text-[#00A8E8] transition">
            {disabled ? "Maximum reached" : "Click to upload photos"}
        </p>
    </label>
);

const ProofThumbs = ({ proofs, onRemove, borderColor = "border-[#00A8E8]/30" }) => (
    proofs.length > 0 ? (
        <div className="flex gap-2 mb-3 flex-wrap">
            {proofs.map((proof, idx) => (
                <div key={idx} className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 ${borderColor} group`}>
                    <img src={proof} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => onRemove(idx)} className="absolute inset-0 bg-[#001F3F]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white">
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    ) : null
);

const LabelRow = ({ icon, children, required: req }) => (
    <label className="flex items-center gap-1.5 text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-2.5">
        {icon}
        {children}
        {req && <span className="text-emerald-500">*</span>}
    </label>
);

const PrimaryBtn = ({ disabled, loading: ld, children, className = "", color = "#00A8E8", shadow = "rgba(0,168,232,0.25)" }) => (
    <button type="submit" disabled={disabled}
        className={`w-full text-white py-3.5 rounded-xl font-extrabold uppercase tracking-wide text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
        style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`, boxShadow: `0 6px 18px ${shadow}` }}>
        {ld ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Submitting…</> : children}
    </button>
);

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
    const [claimSubmitted, setClaimSubmitted] = useState(false);
    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const [showDetails, setShowDetails] = useState(true);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ title: "", description: "", location: "", category: "", date: "" });
    const [editImages, setEditImages] = useState([]);
    const [submittingEdit, setSubmittingEdit] = useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingItem, setDeletingItem] = useState(false);

    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [reportDetails, setReportDetails] = useState("");
    const [submittingReport, setSubmittingReport] = useState(false);
    const [reportSubmitted, setReportSubmitted] = useState(false);

    const [showFinderModal, setShowFinderModal] = useState(false);
    const [finderForm, setFinderForm] = useState({ finderDescription: "", contactPhone: "", contactEmail: "" });
    const [finderProofs, setFinderProofs] = useState([]);
    const [submittingFinder, setSubmittingFinder] = useState(false);
    const [existingFinderReport, setExistingFinderReport] = useState(null);

    const [showShareToast, setShowShareToast] = useState(false);
    const [isWatching, setIsWatching] = useState(false);
    const [watchLoading, setWatchLoading] = useState(false);
    const [itemPendingClaimsCount, setItemPendingClaimsCount] = useState(0);
    const [itemApprovedClaimsCount, setItemApprovedClaimsCount] = useState(0);

    const fetchItemDetails = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.getItem(id);
            setItem(data);
            setEditForm({
                title: data.title || "",
                description: data.description || "",
                location: data.location || "",
                category: data.category || "",
                date: data.date ? new Date(data.date).toISOString().split("T")[0] : "",
            });
            setEditImages(data.images || []);
            const savedUser = localStorage.getItem("user");
            const currentUserId = savedUser ? JSON.parse(savedUser).id : null;
            const isOwner = data.reportedBy?._id === currentUserId;
            if (isOwner && (data.type === "lost" || data.isAtSAO || data.status === "claimed" || data.status === "resolved")) {
                setShowDetails(false);
            }
        } catch (err) {
            if (err.message.includes("401")) navigate("/login", { state: { from: `/item/${id}` } });
            else if (err.message.includes("404")) navigate("/search");
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    const checkExistingClaim = useCallback(async () => {
        try {
            const myClaims = await api.getMyClaims();
            const existing = myClaims.find(c => (c.item._id === id || c.item === id) && c.type !== "finder_report");
            const existingFinder = myClaims.find(c => (c.item._id === id || c.item === id) && c.type === "finder_report");
            setExistingClaim(existing);
            setExistingFinderReport(existingFinder);
            if (existing || existingFinder) setShowDetails(false);
        } catch (_) { }

        // For finder: check if anyone has submitted a claim on this item
        try {
            const incomingClaims = await api.getIncomingClaims();
            const claimsOnThisItem = incomingClaims.filter(
                c => (c.item._id === id || c.item === id) && c.type !== "finder_report"
            );
            const approvedClaimsOnThisItem = claimsOnThisItem.filter(c => c.status === "approved" || c.status === "picked_up");
            setItemPendingClaimsCount(claimsOnThisItem.length);
            setItemApprovedClaimsCount(approvedClaimsOnThisItem.length);
        } catch (_) { }
    }, [id]);

    useEffect(() => {
        injectStyles();
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

        // Fetch watch status for this item
        api.getWatchStatus(id).then(res => setIsWatching(res.watching)).catch(() => { });
    }, [id, navigate, fetchItemDetails, checkExistingClaim]);

    const handleOpenClaimModal = () => setShowClaimModal(true);
    const handleCloseClaimModal = () => {
        setShowClaimModal(false);
        setClaimSubmitted(false);
        const savedUser = localStorage.getItem("user");
        setClaimForm({ proofDescription: "", contactPhone: "", contactEmail: savedUser ? JSON.parse(savedUser).email || "" : "" });
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
            await api.submitClaim({ itemId: id, proofDescription: claimForm.proofDescription, contactPhone: claimForm.contactPhone, contactEmail: claimForm.contactEmail, proofImages: claimProofs });
            setClaimSubmitted(true);
            checkExistingClaim();
        } catch (err) {
            alert(err.message || "Failed to submit claim. Please try again.");
        } finally {
            setSubmittingClaim(false);
        }
    };

    const handleOpenEditModal = () => setShowEditModal(true);
    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditForm({ title: item.title || "", description: item.description || "", location: item.location || "", category: item.category || "", date: item.date ? new Date(item.date).toISOString().split("T")[0] : "" });
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

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: item.title,
                    text: `Check out this ${isLost ? "lost" : "found"} item on UClaim: ${item.title}`,
                    url,
                });
            } catch (err) {
                if (err.name !== "AbortError") {
                    if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => { });
                    setShowShareToast(true);
                    setTimeout(() => setShowShareToast(false), 3000);
                }
            }
        } else {
            if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => { });
            setShowShareToast(true);
            setTimeout(() => setShowShareToast(false), 3000);
        }
    };

    const handleWatchToggle = async () => {
        if (watchLoading) return;
        try {
            setWatchLoading(true);
            const res = await api.watchItem(id);
            setIsWatching(res.watching);
        } catch (err) {
            alert("Failed to update watch status. Please try again.");
        } finally {
            setWatchLoading(false);
        }
    };

    const handleSubmitReport = async (e) => {
        e.preventDefault();
        if (!reportReason) { alert("Please select a reason"); return; }
        try {
            setSubmittingReport(true);
            await new Promise(res => setTimeout(res, 800));
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

    const handleOpenFinderModal = () => setShowFinderModal(true);
    const handleCloseFinderModal = () => {
        setShowFinderModal(false);
        const savedUser = localStorage.getItem("user");
        setFinderForm({ finderDescription: "", contactPhone: "", contactEmail: savedUser ? JSON.parse(savedUser).email || "" : "" });
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
            await api.submitFinderReport({ itemId: id, finderDescription: finderForm.finderDescription, contactPhone: finderForm.contactPhone, contactEmail: finderForm.contactEmail, proofImages: finderProofs });
            handleCloseFinderModal();
            checkExistingClaim();
            alert("Thank you! Please bring the item to the SAO office now so it can be returned to its owner.");
        } catch (err) {
            alert(err.message || "Failed to submit. Please try again.");
        } finally {
            setSubmittingFinder(false);
        }
    };

    const formatDate = (ds) => {
        if (!ds) return "N/A";
        return new Date(ds).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    };

    const getClaimStatusConfig = () => {
        if (!existingClaim) return null;
        const map = {
            pending: { text: "Claim Pending Review", bg: "bg-amber-50", text_c: "text-amber-600", border: "border-amber-200", icon: Clock },
            approved: { text: "Approved", bg: "bg-emerald-50", text_c: "text-emerald-600", border: "border-emerald-200", icon: CheckCircle },
            rejected: { text: "Claim Rejected", bg: "bg-red-50", text_c: "text-red-600", border: "border-red-200", icon: X },
            picked_up: { text: "Resolved", bg: "bg-emerald-50", text_c: "text-emerald-600", border: "border-emerald-200", icon: CheckCircle },
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

    /* ── Loading ─────────────────────────────────────────────────────────────── */
    if (loading) return (
        <div className="uclaim-item flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-2xl animate-pulse" style={{ background: "linear-gradient(135deg,#00A8E8,#0090CC)" }} />
                <p className="text-sm font-semibold text-[#94A3B8]">Loading item…</p>
            </div>
        </div>
    );

    if (!item) return (
        <div className="uclaim-item flex items-center justify-center flex-col gap-4 py-20">
            <div className="w-16 h-16 bg-[#F8FAFC] rounded-2xl flex items-center justify-center text-3xl border border-[#F1F5F9]">📦</div>
            <h2 className="text-xl font-bold text-[#001F3F]">Item not found</h2>
            <button onClick={() => navigate("/search")} className="text-[#00A8E8] font-bold hover:underline text-sm">Back to Search</button>
        </div>
    );

    const isLost = item.type === "lost";
    const isClaimed = item.status === "claimed";
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const isMyItem = item.reportedBy?._id === currentUser.id;
    const claimConfig = getClaimStatusConfig();
    const allImages = item.images || [];

    return (
        <div className="uclaim-item p-6 lg:p-8 max-w-5xl mx-auto">

            {/* Share toast */}
            {showShareToast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 text-white px-5 py-3 rounded-2xl text-sm font-semibold"
                    style={{ background: "#001F3F", boxShadow: "0 8px 24px rgba(0,31,63,0.25)" }}>
                    <Check size={16} className="text-emerald-400" />
                    Link copied to clipboard!
                </div>
            )}

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-6 text-sm">
                <button onClick={() => navigate("/search")}
                    className="flex items-center gap-1.5 text-[#94A3B8] hover:text-emerald-500 transition-colors font-medium group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    Search Items
                </button>
                <ChevronRight size={14} className="text-[#E2E8F0]" />
                <span className="font-semibold text-[#001F3F] truncate max-w-xs">{item.title}</span>
            </div>

            {/* Resolved banner */}
            {(item.status === "resolved" || item.status === "claimed") && (
                <div className="mb-4 flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
                    <CheckCircle size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-extrabold text-emerald-700">This item has already been resolved</p>
                        <p className="text-xs text-emerald-500 mt-0.5">This item was successfully returned to its owner and is no longer available. It is kept here for record purposes only.</p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1.5px solid #F1F5F9", boxShadow: "0 8px 24px rgba(0,31,63,0.06), 0 1px 4px rgba(0,31,63,0.04)" }}>

                {/* Hero */}
                <div
                    className="relative h-96 bg-[#F8FAFC] group cursor-pointer"
                    onClick={allImages.length > 1 ? () => setActiveImageIdx((prev) => (prev + 1) % allImages.length) : undefined}
                >
                    {allImages[activeImageIdx] ? (
                        <img
                            src={allImages[activeImageIdx]}
                            alt={item.title}
                            className="w-full h-full object-cover select-none pointer-events-none"
                            draggable={false}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                                <Package size={52} className="mx-auto mb-2 text-[#E2E8F0]" />
                                <p className="text-sm font-medium text-[#CBD5E1]">No image available</p>
                            </div>
                        </div>
                    )}

                    {/* Image counter */}
                    {allImages.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium tracking-wide z-10">
                            {activeImageIdx + 1} / {allImages.length}
                        </div>
                    )}

                    {/* Hover arrows (desktop only) */}
                    {allImages.length > 1 && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveImageIdx((prev) => (prev - 1 + allImages.length) % allImages.length);
                                }}
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-all duration-300 opacity-0 group-hover:opacity-100 hidden md:flex z-10"
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveImageIdx((prev) => (prev + 1) % allImages.length);
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-all duration-300 opacity-0 group-hover:opacity-100 hidden md:flex z-10"
                                aria-label="Next image"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </>
                    )}

                    <div
                        className="absolute top-5 left-5 right-5 flex items-center justify-between z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest
                            ${isLost ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}`}
                            style={{ boxShadow: isLost ? "0 4px 12px rgba(239,68,68,0.3)" : "0 4px 12px rgba(16,185,129,0.3)" }}>
                            {isLost ? "Lost" : "Found"}
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Watch bell — only on found items awaiting SAO, not mine, not resolved */}
                            {!isLost && !isMyItem && !item.isAtSAO && item.status === "active" && (
                                <div className="relative group">
                                    <button
                                        onClick={handleWatchToggle}
                                        disabled={watchLoading}
                                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all border backdrop-blur-sm
                                            ${isWatching
                                                ? "bg-white text-[#001F3F] border-white shadow-lg"
                                                : "bg-[#001F3F]/40 text-white border-white/20 hover:bg-[#001F3F]/60"
                                            } ${watchLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        {isWatching ? (
                                            /* Filled bookmark — saved */
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            /* Outline bookmark — not saved */
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                                            </svg>
                                        )}
                                    </button>
                                    {/* Tooltip */}
                                    <div className="absolute right-0 top-11 w-64 bg-[#001F3F] text-white text-xs rounded-2xl px-4 py-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 leading-relaxed">
                                        <p className="font-bold mb-1">
                                            {isWatching ? "Unwatch this item" : "Watch this item"}
                                        </p>
                                        <p className="text-white/70">
                                            {isWatching
                                                ? "Stop receiving notifications when this item becomes available for claiming."
                                                : "Enable alerts for this item. Get notified when ready to claim, then click to return instantly."
                                            }
                                        </p>
                                        <div className="absolute -top-1.5 right-3 w-3 h-3 bg-[#001F3F] rotate-45" />
                                    </div>
                                </div>
                            )}
                            <div className="backdrop-blur-sm bg-[#001F3F]/40 rounded-xl border border-white/20">
                                <KebabMenu isMyItem={isMyItem} onEdit={handleOpenEditModal} onDelete={() => setShowDeleteConfirm(true)} onReport={() => setShowReportModal(true)} onShare={handleShare} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-extrabold text-[#001F3F] leading-tight tracking-tight">{item.title}</h1>
                            <p className="text-xs text-[#94A3B8] font-medium mt-1.5">ID: #{id?.slice(-8).toUpperCase()}</p>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                            {/* SAO badge */}
                            {!isLost && item.status !== "resolved" && item.isAtSAO && !isMyItem && (
                                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold border bg-[#F0FAF6] text-[#2E7D5E] border-[#B6DECE]">
                                    <MapPin size={12} />
                                    Item at SAO
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
                                <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-sm border border-emerald-200">
                                    <CheckCircle size={16} /> Resolved
                                </div>
                            ) : isMyItem ? (
                                <div className="px-5 py-2.5 bg-[#F8FAFC] text-[#94A3B8] rounded-xl font-extrabold text-sm border border-[#E2E8F0]">
                                    POSTED
                                </div>
                            ) : isLost ? (
                                existingFinderReport ? (
                                    <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border bg-amber-50 text-amber-600 border-amber-200">
                                        <Clock size={16} /> Finder Report Pending
                                    </div>
                                ) : (
                                    <button onClick={handleOpenFinderModal}
                                        className="px-7 py-2.5 bg-emerald-500 text-white rounded-xl font-extrabold text-sm uppercase tracking-wide hover:bg-emerald-600 transition-all hover:-translate-y-0.5"
                                        style={{ boxShadow: "0 6px 18px rgba(16,185,129,0.3)" }}>
                                        RETURN
                                    </button>
                                )
                            ) : !item.isAtSAO ? (
                                <div className="flex items-center gap-2">
                                    <div className="relative group">
                                        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold border bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 transition-colors cursor-default">
                                            <Info size={13} />
                                            Awaiting SAO
                                        </button>
                                        <div className="absolute right-0 bottom-11 bg-[#001F3F] text-white text-xs rounded-2xl px-4 py-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 leading-relaxed" style={{ width: "260px" }}>
                                            <p className="font-bold mb-1">Claiming not yet available</p>
                                            <p className="text-white/70">The finder still needs to bring this item to the SAO. Once an admin confirms it's there, the Claim button will become active.</p>
                                            <div className="absolute -bottom-1.5 right-3 w-3 h-3 bg-[#001F3F] rotate-45" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-5 py-2.5 bg-[#F8FAFC] text-[#CBD5E1] rounded-xl font-extrabold text-sm border border-[#E2E8F0] select-none">
                                        CLAIM
                                    </div>
                                </div>
                            ) : (
                                <button onClick={handleOpenClaimModal}
                                    className="px-7 py-2.5 text-white rounded-xl font-extrabold text-sm uppercase tracking-wide transition-all hover:-translate-y-0.5"
                                    style={{ background: "linear-gradient(135deg,#00A8E8,#0090CC)", boxShadow: "0 6px 18px rgba(0,168,232,0.28)" }}>
                                    CLAIM
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Details toggle */}
                    <div className="mb-8">
                        <button onClick={() => setShowDetails(prev => !prev)}
                            className="flex items-center gap-2 text-xs font-extrabold text-[#94A3B8] uppercase tracking-widest hover:text-[#00A8E8] transition-colors group">
                            <ChevronRight size={14} className={`transition-transform duration-200 group-hover:text-emerald-500 ${showDetails ? "rotate-90" : ""}`} />
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
                                <div className="border-t border-[#F1F5F9] pt-5">
                                    <h2 className="text-xs font-extrabold text-[#94A3B8] uppercase tracking-widest mb-3">Description</h2>
                                    <p className="text-[#475569] leading-relaxed text-sm">{item.description || "No description provided."}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <ClaimTracker existingClaim={existingClaim} formatDate={formatDate} />
                    <FinderTracker existingFinderReport={existingFinderReport} formatDate={formatDate} />
                    {isMyItem && isLost && <OwnerFinderTracker item={item} existingFinderReport={existingFinderReport} />}
                    {isMyItem && !isLost && <FoundItemOwnerTracker item={item} pendingClaimsCount={itemPendingClaimsCount} approvedClaimsCount={itemApprovedClaimsCount} />}
                </div>
            </div>

            {/* ═══ CLAIM MODAL ══════════════════════════════════════════════════ */}
            {showClaimModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <Backdrop onClick={handleCloseClaimModal} />
                    <ModalCard>
                        <ModalHeader title="Submit a Claim" subtitle={<>Prove ownership for <span className="font-bold text-emerald-500">{item.title}</span></>} onClose={handleCloseClaimModal} />

                        {claimSubmitted ? (
                            <div className="px-8 py-10 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                    <CheckCircle size={28} className="text-emerald-500" />
                                </div>
                                <h3 className="text-lg font-extrabold text-[#001F3F] mb-1">Claim Submitted!</h3>
                                <p className="text-sm text-[#64748B] leading-relaxed mb-6">
                                    Your claim is received. Now <span className="font-bold text-[#001F3F]">go to the SAO in person</span>, bring a valid school ID, and present yourself as the owner — the admin will verify and approve you on the spot.
                                </p>
                                <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-7 text-left">
                                    <p className="text-xs font-extrabold text-amber-600 uppercase tracking-wide mb-3">⚠️ What to do next</p>
                                    <ul className="text-xs text-amber-700 space-y-2">
                                        <li className="flex items-start gap-2"><span className="font-bold">1.</span> Visit the SAO office with your school ID</li>
                                        <li className="flex items-start gap-2"><span className="font-bold">2.</span> Admin verifies your identity in person</li>
                                        <li className="flex items-start gap-2"><span className="font-bold">3.</span> Claim approved — collect your item</li>
                                    </ul>
                                </div>
                                <button onClick={handleCloseClaimModal}
                                    className="w-full py-3.5 rounded-xl text-white font-extrabold text-sm transition"
                                    style={{ background: "#001F3F" }}>
                                    Understood
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmitClaim} className="px-8 py-6 space-y-5">
                                <div>
                                    <LabelRow icon={<Phone size={12} />} required>Contact Phone</LabelRow>
                                    <input type="tel" required value={claimForm.contactPhone} onChange={(e) => setClaimForm(prev => ({ ...prev, contactPhone: e.target.value.replace(/[^0-9+\s-]/g, "") }))} placeholder="+63 912 345 6789" className={inputCls} />
                                </div>
                                <div>
                                    <LabelRow icon={<Mail size={12} />} required>Contact Email</LabelRow>
                                    <input type="email" required value={claimForm.contactEmail} onChange={(e) => setClaimForm(prev => ({ ...prev, contactEmail: e.target.value }))} placeholder="you@university.edu" className={inputCls} />
                                </div>
                                <div>
                                    <LabelRow required>Proof of Ownership</LabelRow>
                                    <textarea value={claimForm.proofDescription} onChange={(e) => setClaimForm(prev => ({ ...prev, proofDescription: e.target.value }))} placeholder="Describe why this item belongs to you — serial numbers, marks, contents, when/where you lost it…" rows={4} required className={textareaCls} />
                                </div>
                                <div>
                                    <LabelRow>Proof Images <span className="text-[#CBD5E1] font-normal normal-case tracking-normal ml-1">(Optional · Max 3)</span></LabelRow>
                                    <ProofThumbs proofs={claimProofs} onRemove={removeProof} />
                                    <UploadZone disabled={claimProofs.length >= 3} onChange={handleProofUpload} />
                                </div>
                                <PrimaryBtn disabled={submittingClaim} loading={submittingClaim} color="#10B981" shadow="rgba(16,185,129,0.25)">Submit Claim</PrimaryBtn>
                                <p className="text-[11px] text-[#94A3B8] text-center">An admin will review your claim and notify you of the decision.</p>
                            </form>
                        )}
                    </ModalCard>
                </div>
            )}

            {/* ═══ EDIT MODAL ═══════════════════════════════════════════════════ */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <Backdrop onClick={handleCloseEditModal} />
                    <ModalCard>
                        <ModalHeader title="Edit Post" subtitle="Update the details for this item" onClose={handleCloseEditModal} />
                        <form onSubmit={handleSubmitEdit} className="px-8 py-6 space-y-5">
                            <div>
                                <LabelRow required>Title</LabelRow>
                                <input type="text" required value={editForm.title} onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))} placeholder="What is the item?" className={inputCls} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <LabelRow>Category</LabelRow>
                                    <select value={editForm.category} onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))} className={inputCls}>
                                        <option value="">Select…</option>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <LabelRow>Date</LabelRow>
                                    <input type="date" value={editForm.date} onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))} className={inputCls} />
                                </div>
                            </div>
                            <div>
                                <LabelRow>Location</LabelRow>
                                <input type="text" value={editForm.location} onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))} placeholder="Where was it lost/found?" className={inputCls} />
                            </div>
                            <div>
                                <LabelRow>Description</LabelRow>
                                <textarea value={editForm.description} onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe the item in detail…" rows={3} className={textareaCls} />
                            </div>
                            <div>
                                <LabelRow>Photos <span className="text-[#CBD5E1] font-normal normal-case tracking-normal ml-1">(Max 5)</span></LabelRow>
                                <ProofThumbs proofs={editImages} onRemove={removeEditImage} />
                                <UploadZone disabled={editImages.length >= 5} onChange={handleEditImageUpload} />
                            </div>
                            <PrimaryBtn disabled={submittingEdit} loading={submittingEdit}>Save Changes</PrimaryBtn>
                        </form>
                    </ModalCard>
                </div>
            )}

            {/* ═══ DELETE CONFIRM ═══════════════════════════════════════════════ */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <Backdrop onClick={() => setShowDeleteConfirm(false)} />
                    <div className="relative bg-white w-full max-w-sm p-8 text-center" style={{ borderRadius: "24px", boxShadow: "0 32px 64px rgba(0,31,63,0.2)" }}>
                        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={26} className="text-red-500" />
                        </div>
                        <h2 className="text-lg font-extrabold text-[#001F3F] mb-2">Delete this post?</h2>
                        <p className="text-sm text-[#64748B] mb-7 leading-relaxed">This action cannot be undone. The item and all associated claims will be permanently removed.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-3 rounded-xl border border-[#E2E8F0] text-[#001F3F] font-bold text-sm hover:bg-[#F8FAFC] transition">
                                Cancel
                            </button>
                            <button onClick={handleDeleteItem} disabled={deletingItem}
                                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-extrabold text-sm hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
                                {deletingItem ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Trash2 size={15} />}
                                {deletingItem ? "Deleting…" : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ REPORT MODAL ═════════════════════════════════════════════════ */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <Backdrop onClick={handleCloseReportModal} />
                    <ModalCard maxW="max-w-sm">
                        <div className="flex items-center justify-between px-7 py-5 border-b border-[#F1F5F9]">
                            <div>
                                <h2 className="text-base font-extrabold text-[#001F3F]">Report Post</h2>
                                <p className="text-xs text-[#94A3B8] mt-0.5 font-medium">Help keep {siteName} accurate</p>
                            </div>
                            <button onClick={handleCloseReportModal} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#F1F5F9] transition text-[#94A3B8]">
                                <X size={16} />
                            </button>
                        </div>
                        {reportSubmitted ? (
                            <div className="p-8 text-center">
                                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={26} className="text-emerald-500" />
                                </div>
                                <h3 className="font-extrabold text-[#001F3F] mb-2">Report Submitted</h3>
                                <p className="text-sm text-[#64748B] mb-6">Thanks for helping keep {siteName} accurate. Our team will review this post.</p>
                                <button onClick={handleCloseReportModal} className="w-full py-3 rounded-xl text-white font-bold text-sm transition" style={{ background: "#001F3F" }}>Done</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmitReport} className="px-7 py-5 space-y-4">
                                <div>
                                    <LabelRow required>Reason</LabelRow>
                                    <div className="space-y-2">
                                        {REPORT_REASONS.map(({ value, label }) => (
                                            <label key={value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${reportReason === value ? "border-[#00A8E8] bg-[#EBF8FF]" : "border-[#F1F5F9] hover:border-[#E2E8F0]"}`}>
                                                <input type="radio" name="reportReason" value={value} checked={reportReason === value} onChange={(e) => setReportReason(e.target.value)} className="sr-only" />
                                                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${reportReason === value ? "border-[#00A8E8] bg-[#00A8E8]" : "border-[#CBD5E1]"}`}>
                                                    {reportReason === value && <div className="w-full h-full rounded-full bg-white scale-[0.4]" />}
                                                </div>
                                                <span className="text-sm font-semibold text-[#001F3F]">{label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <LabelRow>Additional Details <span className="text-[#CBD5E1] font-normal normal-case tracking-normal ml-1">(Optional)</span></LabelRow>
                                    <textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} placeholder="Any additional context…" rows={3} className={textareaCls} />
                                </div>
                                <button type="submit" disabled={submittingReport || !reportReason}
                                    className="w-full bg-red-500 text-white py-3 rounded-xl font-extrabold text-sm hover:bg-red-600 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {submittingReport ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Flag size={15} />}
                                    {submittingReport ? "Submitting…" : "Submit Report"}
                                </button>
                            </form>
                        )}
                    </ModalCard>
                </div>
            )}

            {/* ═══ FINDER MODAL ═════════════════════════════════════════════════ */}
            {showFinderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <Backdrop onClick={handleCloseFinderModal} />
                    <ModalCard>
                        <ModalHeader title="I Found This Item" subtitle={<>Help return <span className="font-bold text-emerald-500">{item.title}</span> to its owner</>} onClose={handleCloseFinderModal} />

                        {/* SAO banner */}
                        <div className="mx-8 mt-6 flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
                            <MapPin size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-extrabold text-emerald-700">You must bring this item to the SAO</p>
                                <p className="text-xs text-emerald-600 mt-0.5">After submitting this form, please turn over the item to the Student Affairs Office so it can be returned to its owner.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitFinderReport} className="px-8 py-6 space-y-5">
                            <div>
                                <LabelRow icon={<Phone size={12} />} required>Your Contact Phone</LabelRow>
                                <input type="tel" required value={finderForm.contactPhone} onChange={(e) => setFinderForm(prev => ({ ...prev, contactPhone: e.target.value.replace(/[^0-9+\s-]/g, "") }))} placeholder="+63 912 345 6789" className={inputCls} />
                            </div>
                            <div>
                                <LabelRow icon={<Mail size={12} />} required>Your Contact Email</LabelRow>
                                <input type="email" required value={finderForm.contactEmail} onChange={(e) => setFinderForm(prev => ({ ...prev, contactEmail: e.target.value }))} placeholder="you@university.edu" className={inputCls} />
                            </div>
                            <div>
                                <LabelRow required>Where / How did you find it?</LabelRow>
                                <textarea required value={finderForm.finderDescription} onChange={(e) => setFinderForm(prev => ({ ...prev, finderDescription: e.target.value }))} placeholder="Describe where you found it, when, and any details that might help identify the owner…" rows={4} className={textareaCls} />
                            </div>
                            <div>
                                <LabelRow>Photos of Item <span className="text-[#CBD5E1] font-normal normal-case tracking-normal ml-1">(Optional · Max 3)</span></LabelRow>
                                <ProofThumbs proofs={finderProofs} onRemove={removeFinderProof} borderColor="border-emerald-300/50" />
                                <UploadZone disabled={finderProofs.length >= 3} onChange={handleFinderProofUpload} hoverColor="#10B981" hoverBg="rgba(236,253,245,0.6)" />
                            </div>
                            <PrimaryBtn disabled={submittingFinder} loading={submittingFinder} color="#10B981" shadow="rgba(16,185,129,0.25)">
                                <MapPin size={15} /> Submit & Bring to SAO
                            </PrimaryBtn>
                            <p className="text-[11px] text-[#94A3B8] text-center">An admin will verify your report and connect you with the item's owner.</p>
                        </form>
                    </ModalCard>
                </div>
            )}
        </div>
    );
}

export default ItemDetail;