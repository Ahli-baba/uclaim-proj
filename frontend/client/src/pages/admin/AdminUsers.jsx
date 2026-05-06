import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { api } from "../../services/api";
import { Search, Shield, User, GraduationCap, Briefcase, Trash2, Crown, Users, UserPlus, X, Eye, EyeOff } from "lucide-react";

// ── Theme constants ───────────────────────────────────────────────────────────
const T = {
    navy: "#1D3557",
    steel: "#468FAF",
    cool: "#F8F9FA",
    white: "#FFFFFF",
    text: "#1D3557",
    textLight: "#6B7280",
    border: "rgba(29,53,87,0.08)",
    surface: "#FFFFFF",
    hover: "rgba(70,143,175,0.06)",
};

function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 9;

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "staff" });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await api.getAllUsers();
            setUsers(data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAccount = async () => {
        if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
            Swal.fire({ icon: "warning", title: "Missing Fields", text: "Please fill in all fields.", confirmButtonColor: "#1D3557", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
            return;
        }
        setCreateLoading(true);
        try {
            await api.createUser(newUser);
            setShowCreateModal(false);
            setNewUser({ name: "", email: "", password: "", role: "staff" });
            fetchUsers();
            Swal.fire({ icon: "success", title: "Account Created", text: `${newUser.role.charAt(0).toUpperCase() + newUser.role.slice(1)} account has been created successfully.`, confirmButtonColor: "#1D3557", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
        } catch (err) {
            Swal.fire({ icon: "error", title: "Creation Failed", text: err.message || "Failed to create account.", confirmButtonColor: "#1D3557", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
        } finally {
            setCreateLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        const result = await Swal.fire({
            icon: "warning",
            title: "Delete this user?",
            text: "This action cannot be undone. All their data will be permanently removed.",
            showCancelButton: true,
            confirmButtonText: "Yes, delete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#DC2626",
            cancelButtonColor: "#1D3557",
            customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold", cancelButton: "rounded-xl font-bold" }
        });
        if (!result.isConfirmed) return;
        try {
            await api.deleteUser(userId);
            fetchUsers();
        } catch (err) {
            Swal.fire({ icon: "error", title: "Delete Failed", text: "Failed to delete user.", confirmButtonColor: "#1D3557", customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold" } });
        }
    };

    const getRoleStyle = (role) => {
        const styles = {
            admin: { bg: "rgba(139,92,246,0.08)", text: "#7C3AED", border: "rgba(139,92,246,0.15)" },
            student: { bg: "rgba(70,143,175,0.08)", text: T.steel, border: "rgba(70,143,175,0.15)" },
            faculty: { bg: "rgba(59,130,246,0.08)", text: "#3B82F6", border: "rgba(59,130,246,0.15)" },
            staff: { bg: "rgba(245,158,11,0.08)", text: "#D97706", border: "rgba(245,158,11,0.15)" }
        };
        return styles[role] || { bg: T.cool, text: T.textLight, border: T.border };
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case "admin": return <Crown className="w-3.5 h-3.5" style={{ color: "#7C3AED" }} />;
            case "faculty": return <GraduationCap className="w-3.5 h-3.5" style={{ color: "#3B82F6" }} />;
            case "staff": return <Briefcase className="w-3.5 h-3.5" style={{ color: "#D97706" }} />;
            default: return <User className="w-3.5 h-3.5" style={{ color: T.steel }} />;
        }
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * usersPerPage,
        currentPage * usersPerPage
    );

    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: T.steel, borderTopColor: "transparent" }} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">

            {/* ── Header ───────────────────────────────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-6" style={{ borderBottom: `1px solid ${T.border}` }}>
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-medium tracking-widest uppercase" style={{ color: T.steel }}>
                        <Users className="w-3.5 h-3.5" />
                        <span>User Directory</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: T.navy }}>User Management</h1>
                    <p className="text-sm" style={{ color: T.textLight }}>Manage user accounts and permissions</p>
                </div>
                <div className="flex items-center gap-3">
                    <div
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border"
                        style={{ backgroundColor: T.white, borderColor: T.border }}
                    >
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#10B981" }} />
                        <span className="text-sm font-semibold" style={{ color: T.navy }}>{users.length} Total Users</span>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
                        style={{ backgroundColor: T.navy, color: T.white }}
                    >
                        <UserPlus className="w-4 h-4" />
                        Create Account
                    </button>
                </div>
            </div>

            {/* ── Search ───────────────────────────────────────────────────────────── */}
            <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.textLight }} />
                <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{
                        backgroundColor: T.white,
                        border: `1px solid ${T.border}`,
                        color: T.navy,
                    }}
                    onFocus={(e) => e.target.style.borderColor = T.steel}
                    onBlur={(e) => e.target.style.borderColor = T.border}
                />
            </div>

            {/* ── Users Grid ─────────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedUsers.map((user) => {
                    const roleStyle = getRoleStyle(user.role);
                    return (
                        <div
                            key={user._id}
                            className="rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-0.5 group"
                            style={{
                                backgroundColor: T.white,
                                borderColor: T.border,
                                boxShadow: "0 1px 3px rgba(29,53,87,0.04)",
                            }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden"
                                        style={{ backgroundColor: T.steel }}
                                    >
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            user.name?.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-sm truncate" style={{ color: T.navy }}>{user.name}</h3>
                                        <p className="text-xs truncate" style={{ color: T.textLight }}>{user.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(user._id)}
                                    className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    style={{ color: "#DC2626" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.06)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium" style={{ color: T.textLight }}>Role</span>
                                    <div
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold capitalize"
                                        style={{ backgroundColor: roleStyle.bg, color: roleStyle.text, borderColor: roleStyle.border }}
                                    >
                                        {getRoleIcon(user.role)}
                                        <span>{user.role}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium" style={{ color: T.textLight }}>Department</span>
                                    <span className="text-xs font-semibold" style={{ color: T.navy }}>{user.department || "Not set"}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium" style={{ color: T.textLight }}>Joined</span>
                                    <span className="text-xs font-semibold" style={{ color: T.navy }}>
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <div
                                    className="pt-2.5 mt-2.5 flex items-center gap-2"
                                    style={{ borderTop: `1px solid ${T.border}` }}
                                >
                                    <Shield className="w-3.5 h-3.5" style={{ color: "#10B981" }} />
                                    <span className="text-[11px]" style={{ color: T.textLight }}>
                                        {user.role === "admin" ? "Full system access" : user.role === "staff" ? "Staff operations access" : user.role === "faculty" ? "Faculty reporting access" : "Standard user access"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Pagination ─────────────────────────────────────────────────────────── */}
            {filteredUsers.length > usersPerPage && (
                <div
                    className="flex items-center justify-between px-6 py-4 rounded-2xl border"
                    style={{
                        backgroundColor: T.white,
                        borderColor: T.border,
                    }}
                >
                    <span className="text-[11px] font-semibold" style={{ color: T.textLight }}>
                        {(currentPage - 1) * usersPerPage + 1}–{Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-25 disabled:cursor-not-allowed hover:bg-[#F8F9FA]"
                            style={{
                                color: T.navy,
                                border: `1px solid ${T.border}`,
                            }}
                        >
                            ← Prev
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className="min-w-[32px] h-8 rounded-lg text-[11px] font-bold transition-all"
                                style={{
                                    backgroundColor: currentPage === page ? T.navy : "transparent",
                                    color: currentPage === page ? T.white : T.textLight,
                                    border: currentPage === page ? `1px solid ${T.navy}` : `1px solid ${T.border}`,
                                }}
                                onMouseEnter={(e) => {
                                    if (currentPage !== page) {
                                        e.currentTarget.style.backgroundColor = T.cool;
                                        e.currentTarget.style.color = T.navy;
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (currentPage !== page) {
                                        e.currentTarget.style.backgroundColor = "transparent";
                                        e.currentTarget.style.color = T.textLight;
                                    }
                                }}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-25 disabled:cursor-not-allowed hover:bg-[#F8F9FA]"
                            style={{
                                color: T.navy,
                                border: `1px solid ${T.border}`,
                            }}
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}

            {filteredUsers.length === 0 && (
                <div className="text-center py-16 space-y-2 rounded-2xl border" style={{ backgroundColor: T.white, borderColor: T.border }}>
                    <Search className="w-10 h-10 mx-auto opacity-20" style={{ color: T.navy }} />
                    <p className="text-sm font-medium" style={{ color: T.navy }}>No users found</p>
                    <p className="text-xs" style={{ color: T.textLight }}>Try adjusting your search</p>
                </div>
            )}

            {/* ── Create Account Modal ─────────────────────────────────────────── */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
                    <div className="w-full max-w-md rounded-2xl p-6 space-y-5" style={{ backgroundColor: T.white, boxShadow: "0 20px 60px rgba(29,53,87,0.15)" }}>

                        {/* Modal Header */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <h2 className="text-lg font-bold" style={{ color: T.navy }}>Create Account</h2>
                                <p className="text-xs" style={{ color: T.textLight }}>Only Staff and Admin accounts can be created manually.</p>
                            </div>
                            <button
                                onClick={() => { setShowCreateModal(false); setNewUser({ name: "", email: "", password: "", role: "staff" }); }}
                                className="p-1.5 rounded-lg transition-all"
                                style={{ color: T.textLight }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = T.cool}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Role Selector */}
                        <div className="grid grid-cols-2 gap-2">
                            {["staff", "admin"].map((r) => {
                                const selected = newUser.role === r;
                                const style = getRoleStyle(r);
                                return (
                                    <button
                                        key={r}
                                        onClick={() => setNewUser(prev => ({ ...prev, role: r }))}
                                        className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold capitalize transition-all"
                                        style={{
                                            backgroundColor: selected ? style.bg : T.cool,
                                            color: selected ? style.text : T.textLight,
                                            borderColor: selected ? style.border : T.border,
                                        }}
                                    >
                                        {getRoleIcon(r)}
                                        {r}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Fields */}
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold" style={{ color: T.textLight }}>Full Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Juan dela Cruz"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                                    style={{ border: `1px solid ${T.border}`, color: T.navy, backgroundColor: T.white }}
                                    onFocus={(e) => e.target.style.borderColor = T.steel}
                                    onBlur={(e) => e.target.style.borderColor = T.border}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold" style={{ color: T.textLight }}>Email</label>
                                <input
                                    type="email"
                                    placeholder="email@university.edu"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                                    style={{ border: `1px solid ${T.border}`, color: T.navy, backgroundColor: T.white }}
                                    onFocus={(e) => e.target.style.borderColor = T.steel}
                                    onBlur={(e) => e.target.style.borderColor = T.border}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold" style={{ color: T.textLight }}>Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Temporary password"
                                        value={newUser.password}
                                        onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm focus:outline-none transition-all"
                                        style={{ border: `1px solid ${T.border}`, color: T.navy, backgroundColor: T.white }}
                                        onFocus={(e) => e.target.style.borderColor = T.steel}
                                        onBlur={(e) => e.target.style.borderColor = T.border}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(p => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                        style={{ color: T.textLight }}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={() => { setShowCreateModal(false); setNewUser({ name: "", email: "", password: "", role: "staff" }); }}
                                className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all"
                                style={{ color: T.textLight, borderColor: T.border }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = T.cool}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateAccount}
                                disabled={createLoading}
                                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                                style={{ backgroundColor: T.navy, color: T.white }}
                            >
                                {createLoading ? "Creating..." : "Create Account"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminUsers;