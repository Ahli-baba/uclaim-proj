import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import {
    Mail,
    Phone,
    Building2,
    GraduationCap,
    Calendar,
    Shield,
    Edit3,
    LogOut,
    Camera,
    Settings,
    Bell
} from "lucide-react";

function MyProfile() {
    const navigate = useNavigate();

    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
    });

    const [loading, setLoading] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [stats, setStats] = useState({ reported: 0, found: 0, claimed: 0 });
    const [recentItems, setRecentItems] = useState([]);
    const [editForm, setEditForm] = useState({ name: "", department: "", phone: "" });
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }
        setEditForm({
            name: user.name || "",
            department: user.department || "",
            phone: user.phone || ""
        });
        fetchUserData();
        fetchNotifications();
        syncUserProfile();
    }, []);

    const syncUserProfile = async () => {
        try {
            const freshUser = await api.getProfile();
            if (freshUser) {
                const updatedUser = { ...user, ...freshUser };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                setUser(updatedUser);
                setEditForm({
                    name: updatedUser.name || "",
                    department: updatedUser.department || "",
                    phone: updatedUser.phone || ""
                });
            }
        } catch (err) {
            console.log("Could not sync with backend, using local data");
        }
    };

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const items = await api.getItems();
            const userItems = items.filter(item =>
                item.reportedBy?._id === user.id ||
                item.reportedBy?.email === user.email
            );
            const reported = userItems.length;
            const found = userItems.filter(i => i.type === "found").length;
            const claimed = userItems.filter(i => i.status === "claimed").length;
            setStats({ reported, found, claimed });
            setRecentItems(userItems.slice(0, 5));
        } catch (err) {
            console.log("Using local data only");
        } finally {
            setLoading(false);
        }
    };

    const fetchNotifications = async () => {
        try {
            const notifs = await api.getNotifications();
            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
        } catch (err) {
            console.log("Failed to fetch notifications");
        }
    };

    // Compress image before upload
    const compressImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.8) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedBase64);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert("Please upload an image file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("File is too large. Please upload an image smaller than 5MB");
            return;
        }

        try {
            setUploadingImage(true);
            const compressedBase64 = await compressImage(file, 400, 400, 0.8);

            // Send to backend - now it will work!
            await api.updateProfile({ avatar: compressedBase64 });

            const updatedUser = { ...user, avatar: compressedBase64 };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);
            alert("Profile photo updated successfully!");

        } catch (err) {
            console.error("Failed to upload image:", err);
            alert("Failed to upload image. Please try again.");
        } finally {
            setUploadingImage(false);
        }
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const handleLogoClick = () => navigate("/dashboard");
    const capitalizeRole = (role) => role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            await api.updateProfile(editForm);

            const updatedUser = {
                ...user,
                name: editForm.name,
                department: editForm.department,
                phone: editForm.phone
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);
            setIsEditing(false);
            alert("Profile updated successfully!");

        } catch (err) {
            console.error("Failed to update profile:", err);
            alert("Failed to save changes. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Recently joined";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "Recently joined";
            return date.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
            });
        } catch {
            return "Recently joined";
        }
    };

    if (!user) return null;

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
                    <NavItem icon="👤" label="My Profile" active onClick={() => navigate("/profile")} />
                </nav>

                <div className="px-6 pb-6 pt-4 border-t border-gray-50">
                    <p className="text-[11px] text-gray-300 font-medium">UClaim © 2025</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
                {/* Header */}
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
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                                )}
                            </button>

                            {isNotificationOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsNotificationOpen(false)}></div>
                                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                                        <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                                            <h3 className="font-bold text-gray-900">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">New</span>
                                            )}
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.length > 0 ? (
                                                <div className="divide-y divide-gray-50">
                                                    {notifications.map((notif, idx) => (
                                                        <div key={idx} className="p-4 hover:bg-gray-50 transition cursor-pointer">
                                                            <p className="text-sm text-gray-800 font-medium">{notif.message}</p>
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                {notif.date ? formatDate(notif.date) : 'Recently'}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center">
                                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-xl opacity-50">🔔</div>
                                                    <p className="text-sm font-bold text-gray-900">All caught up!</p>
                                                    <p className="text-xs text-gray-400 mt-1 px-4">We'll notify you when there's an update.</p>
                                                </div>
                                            )}
                                        </div>
                                        {notifications.length > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="w-full p-3 text-center text-xs font-bold text-blue-600 border-t border-gray-50 hover:bg-gray-50 transition"
                                            >
                                                Mark all as read
                                            </button>
                                        )}
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
                                    <p className="text-sm font-bold text-gray-900 leading-none group-hover:text-blue-600 transition">{user.name}</p>
                                    <p className="text-[11px] text-gray-400 font-medium mt-1">{capitalizeRole(user.role)} Account</p>
                                </div>
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold border-2 border-transparent group-hover:border-blue-200 transition overflow-hidden">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        user.name?.charAt(0) || "U"
                                    )}
                                </div>
                            </button>

                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-50 mb-1 text-center">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Signed in as</p>
                                            <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
                                            <p className="text-[11px] text-blue-500 font-semibold mt-0.5">{capitalizeRole(user.role)}</p>
                                        </div>
                                        <button onClick={() => { navigate("/profile"); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition font-medium">
                                            <span>👤</span> My Profile
                                        </button>
                                        <button onClick={() => { navigate("/settings"); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition font-medium">
                                            <Settings size={16} /> Settings
                                        </button>
                                        <div className="h-[1px] bg-gray-50 my-1"></div>
                                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition font-bold">
                                            <LogOut size={16} /> Logout
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Profile Content */}
                <div className="p-10 max-w-6xl mx-auto w-full">
                    <div className="mb-10">
                        <h1 className="text-3xl font-extrabold text-gray-900">My Profile</h1>
                        <p className="text-gray-500 mt-1 text-sm font-medium">Manage your account and view your activity</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
                                <div className="relative inline-block mb-6">
                                    <div className="w-32 h-32 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-5xl font-bold mx-auto border-4 border-white shadow-lg overflow-hidden">
                                        {uploadingImage ? (
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        ) : user.avatar ? (
                                            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            user.name?.charAt(0) || "U"
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageUpload}
                                            disabled={uploadingImage}
                                        />
                                        <Camera size={18} />
                                    </label>
                                </div>

                                <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h2>
                                <p className="text-blue-600 font-semibold text-sm mb-4">{capitalizeRole(user.role)}</p>

                                {user.department && (
                                    <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-6 bg-gray-50 px-4 py-2 rounded-full">
                                        <Building2 size={16} />
                                        <span className="font-medium">{user.department}</span>
                                    </div>
                                )}

                                <div className="pt-6 border-t border-gray-100">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-blue-600">{stats.reported}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1">Reported</p>
                                        </div>
                                        <div className="text-center border-x border-gray-100">
                                            <p className="text-2xl font-black text-green-600">{stats.found}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1">Found</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-purple-600">{stats.claimed}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1">Claimed</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-gray-400 text-sm">
                                    <Calendar size={16} />
                                    <span>Member since {formatDate(user.createdAt)}</span>
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mt-6">
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Quick Actions</h3>
                                <div className="space-y-2">
                                    <button onClick={() => setIsEditing(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition font-medium text-left">
                                        <Edit3 size={18} /> Edit Profile
                                    </button>
                                    <button onClick={() => navigate("/settings")} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition font-medium text-left">
                                        <Settings size={18} /> Settings
                                    </button>
                                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition font-medium text-left">
                                        <LogOut size={18} /> Logout
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Personal Information */}
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                                    {!isEditing && (
                                        <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition">
                                            Edit
                                        </button>
                                    )}
                                </div>

                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-2">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={editForm.name}
                                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                    className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-2">Department</label>
                                                <select
                                                    value={editForm.department}
                                                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                                    className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                                                >
                                                    <option value="">Select Department</option>
                                                    <option value="College of Engineering">College of Engineering</option>
                                                    <option value="College of Business">College of Business</option>
                                                    <option value="College of Arts & Sciences">College of Arts & Sciences</option>
                                                    <option value="College of Education">College of Education</option>
                                                    <option value="College of Medicine">College of Medicine</option>
                                                    <option value="College of Law">College of Law</option>
                                                    <option value="College of IT">College of IT</option>
                                                    <option value="Administration">Administration</option>
                                                    <option value="Staff">Staff</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-2">Phone Number</label>
                                                <input
                                                    type="tel"
                                                    value={editForm.phone}
                                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                    placeholder="+1 (555) 000-0000"
                                                    className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-2">Email</label>
                                                <input
                                                    type="email"
                                                    value={user.email}
                                                    disabled
                                                    className="w-full bg-gray-100 border border-gray-200 p-3.5 rounded-2xl text-gray-400 cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-3 pt-4">
                                            <button
                                                onClick={handleSaveProfile}
                                                disabled={saving}
                                                className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
                                            >
                                                {saving ? "Saving..." : "Save Changes"}
                                            </button>
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-2xl font-bold hover:bg-gray-200 transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InfoItem icon={<Mail size={20} />} label="Email" value={user.email} />
                                        <InfoItem icon={<Phone size={20} />} label="Phone" value={user.phone || "Not provided"} />
                                        <InfoItem icon={<Building2 size={20} />} label="Department" value={user.department || "Not specified"} />
                                        <InfoItem icon={<GraduationCap size={20} />} label="Role" value={capitalizeRole(user.role)} />
                                        <InfoItem icon={<Calendar size={20} />} label="Member Since" value={formatDate(user.createdAt)} />
                                        <InfoItem icon={<Shield size={20} />} label="Account Status" value="Active" valueColor="text-green-600" />
                                    </div>
                                )}
                            </div>

                            {/* Recent Activity */}
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                                <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Activity</h3>
                                {recentItems.length > 0 ? (
                                    <div className="space-y-4">
                                        {recentItems.map((item) => (
                                            <div key={item._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition cursor-pointer" onClick={() => navigate(`/item/${item._id}`)}>
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${item.type === 'lost' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                    {item.type === 'lost' ? '😞' : '🎉'}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                                                    <p className="text-xs text-gray-500 mt-0.5">{item.type === 'lost' ? 'Lost' : 'Found'} at {item.location}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${item.status === 'claimed' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="text-4xl mb-3 opacity-20">📋</div>
                                        <p className="text-gray-400 font-medium text-sm">No recent activity</p>
                                        <button onClick={() => navigate("/report")} className="text-blue-600 text-xs font-bold mt-2 hover:underline uppercase tracking-tight">
                                            Report your first item
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function InfoItem({ icon, label, value, valueColor = "text-gray-900" }) {
    return (
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 text-blue-500">
                {icon}
            </div>
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                <p className={`font-bold ${valueColor}`}>{value}</p>
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

export default MyProfile;