import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../services/api";
import { ArrowLeft, MapPin, Calendar, User, Tag, X, Upload, CheckCircle, Clock, Phone, Mail } from "lucide-react";

function ItemDetail() {
    const navigate = useNavigate();
    const { id } = useParams();

    // User state
    const [userName, setUserName] = useState("Student");
    const [userEmail, setUserEmail] = useState("");
    const [userRole, setUserRole] = useState("student");
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    // Item state
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);

    // 🔥 NEW: Claim state
    const [existingClaim, setExistingClaim] = useState(null);
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [claimForm, setClaimForm] = useState({
        proofDescription: "",
        contactPhone: "",
        contactEmail: ""
    });
    const [claimProofs, setClaimProofs] = useState([]);
    const [submittingClaim, setSubmittingClaim] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            const user = JSON.parse(savedUser);
            setUserName(user.name.split(" ")[0]);
            setUserEmail(user.email || "student@university.edu");
            setUserRole(user.role || "student");
            // Pre-fill email
            setClaimForm(prev => ({ ...prev, contactEmail: user.email || "" }));
        } else {
            navigate("/login");
        }
        fetchItemDetails();
        checkExistingClaim(); // 🔥 NEW
    }, [id, navigate]);

    const fetchItemDetails = async () => {
        try {
            setLoading(true);
            const data = await api.getItem(id);
            setItem(data);
        } catch (err) {
            console.error("Failed to fetch item:", err);
            if (err.message.includes("401")) navigate("/login");
            else if (err.message.includes("404")) navigate("/search");
        } finally {
            setLoading(false);
        }
    };

    // 🔥 NEW: Check for existing claim
    const checkExistingClaim = async () => {
        try {
            const myClaims = await api.getMyClaims();
            const existing = myClaims.find(c => c.item._id === id || c.item === id);
            setExistingClaim(existing);
        } catch (err) {
            // No existing claim
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const handleLogoClick = () => navigate("/dashboard");
    const capitalizeRole = (role) => role.charAt(0).toUpperCase() + role.slice(1);

    // 🔥 UPDATED: Claim handlers
    const handleOpenClaimModal = () => setShowClaimModal(true);
    const handleCloseClaimModal = () => {
        setShowClaimModal(false);
        setClaimForm({ proofDescription: "", contactPhone: "", contactEmail: userEmail });
        setClaimProofs([]);
    };

    const handleProofUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + claimProofs.length > 3) {
            alert("Maximum 3 images allowed");
            return;
        }
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setClaimProofs(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeProof = (index) => {
        setClaimProofs(prev => prev.filter((_, i) => i !== index));
    };

    // 🔥 UPDATED: Submit claim with proper API
    const handleSubmitClaim = async (e) => {
        e.preventDefault();
        if (!claimForm.proofDescription.trim()) {
            alert("Please provide proof of ownership description");
            return;
        }
        if (!claimForm.contactPhone.trim()) {
            alert("Please provide contact phone number");
            return;
        }

        try {
            setSubmittingClaim(true);
            await api.submitClaim({
                itemId: id,
                proofDescription: claimForm.proofDescription,
                contactPhone: claimForm.contactPhone,
                contactEmail: claimForm.contactEmail || userEmail,
                proofImages: claimProofs
            });
            handleCloseClaimModal();
            checkExistingClaim(); // Refresh claim status
            alert("Claim submitted successfully! An admin will review your request.");
        } catch (err) {
            console.error("Failed to submit claim:", err);
            alert(err.message || "Failed to submit claim. Please try again.");
        } finally {
            setSubmittingClaim(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">
                <div className="flex-1 flex items-center justify-center flex-col">
                    <div className="text-4xl mb-4">😕</div>
                    <h2 className="text-xl font-bold text-gray-900">Item not found</h2>
                    <button onClick={() => navigate("/search")} className="mt-4 text-blue-600 font-bold hover:underline">
                        Back to Search
                    </button>
                </div>
            </div>
        );
    }

    const status = item.type === "lost" ? "Lost" : "Found";
    const isClaimed = item.status === "claimed";
    const isMyItem = item.reportedBy?._id === JSON.parse(localStorage.getItem("user") || "{}").id;

    // 🔥 UPDATED: Get claim status display
    const getClaimStatusDisplay = () => {
        if (!existingClaim) return null;
        switch (existingClaim.status) {
            case "pending":
                return { text: "Claim Pending Review", color: "bg-yellow-50 text-yellow-600 border-yellow-100", icon: Clock };
            case "approved":
                return { text: "Claim Approved!", color: "bg-green-50 text-green-600 border-green-100", icon: CheckCircle };
            case "rejected":
                return { text: "Claim Rejected", color: "bg-red-50 text-red-600 border-red-100", icon: X };
            default:
                return null;
        }
    };

    const claimDisplay = getClaimStatusDisplay();

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen">
                <div className="p-8 flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center relative shadow-sm cursor-pointer hover:scale-105 transition-transform" onClick={handleLogoClick}>
                        <span className="text-white font-extrabold text-lg relative">
                            C<span className="absolute left-1 top-0 text-white font-extrabold text-sm">U</span>
                        </span>
                    </div>
                    <span className="text-2xl font-extrabold text-blue-700 tracking-tight cursor-pointer hover:opacity-80 transition-opacity" onClick={handleLogoClick}>
                        UClaim
                    </span>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <NavItem icon="🏠" label="Dashboard" onClick={() => navigate("/dashboard")} />
                    <NavItem icon="🔍" label="Search Items" onClick={() => navigate("/search")} />
                    <NavItem icon="📄" label="Report Item" onClick={() => navigate("/report")} />
                    <NavItem icon="👤" label="My Profile" onClick={() => navigate("/profile")} />
                </nav>

                <div className="px-6 pb-6 pt-4 border-t border-gray-50">
                    <p className="text-[11px] text-gray-300 font-medium">UClaim © 2025</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 relative">
                {/* Header */}
                <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-end relative">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button onClick={() => { setIsNotificationOpen(!isNotificationOpen); setIsProfileOpen(false); }} className={`w-10 h-10 flex items-center justify-center rounded-full transition relative ${isNotificationOpen ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400 hover:text-blue-600'}`}>
                                <span>🔔</span>
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                            </button>

                            {isNotificationOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsNotificationOpen(false)}></div>
                                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                                        <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                                            <h3 className="font-bold text-gray-900">Notifications</h3>
                                            <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">New</span>
                                        </div>
                                        <div className="p-8 text-center">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-xl opacity-50">🔔</div>
                                            <p className="text-sm font-bold text-gray-900">All caught up!</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="h-10 w-[1px] bg-gray-100 mx-2"></div>

                        <div className="relative">
                            <button onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotificationOpen(false); }} className={`flex items-center gap-3 p-1.5 rounded-2xl transition group ${isProfileOpen ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-gray-900 leading-none group-hover:text-blue-600 transition">{userName}</p>
                                    <p className="text-[11px] text-gray-400 font-medium mt-1">{capitalizeRole(userRole)} Account</p>
                                </div>
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold border-2 border-transparent group-hover:border-blue-200 transition">
                                    {userName.charAt(0)}
                                </div>
                            </button>

                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-50 mb-1 text-center">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Signed in as</p>
                                            <p className="text-sm font-bold text-gray-900 truncate">{userEmail}</p>
                                            <p className="text-[11px] text-blue-500 font-semibold mt-0.5">{capitalizeRole(userRole)}</p>
                                        </div>
                                        <button onClick={() => { navigate("/profile"); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition font-medium">
                                            <span>👤</span> My Profile
                                        </button>
                                        <button onClick={() => { navigate("/settings"); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition font-medium">
                                            <span>⚙️</span> Settings
                                        </button>
                                        <div className="h-[1px] bg-gray-50 my-1"></div>
                                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition font-bold">
                                            <span>🚪</span> Logout
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="p-10 max-w-5xl mx-auto w-full">
                    <button onClick={() => navigate("/search")} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition font-medium mb-6 group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Search
                    </button>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="h-96 bg-gray-100 relative overflow-hidden">
                            {item.images && item.images[0] ? (
                                <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <div className="text-center">
                                        <span className="text-6xl block mb-2">📷</span>
                                        <span className="text-sm font-medium">No image available</span>
                                    </div>
                                </div>
                            )}
                            <div className={`absolute top-6 left-6 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border shadow-sm ${status === "Lost" ? "bg-red-50 text-red-600 border-red-100" : "bg-green-50 text-green-600 border-green-100"}`}>
                                {status}
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
                                <div>
                                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{item.title}</h1>
                                    <p className="text-gray-500 font-medium text-sm">Reported on {formatDate(item.createdAt)}</p>
                                </div>

                                {/* 🔥 UPDATED: Claim status/button logic */}
                                {isClaimed ? (
                                    <div className="px-6 py-3 bg-green-50 text-green-600 rounded-2xl font-bold border border-green-100 flex items-center gap-2">
                                        <CheckCircle size={20} />
                                        Already Claimed
                                    </div>
                                ) : claimDisplay ? (
                                    <div className={`px-6 py-3 rounded-2xl font-bold border flex items-center gap-2 ${claimDisplay.color}`}>
                                        <claimDisplay.icon size={20} />
                                        {claimDisplay.text}
                                    </div>
                                ) : isMyItem ? (
                                    <div className="px-6 py-3 bg-gray-100 text-gray-500 rounded-2xl font-bold border border-gray-200">
                                        Your Item
                                    </div>
                                ) : (
                                    <button onClick={handleOpenClaimModal} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100">
                                        Claim This Item
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <InfoItem icon={<Tag size={20} className="text-blue-500" />} label="Category" value={item.category || "Uncategorized"} />
                                <InfoItem icon={<Calendar size={20} className="text-blue-500" />} label="Date" value={formatDate(item.date)} />
                                <InfoItem icon={<MapPin size={20} className="text-blue-500" />} label="Location" value={item.location} />
                                <InfoItem icon={<User size={20} className="text-blue-500" />} label="Reported By" value={item.reportedBy?.name || "Anonymous"} />
                            </div>

                            <div className="border-t border-gray-100 pt-8">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Description</h2>
                                <p className="text-gray-600 leading-relaxed">{item.description || "No description provided."}</p>
                            </div>

                            {/* 🔥 NEW: Show claim details if exists */}
                            {existingClaim && (
                                <div className={`mt-8 p-6 rounded-2xl border ${existingClaim.status === 'approved' ? 'bg-green-50 border-green-200' : existingClaim.status === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                                    <h3 className="font-bold text-gray-900 mb-2">Your Claim Status</h3>
                                    <p className="text-gray-600 mb-2">
                                        Submitted on {formatDate(existingClaim.createdAt)}
                                    </p>
                                    {existingClaim.reviewNotes && (
                                        <p className="text-sm text-gray-500 mt-2">
                                            <span className="font-medium">Admin Notes:</span> {existingClaim.reviewNotes}
                                        </p>
                                    )}
                                    {existingClaim.rejectionReason && (
                                        <p className="text-sm text-red-600 mt-2">
                                            <span className="font-medium">Reason:</span> {existingClaim.rejectionReason}
                                        </p>
                                    )}
                                </div>
                            )}

                            {item.images && item.images.length > 1 && (
                                <div className="border-t border-gray-100 pt-8 mt-8">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4">Additional Photos</h2>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {item.images.slice(1).map((img, idx) => (
                                            <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-gray-100">
                                                <img src={img} alt={`${item.title} ${idx + 2}`} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 🔥 UPDATED: Submit Claim Modal with contact fields */}
                {showClaimModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseClaimModal}></div>
                        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-8 border-b border-gray-100">
                                <h2 className="text-xl font-extrabold text-gray-900">Submit Claim</h2>
                                <button onClick={handleCloseClaimModal} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-400 hover:text-gray-600">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <form onSubmit={handleSubmitClaim} className="p-8 space-y-6">
                                {/* Contact Phone */}
                                <div>
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-3">
                                        <Phone size={14} className="inline mr-1" />
                                        Contact Phone <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={claimForm.contactPhone}
                                        onChange={(e) => setClaimForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                                        placeholder="+1 234 567 8900"
                                        className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition font-medium text-gray-900 placeholder:text-gray-400"
                                    />
                                </div>

                                {/* Contact Email */}
                                <div>
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-3">
                                        <Mail size={14} className="inline mr-1" />
                                        Contact Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={claimForm.contactEmail}
                                        onChange={(e) => setClaimForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                                        placeholder="your@email.com"
                                        className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition font-medium text-gray-900 placeholder:text-gray-400"
                                    />
                                </div>

                                {/* Proof of Ownership */}
                                <div>
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-3">
                                        Proof of Ownership <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={claimForm.proofDescription}
                                        onChange={(e) => setClaimForm(prev => ({ ...prev, proofDescription: e.target.value }))}
                                        placeholder="Describe why this item belongs to you. Include any identifying details such as serial numbers, specific marks, contents, or circumstances of loss/finding..."
                                        rows={5}
                                        className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition font-medium text-gray-900 placeholder:text-gray-400 resize-none"
                                        required
                                    />
                                </div>

                                {/* Upload Proof */}
                                <div>
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-3">
                                        Upload Proof <span className="text-gray-300 font-normal normal-case">(Optional, Max 3)</span>
                                    </label>

                                    {claimProofs.length > 0 && (
                                        <div className="flex gap-3 mb-4 flex-wrap">
                                            {claimProofs.map((proof, idx) => (
                                                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                                                    <img src={proof} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeProof(idx)}
                                                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <label className={`block border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer group ${claimProofs.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleProofUpload} disabled={claimProofs.length >= 3} />
                                        <Upload size={32} className="mx-auto mb-3 text-gray-300 group-hover:text-blue-500 transition" />
                                        <p className="text-gray-400 text-sm font-medium group-hover:text-blue-600 transition">
                                            {claimProofs.length >= 3 ? "Maximum 3 images reached" : "Upload receipt, photo, or other proof"}
                                        </p>
                                        {claimProofs.length < 3 && <p className="text-gray-300 text-xs mt-1">Click to select files</p>}
                                    </label>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={submittingClaim}
                                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                                >
                                    {submittingClaim ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Submitting...
                                        </>
                                    ) : (
                                        "Submit Claim"
                                    )}
                                </button>
                                <p className="text-xs text-gray-400 text-center">
                                    An admin will review your claim and you will be notified of the decision.
                                </p>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function InfoItem({ icon, label, value }) {
    return (
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}

function NavItem({ icon, label, active = false, onClick }) {
    return (
        <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}>
            <span className="text-lg">{icon}</span> {label}
        </button>
    );
}

export default ItemDetail;