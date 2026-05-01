import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";

// Only keep the content - sidebar and header come from UserLayout

const SearchItemsPage = () => {
    const navigate = useNavigate();

    // Items state
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [viewType, setViewType] = useState("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (!savedUser) { navigate("/login"); return; }
        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const itemsData = await api.getItems();
            setItems(itemsData);
        } catch (err) {
            console.error("Failed to fetch:", err);
            if (err.message?.includes("401")) navigate("/login");
        } finally {
            setLoading(false);
        }
    };

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (categoryFilter !== "all") count++;
        if (statusFilter !== "all") count++;
        if (dateFilter !== "all") count++;
        if (searchQuery.trim()) count++;
        return count;
    }, [categoryFilter, statusFilter, dateFilter, searchQuery]);

    const clearAllFilters = () => {
        setSearchQuery("");
        setCategoryFilter("all");
        setStatusFilter("all");
        setDateFilter("all");
    };

    const isWithinPeriod = (dateString, period) => {
        if (period === "all") return true;
        const date = new Date(dateString);
        const now = new Date();
        const startOf = (unit) => {
            const d = new Date(now);
            if (unit === "day") { d.setHours(0, 0, 0, 0); }
            if (unit === "week") { d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); }
            if (unit === "month") { d.setDate(1); d.setHours(0, 0, 0, 0); }
            return d;
        };
        if (period === "today") return date >= startOf("day");
        if (period === "week") return date >= startOf("week");
        if (period === "month") return date >= startOf("month");
        return true;
    };

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            // ✅ Always hide resolved items from search by default
            const isResolved = item.status === "resolved" || item.status === "claimed";
            if (isResolved) return false;

            const q = searchQuery.toLowerCase();
            const matchesSearch =
                !q ||
                item.title?.toLowerCase().includes(q) ||
                item.location?.toLowerCase().includes(q) ||
                item.category?.toLowerCase().includes(q);

            const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "lost" && item.type === "lost") ||
                (statusFilter === "found" && item.type === "found");

            const matchesDate = isWithinPeriod(item.date || item.createdAt, dateFilter);

            return matchesSearch && matchesCategory && matchesStatus && matchesDate;
        });
    }, [items, searchQuery, categoryFilter, statusFilter, dateFilter]);

    const CATEGORY_OPTIONS = [
        { value: "all", label: "All Categories" },
        { value: "Electronics", label: "Electronics" },
        { value: "Documents", label: "Documents" },
        { value: "Bags", label: "Bags" },
        { value: "Keys", label: "Keys" },
        { value: "Wallet", label: "Wallet" },
        { value: "Clothing", label: "Clothing" },
        { value: "Others", label: "Others" },
    ];

    const STATUS_OPTIONS = [
        { value: "all", label: "All Status" },
        { value: "lost", label: "Lost" },
        { value: "found", label: "Found" },
    ];

    const DATE_OPTIONS = [
        { value: "all", label: "All Time" },
        { value: "today", label: "Today" },
        { value: "week", label: "This Week" },
        { value: "month", label: "This Month" },
    ];

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">

            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#001F3F]">Search Items</h1>
                <p className="text-gray-400 mt-1 text-sm">Browse and search through lost and found belongings on campus</p>
            </div>

            {/* Filter Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">

                {/* Search bar + view toggle */}
                <div className="flex gap-3 mb-5">
                    <div className="flex-1 relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by item name, location, or category…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-[#F5F6F8] border border-gray-200 rounded-xl text-sm font-medium text-[#001F3F] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/30 focus:border-[#00A8E8] transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#001F3F] transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>

                    {/* View toggle */}
                    <div className="flex items-center gap-1 bg-[#F5F6F8] p-1 rounded-xl border border-gray-200">
                        <button
                            onClick={() => setViewType("grid")}
                            className={`p-2 rounded-lg transition-all duration-200 ${viewType === "grid" ? "bg-white text-[#00A8E8] shadow-sm" : "text-gray-400 hover:text-[#001F3F]"}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
                        </button>
                        <button
                            onClick={() => setViewType("list")}
                            className={`p-2 rounded-lg transition-all duration-200 ${viewType === "list" ? "bg-white text-[#00A8E8] shadow-sm" : "text-gray-400 hover:text-[#001F3F]"}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" /></svg>
                        </button>
                    </div>
                </div>

                {/* Three dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Category</label>
                        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full bg-[#F5F6F8] border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium text-[#001F3F] focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/30 focus:border-[#00A8E8] transition-all">
                            {CATEGORY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Status</label>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-[#F5F6F8] border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium text-[#001F3F] focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/30 focus:border-[#00A8E8] transition-all">
                            {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Date Range</label>
                        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full bg-[#F5F6F8] border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium text-[#001F3F] focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/30 focus:border-[#00A8E8] transition-all">
                            {DATE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* Active filters */}
                {activeFilterCount > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-gray-400 font-semibold">Active filters:</span>
                        {searchQuery && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#001F3F]/5 text-[#001F3F] text-[11px] font-bold rounded-lg">
                                Search: "{searchQuery}"
                                <button onClick={() => setSearchQuery("")} className="hover:text-red-500 transition-colors ml-0.5"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </span>
                        )}
                        {categoryFilter !== "all" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#001F3F]/5 text-[#001F3F] text-[11px] font-bold rounded-lg">
                                {categoryFilter}
                                <button onClick={() => setCategoryFilter("all")} className="hover:text-red-500 transition-colors ml-0.5"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </span>
                        )}
                        {statusFilter !== "all" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#001F3F]/5 text-[#001F3F] text-[11px] font-bold rounded-lg capitalize">
                                {statusFilter}
                                <button onClick={() => setStatusFilter("all")} className="hover:text-red-500 transition-colors ml-0.5"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </span>
                        )}
                        {dateFilter !== "all" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#001F3F]/5 text-[#001F3F] text-[11px] font-bold rounded-lg">
                                {DATE_OPTIONS.find(d => d.value === dateFilter)?.label}
                                <button onClick={() => setDateFilter("all")} className="hover:text-red-500 transition-colors ml-0.5"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </span>
                        )}
                        <button onClick={clearAllFilters} className="ml-auto text-[11px] font-bold text-red-400 hover:text-red-600 transition-colors">
                            Clear all
                        </button>
                    </div>
                )}
            </div>

            {/* Results count */}
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-[#001F3F]">
                        {loading ? "Loading…" : `${filteredItems.length} item${filteredItems.length !== 1 ? "s" : ""}`}
                    </h3>
                    {!loading && activeFilterCount > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">Filtered from {items.length} total items</p>
                    )}
                </div>
            </div>

            {/* Results */}
            {loading ? (
                <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 h-60" />
                    ))}
                </div>
            ) : filteredItems.length > 0 ? (
                viewType === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredItems.map((item) => (
                            <div
                                key={item._id}
                                onClick={() => navigate(`/item/${item._id}`)}
                                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-[#00A8E8]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                            >
                                <div className="h-44 bg-[#F5F6F8] overflow-hidden relative">
                                    {item.images?.[0] ? (
                                        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                                        </div>
                                    )}
                                    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border shadow-sm backdrop-blur-sm ${item.type === "lost" ? "bg-red-50 text-red-500 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                                        {item.type === "lost" ? "Lost" : "Found"}
                                    </span>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-[#001F3F] text-sm line-clamp-2">{item.title}</h3>
                                    <div className="space-y-1 mt-2 text-[11px] text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                                            <span className="truncate">{item.location}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0121 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                                            {formatDate(item.date || item.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredItems.map((item) => (
                            <div
                                key={item._id}
                                onClick={() => navigate(`/item/${item._id}`)}
                                className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:border-[#00A8E8]/30 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                            >
                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F5F6F8] flex-shrink-0">
                                    {item.images?.[0] ? (
                                        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">📦</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-[#001F3F] text-sm truncate">{item.title}</h3>
                                    <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1 flex-wrap">
                                        <span className="flex items-center gap-1">
                                            📍 {item.location}
                                        </span>
                                        <span>•</span>
                                        <span>{formatDate(item.date || item.createdAt)}</span>
                                    </div>
                                </div>
                                <span className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${item.type === "lost" ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`}>
                                    {item.type === "lost" ? "Lost" : "Found"}
                                </span>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-gray-200">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                    </div>
                    {activeFilterCount > 0 ? (
                        <>
                            <p className="text-[#001F3F] font-bold text-base">No items match your filters</p>
                            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter criteria.</p>
                            <button onClick={clearAllFilters} className="mt-5 px-5 py-2.5 bg-[#1E293B] text-white rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-[#00A8E8] transition-colors">
                                Clear All Filters
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="text-[#001F3F] font-bold text-base">No items yet</p>
                            <p className="text-gray-400 text-sm mt-1">Be the first to report a lost or found item.</p>
                            <button onClick={() => navigate("/report")} className="mt-5 px-5 py-2.5 bg-[#00A8E8] text-white rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-[#001F3F] transition-colors">
                                Report an Item
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchItemsPage;
