import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import {
    Search,
    MapPin,
    Calendar,
    Grid,
    List,
    Info
} from "lucide-react";

function SearchItemsPage() {
    const navigate = useNavigate();

    // User state (matching Dashboard)
    const [userName, setUserName] = useState("Student");
    const [userEmail, setUserEmail] = useState("");
    const [userRole, setUserRole] = useState("student");
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    // Items state
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [viewType, setViewType] = useState("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");

    // Get user data from localStorage (matching Dashboard)
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

        // Fetch items from backend
        fetchItems();
    }, [navigate]);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const data = await api.getItems();
            setItems(data);
        } catch (err) {
            console.error("Failed to fetch items:", err);
            if (err.message.includes("401")) {
                navigate("/login");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const handleLogoClick = () => {
        navigate("/dashboard");
    };

    const capitalizeRole = (role) => role.charAt(0).toUpperCase() + role.slice(1);

    // Filter items (using real data now)
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.location.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
            const matchesStatus = statusFilter === "All" ||
                (statusFilter === "Lost" && item.type === "lost" && item.status !== "claimed") ||
                (statusFilter === "Found" && item.type === "found" && item.status !== "claimed") ||
                (statusFilter === "Claimed" && item.status === "claimed");
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [searchQuery, categoryFilter, statusFilter, items]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    // Dynamic count text based on status filter
    const getItemsCountText = (count, status) => {
        if (status === "All") return `${count} item${count !== 1 ? 's' : ''} found`;
        return `${count} ${status.toLowerCase()} item${count !== 1 ? 's' : ''}`;
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
                    <NavItem icon="🔍" label="Search Items" active onClick={() => navigate("/search")} />
                    <NavItem icon="📄" label="Report Item" onClick={() => navigate("/report")} />
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
                <div className="p-10 max-w-7xl mx-auto w-full">
                    <div className="mb-10">
                        <h1 className="text-3xl font-extrabold text-gray-900">Search Items</h1>
                        <p className="text-gray-500 mt-1 text-sm font-medium">Browse and search through lost and found belongings</p>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8">
                        <div className="flex flex-col md:flex-row gap-4 mb-8">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by item name or location..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition font-medium text-gray-900 placeholder:text-gray-400"
                                />
                            </div>
                            <div className="flex gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                                <button
                                    onClick={() => setViewType("grid")}
                                    className={`p-2.5 rounded-xl transition ${viewType === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                                >
                                    <Grid size={20} />
                                </button>
                                <button
                                    onClick={() => setViewType("list")}
                                    className={`p-2.5 rounded-xl transition ${viewType === "list" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                                >
                                    <List size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <FilterSelect
                                label="Category"
                                value={categoryFilter}
                                onChange={setCategoryFilter}
                                options={["All", "Electronics", "Documents", "Bags", "Keys", "Wallet", "Clothing", "Others"]}
                            />
                            <FilterSelect
                                label="Status"
                                value={statusFilter}
                                onChange={setStatusFilter}
                                options={["All", "Lost", "Found", "Claimed"]}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">
                            {loading ? "Loading..." : getItemsCountText(filteredItems.length, statusFilter)}
                        </h3>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <>
                            {viewType === "grid" ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredItems.map(item => (
                                        <ItemCard
                                            key={item._id}
                                            item={item}
                                            onAction={() => navigate(`/item/${item._id}`)}
                                            formatDate={formatDate}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredItems.map(item => (
                                        <ItemRow
                                            key={item._id}
                                            item={item}
                                            onAction={() => navigate(`/item/${item._id}`)}
                                            formatDate={formatDate}
                                        />
                                    ))}
                                </div>
                            )}

                            {filteredItems.length === 0 && !loading && (
                                <div className="text-center py-20">
                                    <div className="text-4xl mb-4 opacity-20">🔍</div>
                                    <p className="text-gray-400 font-medium">No items found matching your criteria.</p>
                                    <button
                                        onClick={() => { setSearchQuery(""); setCategoryFilter("All"); setStatusFilter("All"); }}
                                        className="text-blue-600 text-sm font-bold mt-2 hover:underline"
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

// Updated ItemCard with FIXED status badge
function ItemCard({ item, onAction, formatDate }) {
    // Determine display status - PRIORITIZE claimed status
    const getStatusDisplay = () => {
        if (item.status === "claimed") return { text: "Claimed", color: "bg-blue-50 text-blue-600 border-blue-100" };
        if (item.type === "lost") return { text: "Lost", color: "bg-red-50 text-red-600 border-red-100" };
        return { text: "Found", color: "bg-green-50 text-green-600 border-green-100" };
    };

    const statusDisplay = getStatusDisplay();
    const displayDate = formatDate(item.date || item.createdAt);

    return (
        <div
            onClick={onAction}
            className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-xl transition-all group cursor-pointer relative"
        >
            {/* Hover Info Overlay */}
            <div className="absolute inset-0 bg-blue-600/95 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 p-8 flex flex-col justify-center text-white">
                <div className="space-y-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            ID #{item._id?.toString().slice(-6).toUpperCase() || '000000'}
                        </span>
                        <span className="px-2 py-1 bg-blue-400/30 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            {item.category || 'Uncategorized'}
                        </span>
                    </div>
                    <div>
                        <h4 className="font-black text-xl leading-tight mb-2">{item.title}</h4>
                        <p className="text-xs text-blue-100 font-medium leading-relaxed opacity-90">
                            Reported as <span className="text-white font-bold">{item.type === 'lost' ? 'Lost' : 'Found'}</span>
                            {item.status === 'claimed' ? ' (Claimed)' : ''} at the <span className="text-white font-bold">{item.location}</span>.
                            {item.reportedBy?.name ? ` By ${item.reportedBy.name}.` : ''}
                        </p>
                    </div>
                    <div className="pt-2">
                        <div className="w-full py-3 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest text-center shadow-lg hover:bg-blue-50 transition-colors">
                            View Details
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-52 overflow-hidden relative bg-gray-100">
                {item.images && item.images[0] ? (
                    <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <span className="text-4xl">📷</span>
                    </div>
                )}
                {/* FIXED BADGE - Shows Claimed status properly */}
                <div className={`absolute top-4 right-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm z-10 ${statusDisplay.color}`}>
                    {statusDisplay.text}
                </div>
            </div>
            <div className="p-6">
                <h3 className="font-extrabold text-gray-900 text-lg mb-4 group-hover:text-blue-600 transition line-clamp-1">{item.title}</h3>
                <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold">
                        <MapPin size={16} className="text-blue-500" />
                        <span className="truncate">{item.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold">
                        <Calendar size={16} className="text-blue-500" />
                        <span>{displayDate}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Updated ItemRow with FIXED status badge
function ItemRow({ item, onAction, formatDate }) {
    // Determine display status - PRIORITIZE claimed status
    const getStatusDisplay = () => {
        if (item.status === "claimed") return { text: "Claimed", color: "bg-blue-50 text-blue-600 border-blue-100" };
        if (item.type === "lost") return { text: "Lost", color: "bg-red-50 text-red-600 border-red-100" };
        return { text: "Found", color: "bg-green-50 text-green-600 border-green-100" };
    };

    const statusDisplay = getStatusDisplay();
    const displayDate = formatDate(item.date || item.createdAt);

    return (
        <div
            onClick={onAction}
            className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center gap-6 hover:border-blue-200 hover:shadow-md transition cursor-pointer group relative"
        >
            <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0">
                {item.images && item.images[0] ? (
                    <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">
                        📷
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition truncate">{item.title}</h3>
                    <span className="text-[10px] text-gray-300 font-mono font-bold flex-shrink-0">
                        #{item._id?.toString().slice(-6).toUpperCase() || '000000'}
                    </span>
                </div>
                <div className="flex gap-4 mt-1 text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                    <span className="flex items-center gap-1 truncate max-w-[150px]">
                        <MapPin size={14} className="text-blue-500 flex-shrink-0" />
                        <span className="truncate">{item.location}</span>
                    </span>
                    <span className="flex items-center gap-1 flex-shrink-0">
                        <Calendar size={14} className="text-blue-500" />
                        {displayDate}
                    </span>
                    <span className="hidden md:inline-block text-blue-200 flex-shrink-0">|</span>
                    <span className="hidden md:inline-block text-blue-500/70 truncate max-w-[100px]">
                        {item.category || 'Uncategorized'}
                    </span>
                </div>
            </div>

            <div className="hidden lg:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pr-4">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter italic">Click to view</span>
                <Info size={16} className="text-blue-600" />
            </div>

            {/* FIXED BADGE */}
            <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border flex-shrink-0 ${statusDisplay.color}`}>
                {statusDisplay.text}
            </span>
        </div>
    );
}

// Helper Components
function FilterSelect({ label, value, onChange, options }) {
    // Fix pluralization for dropdown labels
    const getAllLabel = () => {
        if (label === "Category") return "All Categories";
        if (label === "Status") return "All Status";
        return `All ${label}s`;
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                {label}
            </label>
            <select
                className="bg-gray-50 border border-gray-200 p-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition font-medium text-gray-900 cursor-pointer"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {options.map(opt => (
                    <option key={opt} value={opt}>
                        {opt === "All" ? getAllLabel() : opt}
                    </option>
                ))}
            </select>
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

export default SearchItemsPage;