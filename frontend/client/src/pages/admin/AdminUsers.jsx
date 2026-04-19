import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Search, Shield, User, GraduationCap, Briefcase, Trash2, Crown } from "lucide-react";

function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

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

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.updateUserRole(userId, newRole);
            fetchUsers();
        } catch (err) {
            alert("Failed to update role");
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        try {
            await api.deleteUser(userId);
            fetchUsers();
        } catch (err) {
            alert("Failed to delete user");
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case "admin": return <Crown className="w-4 h-4 text-purple-600" />;
            case "faculty": return <GraduationCap className="w-4 h-4 text-blue-600" />;
            case "staff": return <Briefcase className="w-4 h-4 text-amber-600" />;
            default: return <User className="w-4 h-4 text-slate-600" />;
        }
    };

    const getRoleColor = (role) => {
        const colors = {
            admin: "bg-purple-100 text-purple-700 border-purple-200",
            student: "bg-blue-100 text-blue-700 border-blue-200",
            faculty: "bg-indigo-100 text-indigo-700 border-indigo-200",
            staff: "bg-amber-100 text-amber-700 border-amber-200"
        };
        return colors[role] || "bg-slate-100 text-slate-700";
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
                    <p className="text-slate-500 mt-1">Manage user accounts and permissions</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-slate-600">{users.length} Total Users</span>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user) => (
                    <div key={user._id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        user.name?.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{user.name}</h3>
                                    <p className="text-sm text-slate-500">{user.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(user._id)}
                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg text-red-600 transition"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-500">Role</span>
                                <div className="flex items-center gap-2">
                                    {getRoleIcon(user.role)}
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold border-0 cursor-pointer ${getRoleColor(user.role)}`}
                                    >
                                        <option value="student">Student</option>
                                        <option value="faculty">Faculty</option>
                                        <option value="staff">Staff</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-500">Department</span>
                                <span className="text-sm font-medium text-slate-900">{user.department || "Not set"}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-500">Joined</span>
                                <span className="text-sm font-medium text-slate-900">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-emerald-500" />
                                <span className="text-xs text-slate-500">
                                    {user.role === "admin" ? "Full system access" : "Standard user access"}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredUsers.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                    <div className="text-4xl mb-3">🔍</div>
                    <h3 className="text-lg font-semibold text-slate-900">No users found</h3>
                    <p className="text-slate-500">Try adjusting your search criteria</p>
                </div>
            )}
        </div>
    );
}

export default AdminUsers;