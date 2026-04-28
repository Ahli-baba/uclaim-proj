import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";

// ── Icons ──────────────────────────────────────────────────────────────────────
const MailIcon = ({ className = "w-4 h-4" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>;
const PhoneIcon = ({ className = "w-4 h-4" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>;
const BuildingIcon = ({ className = "w-4 h-4" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>;
const GradCapIcon = ({ className = "w-4 h-4" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>;
const CalendarIcon = ({ className = "w-4 h-4" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>;
const ShieldIcon = ({ className = "w-4 h-4" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>;
const EditIcon = ({ className = "w-4 h-4" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>;
const CameraIcon = ({ className = "w-4 h-4" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>;
const LocationIcon = ({ className = "w-3.5 h-3.5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>;
const ChevronRightIcon = ({ className = "w-4 h-4" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
const SettingsIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LogoutIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>;
// ──────────────────────────────────────────────────────────────────────────────

function MyProfile() {
    const navigate = useNavigate();

    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
    });

    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [stats, setStats] = useState({ reported: 0, found: 0, claimed: 0 });
    const [recentItems, setRecentItems] = useState([]);
    const [editForm, setEditForm] = useState({ name: "", department: "", phone: "" });
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        if (!user) { navigate("/login"); return; }
        setEditForm({ name: user.name || "", department: user.department || "", phone: user.phone || "" });
        fetchUserData();
        syncUserProfile();
    }, []);

    const syncUserProfile = async () => {
        try {
            const freshUser = await api.getProfile();
            if (freshUser) {
                const updatedUser = { ...user, ...freshUser };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                setUser(updatedUser);
                setEditForm({ name: updatedUser.name || "", department: updatedUser.department || "", phone: updatedUser.phone || "" });
            }
        } catch { /* use local data */ }
    };

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const items = await api.getItems();
            const userItems = items.filter(item =>
                item.reportedBy?._id === user.id || item.reportedBy?.email === user.email
            );
            setStats({
                reported: userItems.length,
                found: userItems.filter(i => i.type === "found").length,
                claimed: userItems.filter(i => i.status === "claimed").length,
            });
            setRecentItems(userItems.slice(0, 5));
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };

    const compressImage = (file, maxW = 400, maxH = 400, q = 0.8) =>
        new Promise((res, rej) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = ({ target }) => {
                const img = new Image();
                img.src = target.result;
                img.onload = () => {
                    let w = img.width, h = img.height;
                    if (w > h ? w > maxW : h > maxH) {
                        w > h ? (h *= maxW / w, w = maxW) : (w *= maxH / h, h = maxH);
                    }
                    const canvas = document.createElement("canvas");
                    canvas.width = w; canvas.height = h;
                    canvas.getContext("2d").drawImage(img, 0, 0, w, h);
                    res(canvas.toDataURL("image/jpeg", q));
                };
                img.onerror = rej;
            };
            reader.onerror = rej;
        });

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) { alert("Please upload an image file"); return; }
        if (file.size > 5 * 1024 * 1024) { alert("File is too large. Max 5MB."); return; }
        try {
            setUploadingImage(true);
            const b64 = await compressImage(file);
            await api.updateProfile({ avatar: b64 });
            const updated = { ...user, avatar: b64 };
            localStorage.setItem("user", JSON.stringify(updated));
            setUser(updated);
        } catch { alert("Failed to upload image. Please try again."); }
        finally { setUploadingImage(false); }
    };

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            await api.updateProfile(editForm);
            const updated = { ...user, ...editForm };
            localStorage.setItem("user", JSON.stringify(updated));
            setUser(updated);
            setIsEditing(false);
        } catch { alert("Failed to save changes. Please try again."); }
        finally { setSaving(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const capitalizeRole = (role) => role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";

    const formatDate = (ds) => {
        if (!ds) return "Recently joined";
        try {
            const d = new Date(ds);
            if (isNaN(d)) return "Recently joined";
            return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
        } catch { return "Recently joined"; }
    };

    if (!user) return null;

    const userName = user.name?.split(" ")[0] || "User";

    return (
        <div className="p-6 lg:p-8 max-w-6xl mx-auto">

            {/* Page header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#001F3F]">
                    My <span className="text-[#00A8E8]">Profile</span>
                </h1>
                <p className="text-gray-400 mt-1 text-sm">Manage your account and view your activity</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── LEFT COLUMN ── */}
                <div className="lg:col-span-1 flex flex-col gap-6">

                    {/* Avatar card */}
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                        {/* Top accent bar */}
                        <div className="h-1 bg-[#00A8E8]" />
                        <div className="p-6 flex flex-col items-center text-center">
                            {/* Avatar */}
                            <div className="relative mb-5">
                                <div className="w-24 h-24 rounded-2xl bg-[#00A8E8]/10 text-[#00A8E8] flex items-center justify-center text-3xl font-bold border-4 border-white shadow-md overflow-hidden">
                                    {uploadingImage ? (
                                        <div className="w-6 h-6 border-2 border-[#00A8E8]/30 border-t-[#00A8E8] rounded-full animate-spin" />
                                    ) : user.avatar ? (
                                        <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        userName.charAt(0)
                                    )}
                                </div>
                                <label className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-[#001F3F] text-white rounded-xl flex items-center justify-center shadow-md hover:bg-[#00A8E8] transition-colors duration-200 cursor-pointer">
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                                    <CameraIcon className="w-3.5 h-3.5" />
                                </label>
                            </div>

                            <h2 className="text-xl font-bold text-[#001F3F]">{user.name}</h2>
                            <p className="text-[#00A8E8] font-semibold text-sm mt-0.5">{capitalizeRole(user.role)}</p>

                            {user.department && (
                                <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-3 bg-gray-50 px-3 py-1.5 rounded-lg">
                                    <BuildingIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="font-medium truncate">{user.department}</span>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="w-full mt-6 pt-5 border-t border-gray-100 grid grid-cols-3 gap-2">
                                <StatPill label="Reported" value={stats.reported} color="text-[#001F3F]" bg="bg-[#001F3F]/5" />
                                <StatPill label="Found" value={stats.found} color="text-emerald-600" bg="bg-emerald-50" />
                                <StatPill label="Claimed" value={stats.claimed} color="text-[#00A8E8]" bg="bg-[#00A8E8]/10" />
                            </div>

                            {/* Member since */}
                            <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-5">
                                <CalendarIcon className="w-3.5 h-3.5" />
                                <span>Member since {formatDate(user.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick actions card */}
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Quick Actions</p>
                        <div className="space-y-1">
                            <QuickAction icon={<EditIcon className="w-4 h-4" />} label="Edit Profile" onClick={() => setIsEditing(true)} />
                            <QuickAction icon={<SettingsIcon className="w-4 h-4" />} label="Settings" onClick={() => navigate("/settings")} />
                            <QuickAction icon={<LogoutIcon className="w-4 h-4" />} label="Logout" onClick={handleLogout} danger />
                        </div>
                    </div>
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="lg:col-span-2 flex flex-col gap-6">

                    {/* Personal Information card */}
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-[#001F3F]">Personal Information</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Your account details</p>
                            </div>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00A8E8]/10 text-[#00A8E8] rounded-lg font-bold text-xs hover:bg-[#00A8E8] hover:text-white transition-all duration-200"
                                >
                                    <EditIcon className="w-3.5 h-3.5" /> Edit
                                </button>
                            )}
                        </div>

                        <div className="p-6">
                            {isEditing ? (
                                /* ── Edit mode ── */
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <EditField label="Full Name">
                                            <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                className="w-full bg-[#F5F6F8] border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium text-[#001F3F] focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/20 focus:border-[#00A8E8] transition-all duration-200" />
                                        </EditField>
                                        <EditField label="Department">
                                            <select value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                                                className="w-full bg-[#F5F6F8] border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium text-[#001F3F] focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/20 focus:border-[#00A8E8] transition-all duration-200 appearance-none cursor-pointer">
                                                <option value="">Select Department</option>
                                                <option value="College of Engineering">College of Engineering</option>
                                                <option value="College of Business">College of Business</option>
                                                <option value="College of Arts & Sciences">College of Arts &amp; Sciences</option>
                                                <option value="College of Education">College of Education</option>
                                                <option value="College of Medicine">College of Medicine</option>
                                                <option value="College of Law">College of Law</option>
                                                <option value="College of IT">College of IT</option>
                                                <option value="Administration">Administration</option>
                                                <option value="Staff">Staff</option>
                                            </select>
                                        </EditField>
                                        <EditField label="Phone Number">
                                            <input type="tel" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                                placeholder="+63 900 000 0000"
                                                className="w-full bg-[#F5F6F8] border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium text-[#001F3F] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/20 focus:border-[#00A8E8] transition-all duration-200" />
                                        </EditField>
                                        <EditField label="Email">
                                            <input type="email" value={user.email} disabled
                                                className="w-full bg-gray-100 border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 cursor-not-allowed" />
                                        </EditField>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button onClick={handleSaveProfile} disabled={saving}
                                            className="flex-1 bg-[#00A8E8] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#001F3F] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                            {saving ? "Saving…" : "Save Changes"}
                                        </button>
                                        <button onClick={() => setIsEditing(false)}
                                            className="flex-1 bg-[#F5F6F8] text-gray-500 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all duration-200">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* ── View mode ── */
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoItem icon={<MailIcon />} label="Email" value={user.email} />
                                    <InfoItem icon={<PhoneIcon />} label="Phone" value={user.phone || "Not provided"} />
                                    <InfoItem icon={<BuildingIcon />} label="Department" value={user.department || "Not specified"} />
                                    <InfoItem icon={<GradCapIcon />} label="Role" value={capitalizeRole(user.role)} />
                                    <InfoItem icon={<CalendarIcon />} label="Member Since" value={formatDate(user.createdAt)} />
                                    <InfoItem icon={<ShieldIcon />} label="Account Status" value="Active" valueColor="text-emerald-600" dot="bg-emerald-400" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Activity card */}
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-[#001F3F]">Recent Activity</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Items you've reported</p>
                            </div>
                            <button onClick={() => navigate("/search")} className="text-xs font-bold text-[#00A8E8] hover:text-[#001F3F] transition-colors flex items-center gap-1">
                                View All <ChevronRightIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="p-4">
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                                    ))}
                                </div>
                            ) : recentItems.length > 0 ? (
                                <div className="space-y-2">
                                    {recentItems.map((item) => {
                                        const isLost = item.type === "lost";
                                        const isClaimed = item.status === "claimed";
                                        return (
                                            <div
                                                key={item._id}
                                                onClick={() => navigate(`/item/${item._id}`)}
                                                className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-[#F5F6F8] transition-colors duration-200 cursor-pointer group"
                                            >
                                                {/* Type icon */}
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isLost ? "bg-red-50" : "bg-emerald-50"}`}>
                                                    {isLost ? (
                                                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
                                                    ) : (
                                                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    )}
                                                </div>
                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-[#001F3F] truncate group-hover:text-[#00A8E8] transition-colors duration-200">{item.title}</p>
                                                    <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                                                        <LocationIcon />
                                                        <span className="truncate">{item.location}</span>
                                                    </div>
                                                </div>
                                                {/* Status badge */}
                                                <span className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${isClaimed ? "bg-[#00A8E8]/10 text-[#00A8E8]" : "bg-[#001F3F]/10 text-[#001F3F]"}`}>
                                                    {item.status}
                                                </span>
                                                <ChevronRightIcon className="w-4 h-4 text-gray-200 group-hover:text-[#00A8E8] flex-shrink-0 transition-colors duration-200" />
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                                        <svg className="w-7 h-7 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                                    </div>
                                    <p className="text-sm font-bold text-[#001F3F]">No activity yet</p>
                                    <p className="text-xs text-gray-400 mt-1">Items you report will appear here.</p>
                                    <button onClick={() => navigate("/report")} className="mt-4 px-4 py-2 bg-[#00A8E8] text-white rounded-xl text-xs font-bold hover:bg-[#001F3F] transition-colors duration-200">
                                        Report Your First Item
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatPill({ label, value, color, bg }) {
    return (
        <div className={`${bg} rounded-xl p-3 text-center`}>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">{label}</p>
        </div>
    );
}

function QuickAction({ icon, label, onClick, danger = false }) {
    return (
        <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all duration-200 ${danger ? "text-red-500 hover:bg-red-50" : "text-gray-600 hover:bg-[#F5F6F8] hover:text-[#00A8E8]"}`}>
            {icon}
            {label}
        </button>
    );
}

function InfoItem({ icon, label, value, valueColor = "text-[#001F3F]", dot }) {
    return (
        <div className="flex items-start gap-3 p-4 bg-[#F5F6F8] rounded-xl">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 text-[#00A8E8]">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                <div className="flex items-center gap-1.5">
                    {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />}
                    <p className={`text-sm font-semibold truncate ${valueColor}`}>{value}</p>
                </div>
            </div>
        </div>
    );
}

function EditField({ label, children }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
            {children}
        </div>
    );
}

export default MyProfile;