import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../services/api";
import { useSettings } from "../../contexts/SettingsContext";
import {
    ArrowLeft, MapPin, Calendar, User, Tag, X,
    Upload, CheckCircle, Clock, Phone, Mail, Star,
    ChevronRight, Package
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

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            const user = JSON.parse(savedUser);
            setClaimForm(prev => ({ ...prev, contactEmail: user.email || "" }));
        } else {
            navigate("/login");
        }
        fetchItemDetails();
        checkExistingClaim();
    }, [id, navigate]);

    const fetchItemDetails = async () => {
        try {
            setLoading(true);
            const data = await api.getItem(id);
            setItem(data);
        } catch (err) {
            if (err.message.includes("401")) navigate("/login");
            else if (err.message.includes("404")) navigate("/search");
        } finally {
            setLoading(false);
        }
    };

    const checkExistingClaim = async () => {
        try {
            const myClaims = await api.getMyClaims();
            const existing = myClaims.find(c => c.item._id === id || c.item === id);
            setExistingClaim(existing);
        } catch (_) { }
    };

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

    const formatDate = (ds) => {
        if (!ds) return "N/A";
        return new Date(ds).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    };

    const getClaimStatusConfig = () => {
        if (!existingClaim) return null;
        const map = {
            pending: { text: "Claim Pending Review", bg: "bg-amber-50", text_c: "text-amber-600", border: "border-amber-200", icon: Clock, banner: null },
            approved: { text: "Claim Approved", bg: "bg-emerald-50", text_c: "text-emerald-600", border: "border-emerald-200", icon: CheckCircle, banner: null },
            rejected: { text: "Claim Rejected", bg: "bg-red-50", text_c: "text-red-600", border: "border-red-200", icon: X, banner: null },
            delivered_to_sao: { text: "Ready for Pickup at SAO", bg: "bg-[#00A8E8]/5", text_c: "text-[#00A8E8]", border: "border-[#00A8E8]/30", icon: MapPin, banner: "blue" },
            picked_up: { text: "Picked Up from SAO ✓", bg: "bg-purple-50", text_c: "text-purple-600", border: "border-purple-200", icon: Star, banner: "purple" },
        };
        return map[existingClaim.status] || null;
    };

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
    const isMyItem = item.reportedBy?._id === JSON.parse(localStorage.getItem("user") || "{}").id;
    const claimConfig = getClaimStatusConfig();
    const allImages = item.images || [];

    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">

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

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">

                {/* ── Hero Image ────────────────────────────────────────────── */}
                <div className="relative h-96 bg-[#F5F6F8]">
                    {allImages[activeImageIdx] ? (
                        <img
                            src={allImages[activeImageIdx]}
                            alt={item.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                                <Package size={52} className="mx-auto mb-2 text-gray-200" />
                                <p className="text-sm font-medium text-gray-300">No image available</p>
                            </div>
                        </div>
                    )}

                    {/* Type badge */}
                    <div className={`absolute top-5 left-5 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md ${isLost
                        ? "bg-red-500 text-white shadow-red-200"
                        : "bg-emerald-500 text-white shadow-emerald-200"
                        }`}>
                        {isLost ? "Lost" : "Found"}
                    </div>
                </div>

                {/* Thumbnails (if multiple images) */}
                {allImages.length > 1 && (
                    <div className="px-8 pt-4 flex gap-3 border-b border-gray-100 pb-4">
                        {allImages.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveImageIdx(idx)}
                                className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${activeImageIdx === idx ? "border-[#00A8E8]" : "border-transparent hover:border-gray-200"
                                    }`}
                            >
                                <img src={img} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Details Body ──────────────────────────────────────────── */}
                <div className="p-8">

                    {/* Title row */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-black text-[#001F3F] leading-tight">{item.title}</h1>
                            <p className="text-xs text-gray-400 font-medium mt-1.5">ID: #{id?.slice(-8).toUpperCase()}</p>
                        </div>

                        {/* Action badge / button */}
                        {isClaimed ? (
                            <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-sm border border-emerald-200">
                                <CheckCircle size={16} /> Claimed
                            </div>
                        ) : claimConfig ? (
                            <div className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border ${claimConfig.bg} ${claimConfig.text_c} ${claimConfig.border}`}>
                                <claimConfig.icon size={16} /> {claimConfig.text}
                            </div>
                        ) : isMyItem ? (
                            <div className="flex-shrink-0 px-5 py-2.5 bg-gray-100 text-gray-400 rounded-xl font-bold text-sm border border-gray-200">
                                Your Item
                            </div>
                        ) : (
                            <button
                                onClick={handleOpenClaimModal}
                                className="flex-shrink-0 px-7 py-2.5 bg-[#00A8E8] text-white rounded-xl font-black text-sm uppercase tracking-wide hover:bg-[#0096d1] transition-all duration-200 shadow-lg shadow-[#00A8E8]/25 hover:-translate-y-0.5"
                            >
                                CLAIM
                            </button>
                        )}
                    </div>

                    {/* Meta grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        <InfoCard icon={<Tag size={16} className="text-[#00A8E8]" />} label="Category" value={item.category || "Uncategorized"} />
                        <InfoCard icon={<Calendar size={16} className="text-[#00A8E8]" />} label="Date" value={formatDate(item.date)} />
                        <InfoCard icon={<MapPin size={16} className="text-[#00A8E8]" />} label="Location" value={item.location} />
                        <InfoCard icon={<User size={16} className="text-[#00A8E8]" />} label="Reported By" value={item.reportedBy?.name || "Anonymous"} />
                    </div>

                    {/* Description */}
                    <div className="border-t border-gray-100 pt-7">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Description</h2>
                        <p className="text-gray-600 leading-relaxed text-sm">
                            {item.description || "No description provided."}
                        </p>
                    </div>

                    {/* Claim status detail */}
                    {existingClaim && claimConfig && (
                        <div className={`mt-8 rounded-2xl border overflow-hidden ${claimConfig.border}`}>

                            {existingClaim.status === "delivered_to_sao" && (
                                <div className="bg-[#00A8E8] px-6 py-4 flex items-center gap-3">
                                    <MapPin className="w-5 h-5 text-white flex-shrink-0" />
                                    <div>
                                        <p className="text-white font-black text-sm">Your item is at the SAO — ready for pickup!</p>
                                        <p className="text-white/70 text-xs mt-0.5">Bring a valid school ID when you visit.</p>
                                    </div>
                                </div>
                            )}
                            {existingClaim.status === "picked_up" && (
                                <div className="bg-purple-600 px-6 py-4 flex items-center gap-3">
                                    <Star className="w-5 h-5 text-white flex-shrink-0" />
                                    <p className="text-white font-black text-sm">Item successfully picked up from SAO. Case closed!</p>
                                </div>
                            )}

                            <div className={`p-6 ${claimConfig.bg}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <claimConfig.icon size={16} className={claimConfig.text_c} />
                                    <h3 className="font-black text-[#001F3F] text-sm uppercase tracking-wide">Your Claim Status</h3>
                                </div>
                                <p className="text-xs text-gray-400 mb-4">Submitted on {formatDate(existingClaim.createdAt)}</p>

                                {existingClaim.status === "delivered_to_sao" && (
                                    <div className="space-y-1.5 mb-3">
                                        {existingClaim.saoNotes && <p className="text-sm text-[#00A8E8] font-medium">📌 {existingClaim.saoNotes}</p>}
                                        {existingClaim.saoDeliveredAt && <p className="text-xs text-gray-500">Arrived at SAO: {formatDate(existingClaim.saoDeliveredAt)}</p>}
                                        {existingClaim.item?.saoPickupDeadline && <p className="text-xs font-bold text-red-500">⚠️ Pickup deadline: {formatDate(existingClaim.item.saoPickupDeadline)}</p>}
                                    </div>
                                )}
                                {existingClaim.status === "picked_up" && existingClaim.pickedUpAt && (
                                    <p className="text-sm text-purple-600 mb-3">Picked up on: {formatDate(existingClaim.pickedUpAt)}</p>
                                )}
                                {existingClaim.reviewNotes && (
                                    <p className="text-sm text-gray-600"><span className="font-semibold">Admin Notes:</span> {existingClaim.reviewNotes}</p>
                                )}
                                {existingClaim.rejectionReason && (
                                    <p className="text-sm text-red-600 mt-1"><span className="font-semibold">Reason:</span> {existingClaim.rejectionReason}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ CLAIM MODAL ════════════════════════════════════════════════════ */}
            {showClaimModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#001F3F]/60 backdrop-blur-sm" onClick={handleCloseClaimModal} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">

                        {/* Modal header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-black text-[#001F3F]">Submit a Claim</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Prove ownership for <span className="font-semibold text-[#00A8E8]">{item.title}</span></p>
                            </div>
                            <button
                                onClick={handleCloseClaimModal}
                                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-gray-700"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitClaim} className="px-8 py-6 space-y-5">

                            {/* Phone */}
                            <div>
                                <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">
                                    <Phone size={12} /> Contact Phone <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={claimForm.contactPhone}
                                    onChange={(e) => setClaimForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                                    placeholder="+63 912 345 6789"
                                    className="w-full bg-[#F5F6F8] border border-gray-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/30 focus:border-[#00A8E8] transition text-sm font-medium text-[#001F3F] placeholder:text-gray-300"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">
                                    <Mail size={12} /> Contact Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={claimForm.contactEmail}
                                    onChange={(e) => setClaimForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                                    placeholder="you@university.edu"
                                    className="w-full bg-[#F5F6F8] border border-gray-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/30 focus:border-[#00A8E8] transition text-sm font-medium text-[#001F3F] placeholder:text-gray-300"
                                />
                            </div>

                            {/* Proof description */}
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 block">
                                    Proof of Ownership <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={claimForm.proofDescription}
                                    onChange={(e) => setClaimForm(prev => ({ ...prev, proofDescription: e.target.value }))}
                                    placeholder="Describe why this item belongs to you — serial numbers, marks, contents, when/where you lost it…"
                                    rows={4}
                                    required
                                    className="w-full bg-[#F5F6F8] border border-gray-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/30 focus:border-[#00A8E8] transition text-sm font-medium text-[#001F3F] placeholder:text-gray-300 resize-none"
                                />
                            </div>

                            {/* Upload */}
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 block">
                                    Proof Images <span className="text-gray-300 font-normal normal-case">(Optional · Max 3)</span>
                                </label>

                                {claimProofs.length > 0 && (
                                    <div className="flex gap-2 mb-3 flex-wrap">
                                        {claimProofs.map((proof, idx) => (
                                            <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-[#00A8E8]/30 group">
                                                <img src={proof} alt="" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeProof(idx)}
                                                    className="absolute inset-0 bg-[#001F3F]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white"
                                                >
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

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={submittingClaim}
                                className="w-full bg-[#00A8E8] text-white py-3.5 rounded-xl font-black uppercase tracking-wide text-sm hover:bg-[#0096d1] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#00A8E8]/25"
                            >
                                {submittingClaim ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Submitting…
                                    </>
                                ) : "Submit Claim"}
                            </button>

                            <p className="text-[11px] text-gray-400 text-center">
                                An admin will review your claim and notify you of the decision.
                            </p>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ItemDetail;