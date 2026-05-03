import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";

// ── Icons (matching Dashboard) ─────────────────────────────────────────────────
const UploadIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);
const XIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const CheckCircleIcon = ({ className = "w-14 h-14" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const ReportIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);
// ──────────────────────────────────────────────────────────────────────────────

function ReportItemsPage() {
    const navigate = useNavigate();

    // Form states
    const [type, setType] = useState("lost");
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [date, setDate] = useState("");
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (!savedUser) {
            navigate("/login");
        }
    }, [navigate]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => setImages((prev) => [...prev, reader.result]);
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => setImages((prev) => prev.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!title || !category || !description || !location || !date) {
            setError("Please fill in all required fields.");
            setLoading(false);
            return;
        }

        try {
            await api.addItem({ title, type: type.toLowerCase(), category, description, location, date: new Date(date), images });
            setSuccess(true);
        } catch (err) {
            console.error("Failed to submit item:", err);
            setError("Failed to submit report. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Context-aware labels ──────────────────────────────────────────────────
    const isLost = type === "lost";
    const labels = {
        location: isLost ? "Last Seen Location" : "Found Location",
        locationPlaceholder: isLost ? "e.g. Where did you last have it?" : "e.g. Where did you find it?",
        date: isLost ? "Date Lost" : "Date Found",
        descriptionPlaceholder: isLost
            ? "Describe the item — color, brand, size, any unique features or marks…"
            : "Describe the item — color, brand, size, condition when found…",
    };
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="p-6 lg:p-8 max-w-4xl mx-auto">

            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#001F3F]">
                    Report <span className="text-[#00A8E8]">Item</span>
                </h1>
                <p className="text-gray-400 mt-1 text-sm">
                    Help us reunite lost items with their owners
                </p>
            </div>

            {/* ── SUCCESS STATE ── */}
            {success ? (
                <div
                    className="bg-white rounded-2xl overflow-hidden"
                    style={{ border: "1.5px solid #F1F5F9", boxShadow: "0 8px 24px rgba(0,31,63,0.06), 0 1px 4px rgba(0,31,63,0.04)" }}
                >
                    {/* Top accent stripe */}
                    <div className={`h-1 w-full ${type === "found" ? "bg-emerald-500" : "bg-[#00A8E8]"}`} />

                    <div className="px-8 py-12 flex flex-col items-center text-center">
                        {/* Icon */}
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${type === "found" ? "bg-emerald-50" : "bg-[#EBF8FF]"}`}>
                            <CheckCircleIcon className={`w-8 h-8 ${type === "found" ? "text-emerald-500" : "text-[#00A8E8]"}`} />
                        </div>

                        <h2 className="text-2xl font-extrabold text-[#001F3F] tracking-tight mb-1">Report Submitted!</h2>
                        <p className="text-sm text-[#94A3B8] font-medium max-w-sm">
                            {type === "found"
                                ? "Your found item report has been recorded and is pending admin review."
                                : "Your lost item report is live. We'll notify you if someone finds it."}
                        </p>

                        {/* SAO notice — found items only, consolidated */}
                        {type === "found" && (
                            <div className="mt-6 w-full max-w-md bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-left flex items-start gap-3">
                                <div className="w-8 h-8 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-extrabold text-amber-800 mb-0.5">Action Required — Bring Item to SAO</p>
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                        Please turn over the item to the <span className="font-bold">Student Affairs Office</span> as soon as possible so the owner can reclaim it.
                                    </p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => navigate("/dashboard")}
                            className="mt-7 px-8 py-3 rounded-xl text-white font-extrabold text-xs uppercase tracking-widest transition-all duration-200 hover:-translate-y-0.5"
                            style={{ background: "linear-gradient(135deg,#00A8E8,#0090CC)", boxShadow: "0 6px 18px rgba(0,168,232,0.28)" }}
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ── TYPE TOGGLE ── */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-2 flex gap-2 shadow-sm">
                        <button
                            type="button"
                            onClick={() => setType("lost")}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${type === "lost"
                                ? "bg-red-500 text-white shadow-md shadow-red-200"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                            </svg>
                            Lost Item
                        </button>
                        <button
                            type="button"
                            onClick={() => setType("found")}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${type === "found"
                                ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Found Item
                        </button>
                    </div>

                    {/* ── ERROR BANNER ── */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* ── FORM CARD ── */}
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

                        {/* Card header stripe */}
                        <div className={`h-1 w-full transition-all duration-500 ${type === "lost" ? "bg-red-500" : "bg-emerald-500"}`} />

                        <div className="p-6 lg:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Item Name */}
                                <FormField label="Item Name" icon={
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>
                                }>
                                    <input
                                        type="text"
                                        placeholder="e.g. Black iPhone 14 Pro"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        className="w-full bg-[#F5F6F8] border border-gray-200 px-4 py-3 rounded-xl text-sm font-medium text-[#001F3F] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/20 focus:border-[#00A8E8] transition-all duration-200"
                                    />
                                </FormField>

                                {/* Category */}
                                <FormField label="Category" icon={
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
                                }>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        required
                                        className="w-full bg-[#F5F6F8] border border-gray-200 px-4 py-3 rounded-xl text-sm font-medium text-[#001F3F] focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/20 focus:border-[#00A8E8] transition-all duration-200 appearance-none cursor-pointer"
                                    >
                                        <option value="">Select a category</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Documents">Documents</option>
                                        <option value="Bags">Bags &amp; Luggage</option>
                                        <option value="Keys">Keys</option>
                                        <option value="Wallet">Wallet &amp; Cards</option>
                                        <option value="Clothing">Clothing</option>
                                        <option value="Others">Others</option>
                                    </select>
                                </FormField>

                                {/* Description */}
                                <div className="md:col-span-2">
                                    <FormField label="Description" icon={
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
                                    }>
                                        <textarea
                                            rows={4}
                                            placeholder={labels.descriptionPlaceholder}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            required
                                            className="w-full bg-[#F5F6F8] border border-gray-200 px-4 py-3 rounded-xl text-sm font-medium text-[#001F3F] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/20 focus:border-[#00A8E8] transition-all duration-200 resize-none"
                                        />
                                    </FormField>
                                </div>

                                {/* Location */}
                                <FormField label={labels.location} icon={
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                                }>
                                    <input
                                        type="text"
                                        placeholder={labels.locationPlaceholder}
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        required
                                        className="w-full bg-[#F5F6F8] border border-gray-200 px-4 py-3 rounded-xl text-sm font-medium text-[#001F3F] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/20 focus:border-[#00A8E8] transition-all duration-200"
                                    />
                                </FormField>

                                {/* Date */}
                                <FormField label={labels.date} icon={
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                                }>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                        className="w-full bg-[#F5F6F8] border border-gray-200 px-4 py-3 rounded-xl text-sm font-medium text-[#001F3F] focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/20 focus:border-[#00A8E8] transition-all duration-200"
                                    />
                                </FormField>

                                {/* Upload Photos */}
                                <div className="md:col-span-2">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                                        <UploadIcon className="w-3.5 h-3.5" />
                                        Upload Photos
                                        <span className="text-gray-300 font-normal normal-case tracking-normal">(optional)</span>
                                    </label>

                                    {/* Image previews */}
                                    {images.length > 0 && (
                                        <div className="flex gap-3 mb-4 flex-wrap">
                                            {images.map((img, idx) => (
                                                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group shadow-sm">
                                                    <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(idx)}
                                                        className="absolute top-1 right-1 w-5 h-5 bg-[#001F3F]/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                                    >
                                                        <XIcon className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Drop zone */}
                                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-[#00A8E8] hover:bg-[#00A8E8]/5 transition-all duration-200 group">
                                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-[#00A8E8]/10 transition-colors duration-200">
                                            <UploadIcon className="w-5 h-5 text-gray-300 group-hover:text-[#00A8E8] transition-colors duration-200" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-400 group-hover:text-[#001F3F] transition-colors duration-200">
                                            Click to upload or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-300 mt-1">PNG, JPG up to 5MB each</p>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── SUBMIT ── */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${type === "lost"
                            ? "bg-[#001F3F] hover:bg-[#00A8E8] text-white shadow-[#001F3F]/20 hover:shadow-[#00A8E8]/30"
                            : "bg-[#00A8E8] hover:bg-[#001F3F] text-white shadow-[#00A8E8]/20 hover:shadow-[#001F3F]/20"
                            } disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5`}
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Submitting…
                            </>
                        ) : (
                            <>
                                <ReportIcon className="w-4 h-4" />
                                Submit Report
                            </>
                        )}
                    </button>
                </form>
            )}
        </div>
    );
}

// ── Form Field wrapper ────────────────────────────────────────────────────────
function FormField({ label, icon, children }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="text-gray-300">{icon}</span>
                {label}
            </label>
            {children}
        </div>
    );
}

export default ReportItemsPage;
