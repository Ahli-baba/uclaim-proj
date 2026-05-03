import { useState } from "react";
import { X, Upload, Phone, Mail, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { api } from "../services/api";

function ClaimModal({ item, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        proofDescription: "",
        contactPhone: "",
        contactEmail: "",
        proofImages: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [uploadingImages, setUploadingImages] = useState(false);

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        setUploadingImages(true);
        const uploadedUrls = [];
        try {
            for (const file of files) {
                const reader = new FileReader();
                const promise = new Promise((resolve) => {
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                });
                const base64 = await promise;
                uploadedUrls.push(base64);
            }
            setFormData(prev => ({ ...prev, proofImages: [...prev.proofImages, ...uploadedUrls] }));
        } catch {
            setError("Failed to upload images");
        } finally {
            setUploadingImages(false);
        }
    };

    const removeImage = (index) => {
        setFormData(prev => ({ ...prev, proofImages: prev.proofImages.filter((_, i) => i !== index) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await api.submitClaim(item._id, formData);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || "Failed to submit claim");
        } finally {
            setLoading(false);
        }
    };

    const savedUser = localStorage.getItem("user");
    const userEmail = savedUser ? JSON.parse(savedUser).email : "";

    const isValid = formData.proofDescription && formData.contactPhone && formData.contactEmail;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
                .claim-modal * { font-family: 'Sora', sans-serif; }
                @keyframes modalIn {
                    from { opacity: 0; transform: translateY(16px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                .claim-modal-card { animation: modalIn 0.3s cubic-bezier(0.16,1,0.3,1) both; }
                .claim-input {
                    width: 100%;
                    background: #F8FAFC;
                    border: 1.5px solid #E2E8F0;
                    border-radius: 14px;
                    padding: 12px 16px;
                    font-size: 13px;
                    font-family: 'Sora', sans-serif;
                    color: #001F3F;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
                }
                .claim-input::placeholder { color: #94A3B8; }
                .claim-input:focus {
                    border-color: #00A8E8;
                    background: #fff;
                    box-shadow: 0 0 0 3px rgba(0,168,232,0.12);
                }
                .claim-textarea { resize: none; min-height: 110px; }
                .claim-scrollbar::-webkit-scrollbar { width: 4px; }
                .claim-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .claim-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 99px; }
            `}</style>

            <div className="claim-modal fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-[#001F3F]/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Card */}
                <div
                    className="claim-modal-card relative bg-white w-full max-w-xl max-h-[92vh] overflow-y-auto claim-scrollbar flex flex-col"
                    style={{
                        borderRadius: "24px",
                        boxShadow: "0 32px 64px rgba(0,31,63,0.22), 0 8px 24px rgba(0,31,63,0.12)",
                    }}
                >
                    {/* Header */}
                    <div
                        className="sticky top-0 z-10 bg-white flex items-center justify-between px-6 py-5"
                        style={{ borderBottom: "1.5px solid #F1F5F9" }}
                    >
                        <div>
                            <h2 className="text-xl font-extrabold text-[#001F3F] tracking-tight">
                                Claim This Item
                            </h2>
                            <p className="text-xs text-[#94A3B8] mt-0.5 font-medium">
                                Prove ownership of{" "}
                                <span className="font-bold text-[#00A8E8]">{item.title}</span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#94A3B8] transition-all hover:bg-[#F1F5F9] hover:text-[#001F3F]"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Item Preview */}
                    <div
                        className="mx-6 mt-5 mb-1 flex items-center gap-4 p-4 rounded-2xl"
                        style={{
                            background: "linear-gradient(135deg, #EBF8FF 0%, #F0FAFF 100%)",
                            border: "1.5px solid #D0EFFA",
                        }}
                    >
                        <div
                            className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-[#E0F4FC] flex items-center justify-center"
                            style={{ border: "1.5px solid #C5E9F7" }}
                        >
                            {item.images?.[0] ? (
                                <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl">📦</span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-[#001F3F] text-sm truncate">{item.title}</h3>
                            <p className="text-[11px] text-[#64A8C8] mt-0.5 capitalize font-medium">
                                {item.type} · {item.category} · {item.location}
                            </p>
                            <p className="text-[10px] text-[#94A3B8] mt-1 font-semibold tracking-wide">
                                ID #{item._id?.slice(-6).toUpperCase()}
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6 space-y-5">

                        {/* Error */}
                        {error && (
                            <div
                                className="flex items-center gap-3 p-4 rounded-2xl"
                                style={{ background: "#FFF1F2", border: "1.5px solid #FECDD3" }}
                            >
                                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <p className="text-xs text-red-600 font-semibold">{error}</p>
                            </div>
                        )}

                        {/* Proof Description */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-[#001F3F] mb-1.5 uppercase tracking-wide">
                                <FileText className="w-3.5 h-3.5 text-[#00A8E8]" />
                                Proof of Ownership
                                <span className="text-[#00A8E8]">*</span>
                            </label>
                            <p className="text-[11px] text-[#94A3B8] mb-2 font-medium">
                                Describe specific details — serial numbers, contents, distinctive marks, etc.
                            </p>
                            <textarea
                                required
                                value={formData.proofDescription}
                                onChange={(e) => setFormData({ ...formData, proofDescription: e.target.value })}
                                className="claim-input claim-textarea"
                                placeholder="e.g. My blue Jansport backpack contains a MacBook Pro with a 'CS Dept' sticker, student ID 2021-XXXXX, and a red water bottle..."
                                maxLength={1000}
                            />
                            <p className="text-[10px] text-[#94A3B8] mt-1 text-right font-medium">
                                {formData.proofDescription.length}/1000
                            </p>
                        </div>

                        {/* Contact Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-[#001F3F] mb-1.5 uppercase tracking-wide">
                                    <Phone className="w-3.5 h-3.5 text-[#00A8E8]" />
                                    Phone
                                    <span className="text-[#00A8E8]">*</span>
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.contactPhone}
                                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                    className="claim-input"
                                    placeholder="+63 912 345 6789"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-[#001F3F] mb-1.5 uppercase tracking-wide">
                                    <Mail className="w-3.5 h-3.5 text-[#00A8E8]" />
                                    Email
                                    <span className="text-[#00A8E8]">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    defaultValue={userEmail}
                                    value={formData.contactEmail}
                                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                    className="claim-input"
                                    placeholder="you@email.com"
                                />
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-[#001F3F] mb-1.5 uppercase tracking-wide">
                                <Upload className="w-3.5 h-3.5 text-[#00A8E8]" />
                                Supporting Photos
                                <span className="text-[#94A3B8] font-medium normal-case tracking-normal">(Optional)</span>
                            </label>
                            <p className="text-[11px] text-[#94A3B8] mb-3 font-medium">
                                Receipts, ID, or photos of the item as proof.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                {formData.proofImages.map((img, idx) => (
                                    <div
                                        key={idx}
                                        className="relative w-20 h-20 rounded-xl overflow-hidden"
                                        style={{ border: "1.5px solid #E2E8F0" }}
                                    >
                                        <img src={img} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition font-bold"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                <label
                                    className="w-20 h-20 flex flex-col items-center justify-center cursor-pointer rounded-xl transition-all"
                                    style={{
                                        border: "2px dashed #B0D8ED",
                                        background: "#F0FAFF",
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#00A8E8"; e.currentTarget.style.background = "#E0F4FC"; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#B0D8ED"; e.currentTarget.style.background = "#F0FAFF"; }}
                                >
                                    <Upload className="w-5 h-5 text-[#00A8E8] mb-1" />
                                    <span className="text-[10px] text-[#64A8C8] font-bold">Add</span>
                                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploadingImages} />
                                </label>
                            </div>
                            {uploadingImages && (
                                <p className="text-[11px] text-[#00A8E8] mt-2 font-semibold">Uploading...</p>
                            )}
                        </div>

                        {/* Info Box */}
                        <div
                            className="flex items-start gap-3 p-4 rounded-2xl"
                            style={{ background: "#EBF8FF", border: "1.5px solid #C5E9F7" }}
                        >
                            <CheckCircle className="w-4 h-4 text-[#00A8E8] flex-shrink-0 mt-0.5" />
                            <p className="text-[11px] text-[#0070A0] font-medium leading-relaxed">
                                <span className="font-bold text-[#005580]">What happens next?</span>{" "}
                                An admin will review your claim within 24–48 hours. You'll be notified once it's approved or rejected. If approved, the finder will be contacted to arrange return.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-1">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-[#64748B] transition-all hover:bg-[#F1F5F9]"
                                style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0" }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !isValid}
                                className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all"
                                style={{
                                    background: isValid && !loading
                                        ? "linear-gradient(135deg, #00A8E8 0%, #0090CC 100%)"
                                        : "#B0D8ED",
                                    boxShadow: isValid && !loading ? "0 6px 18px rgba(0,168,232,0.32)" : "none",
                                    cursor: loading || !isValid ? "not-allowed" : "pointer",
                                    transform: isValid && !loading ? undefined : "none",
                                }}
                                onMouseEnter={e => { if (isValid && !loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Claim"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export default ClaimModal;
