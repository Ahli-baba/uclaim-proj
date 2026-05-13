import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";

/* ─── Global styles (injected once) ───────────────────────────────────────── */
const SEARCH_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

.search-page * { font-family: 'Sora', sans-serif; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.fade-up  { animation: fadeUp  0.35s ease both; }
.fade-in  { animation: fadeIn  0.25s ease both; }

.card-enter { animation: fadeUp 0.35s ease both; }

.search-input:focus {
  box-shadow: 0 0 0 3px rgba(0,168,232,0.18), 0 1px 4px rgba(0,0,0,0.06);
}

.item-card {
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
.item-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,168,232,0.1);
  border-color: rgba(0,168,232,0.25) !important;
}
.item-card:hover .card-img { transform: scale(1.05); }
.card-img { transition: transform 0.4s ease; }

.list-row {
  transition: background 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}
.list-row:hover {
  background: rgba(0,168,232,0.03);
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  border-color: rgba(0,168,232,0.2) !important;
}

.ripple { position: relative; overflow: hidden; }
.ripple::after {
  content: ''; position: absolute; inset: 0;
  background: rgba(255,255,255,0.18);
  opacity: 0; border-radius: inherit; transition: opacity 0.2s;
}
.ripple:active::after { opacity: 1; }

.page-btn-active {
  background: linear-gradient(135deg, #001F3F, #00305A);
  color: white;
  box-shadow: 0 4px 10px rgba(0,31,63,0.25);
}
`;

/* ─── Constants ────────────────────────────────────────────────────────────── */
const CATEGORY_OPTIONS_FALLBACK = [
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

const ITEMS_PER_PAGE = 8;

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

const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const formatRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);
    const diffHours = Math.floor((now - date) / 3600000);
    const diffDays = Math.floor((now - date) / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
};

/* ─── SearchItemsPage ──────────────────────────────────────────────────────── */
const SearchItemsPage = () => {
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewType, setViewType] = useState("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [currentPage, setCurrentPage] = useState(1);
    const [categoryOptions, setCategoryOptions] = useState(CATEGORY_OPTIONS_FALLBACK);
    const [hideMyPosts, setHideMyPosts] = useState(false);
    const currentUser = useMemo(() => {
        try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
    }, []);

    useEffect(() => {
        if (!document.getElementById("uclaim-search-styles")) {
            const el = document.createElement("style");
            el.id = "uclaim-search-styles";
            el.textContent = SEARCH_CSS;
            document.head.appendChild(el);
        }
    }, []);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const data = await api.getCategories();
                const opts = [
                    { value: "all", label: "All Categories" },
                    ...data.map((cat) => ({ value: cat.value, label: cat.name })),
                ];
                setCategoryOptions(opts);
            } catch {
                // keep fallback
            }
        };
        loadCategories();
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.getItems();
            setItems(Array.isArray(data) ? data : (data.items || []));
        } catch (err) {
            console.error("Failed to fetch:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!localStorage.getItem("user")) { navigate("/login"); return; }
        fetchData();
    }, [navigate, fetchData]);

    useEffect(() => { setCurrentPage(1); }, [searchQuery, categoryFilter, statusFilter, dateFilter, sortBy]);

    const activeFilterCount = useMemo(() => {
        let c = 0;
        if (categoryFilter !== "all") c++;
        if (statusFilter !== "all") c++;
        if (dateFilter !== "all") c++;
        if (searchQuery.trim()) c++;
        return c;
    }, [categoryFilter, statusFilter, dateFilter, searchQuery]);

    const clearAllFilters = () => {
        setSearchQuery(""); setCategoryFilter("all");
        setStatusFilter("all"); setDateFilter("all"); setSortBy("newest"); setCurrentPage(1);
    };

    const filteredItems = useMemo(() => {
        const result = items.filter((item) => {
            if (item.status === "resolved" || item.status === "claimed") return false;
            if (hideMyPosts && currentUser && (item.reportedBy?._id || item.reportedBy) === currentUser._id) return false;
            const q = searchQuery.toLowerCase();
            return (
                (!q || item.title?.toLowerCase().includes(q) || item.location?.toLowerCase().includes(q) || item.category?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)) &&
                (categoryFilter === "all" || item.category === categoryFilter) &&
                (statusFilter === "all" || item.type === statusFilter) &&
                isWithinPeriod(item.date || item.createdAt, dateFilter)
            );
        });
        result.sort((a, b) => {
            const da = new Date(a.createdAt);
            const db = new Date(b.createdAt);
            return sortBy === "newest" ? db - da : da - db;
        });
        return result;
    }, [items, searchQuery, categoryFilter, statusFilter, dateFilter, sortBy, hideMyPosts, currentUser]);

    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredItems.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredItems, currentPage]);

    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

    return (
        <div className="search-page p-6 lg:p-8 max-w-7xl mx-auto">

            {/* ── Page Header ──────────────────────────────────────────────── */}
            <div className="mb-8 fade-up" style={{ animationDelay: "0ms" }}>
                <h1 className="text-3xl font-extrabold text-[#001F3F] tracking-tight">Search Items</h1>
                <p className="text-[#94A3B8] text-sm font-medium mt-1.5">
                    Browse lost &amp; found belongings on campus
                </p>
            </div>

            {/* ── Filter Card ──────────────────────────────────────────────── */}
            <div
                className="bg-white rounded-2xl p-5 mb-3 fade-up"
                style={{
                    border: "1px solid #F1F5F9",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.05), 0 1px 4px rgba(0,0,0,0.04)",
                    animationDelay: "60ms",
                }}
            >
                {/* Search bar + view toggle */}
                <div className="flex gap-2 mb-4">
                    <div className="flex-1 relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">
                            <SearchMagIcon className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by item name, location, or category…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input w-full pl-9 pr-9 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#001F3F] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A8E8] transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#001F3F] transition-colors p-1"
                            >
                                <XIcon className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0] gap-0.5">
                        {[
                            { key: "grid", icon: <GridIcon className="w-4 h-4" /> },
                            { key: "list", icon: <ListIcon2 className="w-4 h-4" /> },
                        ].map(v => (
                            <button
                                key={v.key}
                                onClick={() => setViewType(v.key)}
                                className={`p-2.5 rounded-lg transition-all duration-200 ${viewType === v.key
                                    ? "bg-white text-[#00A8E8] shadow-sm"
                                    : "text-[#94A3B8] hover:text-[#001F3F]"
                                    }`}
                                title={v.key === "grid" ? "Grid view" : "List view"}
                            >
                                {v.icon}
                            </button>
                        ))}
                        <div className="w-px h-5 bg-[#E2E8F0] mx-0.5" />
                        {[
                            { key: "newest", icon: <SortDescIcon className="w-4 h-4" />, title: "Newest first" },
                            { key: "oldest", icon: <SortAscIcon className="w-4 h-4" />, title: "Oldest first" },
                        ].map(v => (
                            <button
                                key={v.key}
                                onClick={() => setSortBy(v.key)}
                                className={`p-2.5 rounded-lg transition-all duration-200 ${sortBy === v.key
                                    ? "bg-white text-[#00A8E8] shadow-sm"
                                    : "text-[#94A3B8] hover:text-[#001F3F]"
                                    }`}
                                title={v.title}
                            >
                                {v.icon}
                            </button>
                        ))}
                        <div className="w-px h-5 bg-[#E2E8F0] mx-0.5" />
                        <button
                            onClick={() => setHideMyPosts(h => !h)}
                            className={`p-2.5 rounded-lg transition-all duration-200 ${hideMyPosts
                                ? "bg-white text-[#00A8E8] shadow-sm"
                                : "text-[#94A3B8] hover:text-[#001F3F]"
                                }`}
                            title={hideMyPosts ? "Show my posts" : "Hide my posts"}
                        >
                            <TagIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Three dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        { label: "Category", val: categoryFilter, set: setCategoryFilter, opts: categoryOptions },
                        { label: "Status", val: statusFilter, set: setStatusFilter, opts: STATUS_OPTIONS },
                        { label: "Date Range", val: dateFilter, set: setDateFilter, opts: DATE_OPTIONS },
                    ].map(({ label, val, set, opts }) => (
                        <div key={label}>
                            <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-1.5">{label}</label>
                            <select
                                value={val}
                                onChange={(e) => set(e.target.value)}
                                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-2.5 rounded-xl text-sm font-medium text-[#001F3F] focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/20 focus:border-[#00A8E8] transition-all appearance-none"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", backgroundSize: "16px", paddingRight: "36px" }}
                            >
                                {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                    ))}

                </div>

                {/* Active filter tags */}
                {activeFilterCount > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#F1F5F9] flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-[#94A3B8] font-semibold">Active:</span>
                        {searchQuery && (
                            <FilterTag label={`"${searchQuery}"`} onRemove={() => setSearchQuery("")} />
                        )}
                        {categoryFilter !== "all" && (
                            <FilterTag label={categoryFilter} onRemove={() => setCategoryFilter("all")} />
                        )}
                        {statusFilter !== "all" && (
                            <FilterTag label={statusFilter} onRemove={() => setStatusFilter("all")} />
                        )}
                        {dateFilter !== "all" && (
                            <FilterTag label={DATE_OPTIONS.find(d => d.value === dateFilter)?.label} onRemove={() => setDateFilter("all")} />
                        )}
                        <button onClick={clearAllFilters} className="ml-auto text-[11px] font-bold text-red-400 hover:text-red-600 transition-colors">
                            Clear all
                        </button>
                    </div>
                )}
            </div>

            {/* ── Results header ───────────────────────────────────────────── */}
            <div className="mb-4 flex items-center justify-between gap-4 fade-up" style={{ animationDelay: "120ms" }}>
                <div className="flex items-center gap-3 flex-wrap">
                </div>

                {!loading && totalPages > 1 && (
                    <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
                )}
            </div>

            {/* ── Results ──────────────────────────────────────────────────── */}
            {loading ? (
                <SkeletonGrid />
            ) : filteredItems.length > 0 ? (
                viewType === "grid"
                    ? <GridView items={paginatedItems} navigate={navigate} currentUser={currentUser} />
                    : <ListView items={paginatedItems} navigate={navigate} currentUser={currentUser} />
            ) : (
                <EmptyState hasFilters={activeFilterCount > 0} onClear={clearAllFilters} onReport={() => navigate("/report")} />
            )}

            {/* Bottom pagination */}
            {!loading && totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                    <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
                </div>
            )}
        </div>
    );
};

/* ─── Category Icon ────────────────────────────────────────────────────────── */
const CategoryIcon = ({ category, className = "w-8 h-8" }) => {
    const cat = category?.toLowerCase() || "others";
    switch (cat) {
        case "electronics":
            return <DeviceIcon className={className} />;
        case "documents":
            return <DocIcon className={className} />;
        case "bags":
            return <BagIcon className={className} />;
        case "keys":
            return <KeyIcon className={className} />;
        case "wallet":
            return <WalletIcon className={className} />;
        case "clothing":
            return <ShirtIcon className={className} />;
        default:
            return <BoxIcon className={className} />;
    }
};

/* ─── Grid View ────────────────────────────────────────────────────────────── */
const GridView = ({ items, navigate, currentUser }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item, i) => {
            const hasImage = !!item.images?.[0];
            return (
                <div
                    key={item._id}
                    onClick={() => navigate(`/item/${item._id}`)}
                    className="item-card card-enter bg-white rounded-2xl border border-[#F1F5F9] overflow-hidden cursor-pointer group"
                    style={{
                        animationDelay: `${i * 40}ms`,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                    title={`Posted on ${formatDate(item.date || item.createdAt)}`}
                >
                    {/* Image */}
                    <div className="h-40 bg-[#F8FAFC] overflow-hidden relative">
                        {hasImage ? (
                            <img src={item.images[0]} alt={item.title} className="card-img w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#F8FAFC]">
                                <CategoryIcon category={item.category} className="w-10 h-10 text-[#CBD5E1]" />
                            </div>
                        )}
                        {/* Status badge */}
                        <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border backdrop-blur-sm ${item.type === "lost"
                            ? "bg-red-50 text-red-600 border-red-100"
                            : "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}>
                            {item.type === "lost" ? "Lost" : "Found"}
                        </span>
                        {currentUser && (item.reportedBy?._id || item.reportedBy) === currentUser._id && (
                            <span className="absolute top-2.5 left-2.5 w-[22px] h-[22px] rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}>
                                <TagIcon className="w-3 h-3 text-white" />
                            </span>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        <h3 className="font-bold text-[#001F3F] text-sm line-clamp-2 leading-snug group-hover:text-[#00A8E8] transition-colors mb-2">{item.title}</h3>
                        <div className="space-y-1 text-[11px] text-[#94A3B8] font-medium">
                            <div className="flex items-center gap-1.5">
                                <PinIcon className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{item.location}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <CalIcon className="w-3 h-3 flex-shrink-0" />
                                <span>{formatRelativeDate(item.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
);

/* ─── List View ────────────────────────────────────────────────────────────── */
const ListView = ({ items, navigate, currentUser }) => (
    <div className="space-y-2.5">
        {items.map((item, i) => {
            const isLost = item.type === "lost";
            return (
                <div
                    key={item._id}
                    onClick={() => navigate(`/item/${item._id}`)}
                    className="list-row card-enter bg-white rounded-2xl border border-[#F1F5F9] overflow-hidden cursor-pointer flex items-center group"
                    style={{
                        animationDelay: `${i * 35}ms`,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    }}
                    title={`Posted on ${formatDate(item.date || item.createdAt)}`}
                >
                    {/* Thumbnail */}
                    <div className="relative w-16 h-16 m-3 rounded-xl overflow-hidden bg-[#F8FAFC] flex-shrink-0 flex items-center justify-center">
                        {item.images?.[0]
                            ? <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                            : <CategoryIcon category={item.category} className="w-6 h-6 text-[#CBD5E1]" />
                        }
                        {currentUser && (item.reportedBy?._id || item.reportedBy) === currentUser._id && (
                            <span className="absolute top-1 left-1 w-[18px] h-[18px] rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}>
                                <TagIcon className="w-2.5 h-2.5 text-white" />
                            </span>
                        )}
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0 py-3 pr-2">
                        <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-semibold text-[#001F3F] text-sm truncate group-hover:text-[#00A8E8] transition-colors">{item.title}</h3>
                            {item.category && (
                                <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-[#F8FAFC] text-[#94A3B8] border border-[#F1F5F9]">
                                    {item.category}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[#94A3B8] mt-1 font-medium flex-wrap">
                            <span className="flex items-center gap-1">
                                <PinIcon className="w-3 h-3" />
                                {item.location}
                            </span>
                            <span className="w-0.5 h-0.5 bg-[#CBD5E1] rounded-full" />
                            <span className="flex items-center gap-1">
                                <CalIcon className="w-3 h-3" />
                                {formatRelativeDate(item.createdAt)}
                            </span>
                        </div>
                    </div>

                    {/* Status badge + arrow */}
                    <div className="flex items-center gap-2 px-4 flex-shrink-0">
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${isLost
                            ? "bg-red-50 text-red-600 border-red-100"
                            : "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}>
                            {isLost ? "Lost" : "Found"}
                        </span>
                        <ChevronR className="w-4 h-4 text-[#E2E8F0] group-hover:text-[#00A8E8] transition-colors" />
                    </div>
                </div>
            );
        })}
    </div>
);

/* ─── Pagination ───────────────────────────────────────────────────────────── */
const Pagination = ({ current, total, onChange }) => {
    const getPages = () => {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        const pages = new Set([1, 2, current - 1, current, current + 1, total - 1, total]);
        return [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
    };
    const pages = getPages();
    return (
        <div className="flex items-center gap-1">
            <PagBtn disabled={current === 1} onClick={() => onChange(p => Math.max(1, p - 1))}>
                <ChevronL className="w-3.5 h-3.5" />
            </PagBtn>
            {pages.map((page, i) => {
                const prev = pages[i - 1];
                return (
                    <span key={page} className="flex items-center gap-1">
                        {prev && page - prev > 1 && (
                            <span className="w-8 h-8 flex items-center justify-center text-xs text-[#94A3B8]">…</span>
                        )}
                        <button
                            onClick={() => onChange(page)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${current === page
                                ? "page-btn-active"
                                : "border border-[#E2E8F0] text-[#64748B] hover:border-[#00A8E8] hover:text-[#00A8E8]"
                                }`}
                        >
                            {page}
                        </button>
                    </span>
                );
            })}
            <PagBtn disabled={current === total} onClick={() => onChange(p => Math.min(total, p + 1))}>
                <ChevronR className="w-3.5 h-3.5" />
            </PagBtn>
        </div>
    );
};
const PagBtn = ({ children, disabled, onClick }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:border-[#00A8E8] hover:text-[#00A8E8] disabled:opacity-25 disabled:cursor-not-allowed transition-all"
    >
        {children}
    </button>
);

/* ─── Filter Tag ───────────────────────────────────────────────────────────── */
const FilterTag = ({ label, onRemove }) => (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F1F5F9] text-[#001F3F] text-[11px] font-bold rounded-lg">
        {label}
        <button onClick={onRemove} className="hover:text-red-500 transition-colors ml-0.5">
            <XIcon className="w-3 h-3" />
        </button>
    </span>
);

/* ─── Empty State ──────────────────────────────────────────────────────────── */
const EmptyState = ({ hasFilters, onClear, onReport }) => (
    <div
        className="bg-white rounded-2xl flex flex-col items-center justify-center py-20 text-center fade-in"
        style={{ border: "1px solid #F1F5F9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
    >
        <div className="w-16 h-16 bg-[#F8FAFC] rounded-2xl flex items-center justify-center mb-4 text-[#CBD5E1]">
            <SearchMagIcon className="w-8 h-8" />
        </div>
        {hasFilters ? (
            <>
                <p className="text-[#001F3F] font-bold text-base">No items match your filters</p>
                <p className="text-[#94A3B8] text-sm mt-1">Try adjusting your search or filter criteria.</p>
                <button
                    onClick={onClear}
                    className="ripple mt-5 px-5 py-2.5 bg-[#001F3F] text-white rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-[#00A8E8] transition-all"
                >
                    Clear All Filters
                </button>
            </>
        ) : (
            <>
                <p className="text-[#001F3F] font-bold text-base">No items yet</p>
                <p className="text-[#94A3B8] text-sm mt-1">Be the first to report a lost or found item.</p>
                <button
                    onClick={onReport}
                    className="ripple mt-5 px-5 py-2.5 text-white rounded-xl font-bold text-xs uppercase tracking-wide transition-all"
                    style={{ background: "linear-gradient(135deg,#00A8E8,#0090CC)", boxShadow: "0 4px 12px rgba(0,168,232,0.3)" }}
                >
                    Report an Item
                </button>
            </>
        )}
    </div>
);

/* ─── Skeleton ─────────────────────────────────────────────────────────────── */
const SkeletonGrid = () => (
    <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-[#F1F5F9] rounded-2xl h-60" style={{ animationDelay: `${i * 50}ms` }} />
        ))}
    </div>
);

/* ─── Micro-icons ──────────────────────────────────────────────────────────── */
const SearchMagIcon = ({ className = "w-4 h-4" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const GridIcon = ({ className = "w-4 h-4" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>;
const ListIcon2 = ({ className = "w-4 h-4" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" /></svg>;
const XIcon = ({ className = "w-3.5 h-3.5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const PinIcon = ({ className = "w-3 h-3" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>;
const CalIcon = ({ className = "w-3 h-3" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>;
const ChevronR = ({ className = "w-4 h-4" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
const ChevronL = ({ className = "w-4 h-4" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>;
const BoxIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>;
const DeviceIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>;
const DocIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const BagIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;
const KeyIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>;
const WalletIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" /></svg>;
const SortDescIcon = ({ className = "w-4 h-4" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 15m0 0l3.75-3.75M17.25 15V6.75" /></svg>;
const SortAscIcon = ({ className = "w-4 h-4" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m8.25-9v11.25m0 0l-3.75-3.75M16.5 15.75l3.75-3.75" /></svg>;
const TagIcon = ({ className = "w-3 h-3" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.41 11.58l-9-9A2 2 0 0011 2H4a2 2 0 00-2 2v7a2 2 0 00.59 1.42l9 9a2 2 0 002.82 0l7-7a2 2 0 000-2.84zM7 9a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
    </svg>
);
const ShirtIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>;
export default SearchItemsPage;