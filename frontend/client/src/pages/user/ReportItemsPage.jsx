import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";

function ReportItemsPage() {
    const navigate = useNavigate();

    const [userName, setUserName] = useState("Student");
    const [userEmail, setUserEmail] = useState("");
    const [userRole, setUserRole] = useState("student");
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

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
        if (savedUser) {
            const user = JSON.parse(savedUser);
            setUserName(user.name.split(" ")[0]);
            setUserEmail(user.email || "student@university.edu");
            setUserRole(user.role || "student");
        } else {
            navigate("/login");
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const handleLogoClick = () => {
        navigate("/dashboard");
    };

    const capitalizeRole = (role) => role.charAt(0).toUpperCase() + role.slice(1);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        // Convert to base64 for preview (in production, you'd upload to cloud storage)
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!title || !category || !description || !location || !date) {
            setError("Please fill in all required fields");
            setLoading(false);
            return;
        }

        try {
            const itemData = {
                title,
                type: type.toLowerCase(),
                category,
                description,
                location,
                date: new Date(date),
                images
            };

            await api.addItem(itemData);
            setSuccess(true);

            // Reset form after 2 seconds and redirect
            setTimeout(() => {
                navigate("/dashboard");
            }, 2000);

        } catch (err) {
            console.error("Failed to submit item:", err);
            setError("Failed to submit report. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">
            {/* Sidebar - EXACTLY matching Dashboard */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen">
                <div className="p-8 flex items-center gap-3">
                    <div
                        className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center relative shadow-sm cursor-pointer hover:scale-105 transition-transform"
                        onClick={handleLogoClick}
                    >
                        <span className="text-white font-extrabold text-lg relative">
                            C<span className="absolute left-1 top-0 text-white font-extrabold text-sm">U</span>
                        </span>
                    </div>
                    <span
                        className="text-2xl font-extrabold text-blue-700 tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={handleLogoClick}
                    >
                        UClaim
                    </span>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <NavItem icon="🏠" label="Dashboard" onClick={() => navigate("/dashboard")} />
                    <NavItem icon="🔍" label="Search Items" onClick={() => navigate("/search")} />
                    <NavItem icon="📄" label="Report Item" active onClick={() => navigate("/report")} />
                    <NavItem icon="👤" label="My Profile" onClick={() => navigate("/profile")} />
                </nav>

                <div className="px-6 pb-6 pt-4 border-t border-gray-50">
                    <p className="text-[11px] text-gray-300 font-medium">UClaim © 2025</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
                {/* Top Navbar - EXACTLY matching Dashboard */}
                <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-end relative">
                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setIsNotificationOpen(!isNotificationOpen);
                                    setIsProfileOpen(false);
                                }}
                                className={`w-10 h-10 flex items-center justify-center rounded-full transition relative ${isNotificationOpen ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400 hover:text-blue-600'}`}
                            >
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
                                            <p className="text-xs text-gray-400 mt-1 px-4">We'll notify you here when there's an update on your items.</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="h-10 w-[1px] bg-gray-100 mx-2"></div>

                        {/* Profile */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setIsProfileOpen(!isProfileOpen);
                                    setIsNotificationOpen(false);
                                }}
                                className={`flex items-center gap-3 p-1.5 rounded-2xl transition group ${isProfileOpen ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                            >
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
                    <div className="mb-10">
                        <h1 className="text-3xl font-extrabold text-gray-900">Report Item</h1>
                        <p className="text-gray-500 mt-1 text-sm font-medium">
                            Help us reunite lost items with their owners
                        </p>
                    </div>

                    {success ? (
                        <div className="bg-green-50 border border-green-200 rounded-3xl p-12 text-center">
                            <div className="text-5xl mb-4">✅</div>
                            <h2 className="text-2xl font-bold text-green-800 mb-2">Report Submitted!</h2>
                            <p className="text-green-600">Your item has been reported successfully. Redirecting to dashboard...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            {/* Toggle */}
                            <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 mb-8">
                                <button
                                    type="button"
                                    onClick={() => setType("lost")}
                                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${type === "lost"
                                        ? "bg-red-500 text-white shadow-md"
                                        : "text-gray-400 hover:text-gray-600"
                                        }`}
                                >
                                    Lost Item
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setType("found")}
                                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${type === "found"
                                        ? "bg-green-500 text-white shadow-md"
                                        : "text-gray-400 hover:text-gray-600"
                                        }`}
                                >
                                    Found Item
                                </button>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-medium">
                                    ⚠️ {error}
                                </div>
                            )}

                            {/* Form */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Item Name"
                                    placeholder="e.g. Black iPhone 14 Pro"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />

                                <Select
                                    label="Category"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    required
                                />

                                <div className="md:col-span-2">
                                    <Textarea
                                        label="Description"
                                        placeholder="Provide detailed description including color, brand, distinguishing marks..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                    />
                                </div>

                                <Input
                                    label="Location"
                                    placeholder="e.g. Library 3rd Floor"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    required
                                />

                                <Input
                                    label="Date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />

                                <div className="md:col-span-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-2">
                                        Upload Photos
                                    </label>

                                    {images.length > 0 && (
                                        <div className="flex gap-3 mb-4 flex-wrap">
                                            {images.map((img, idx) => (
                                                <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group">
                                                    <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(idx)}
                                                        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <label className="block border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                        <p className="text-gray-400 text-sm font-medium">
                                            Click to upload or drag and drop images
                                        </p>
                                        <p className="text-gray-300 text-xs mt-1">PNG, JPG up to 5MB each</p>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-8 w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Report"
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}

/* Components - Matching Dashboard style */

function Input({ label, ...props }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                {label}
            </label>
            <input
                {...props}
                className="bg-gray-50 border border-gray-200 p-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition font-medium text-gray-900 placeholder:text-gray-400"
            />
        </div>
    );
}

function Select({ label, ...props }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                {label}
            </label>
            <select
                {...props}
                className="bg-gray-50 border border-gray-200 p-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition font-medium text-gray-900"
            >
                <option value="">Select a category</option>
                <option value="Electronics">Electronics</option>
                <option value="Documents">Documents</option>
                <option value="Bags">Bags & Luggage</option>
                <option value="Keys">Keys</option>
                <option value="Wallet">Wallet & Cards</option>
                <option value="Clothing">Clothing</option>
                <option value="Others">Others</option>
            </select>
        </div>
    );
}

function Textarea({ label, ...props }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                {label}
            </label>
            <textarea
                {...props}
                rows={4}
                className="bg-gray-50 border border-gray-200 p-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition font-medium text-gray-900 placeholder:text-gray-400 resize-none"
            />
        </div>
    );
}

function NavItem({ icon, label, active = false, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
        >
            <span className="text-lg">{icon}</span> {label}
        </button>
    );
}

export default ReportItemsPage;