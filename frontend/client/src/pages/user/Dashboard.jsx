import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";

const getBaseUrl = () => "https://uclaim-proj-production.up.railway.app";

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

/* ─── Inline styles injected once ─────────────────────────────────────────── */
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

* { font-family: 'Sora', sans-serif; }

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes countUp {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes tabSlide {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
.animate-fade-up    { animation: fadeSlideUp 0.4s ease both; }
.animate-count-up   { animation: countUp 0.5s ease both; }
.tab-indicator      { transform-origin: left; animation: tabSlide 0.25s ease both; }

/* Stat card glow on hover */
.stat-card:hover .stat-glow { opacity: 1; }
.stat-glow {
  opacity: 0;
  transition: opacity 0.3s ease;
  position: absolute; inset: 0; border-radius: inherit;
  pointer-events: none;
}

/* Row left-strip */
.row-strip {
  width: 3px; border-radius: 2px; flex-shrink: 0;
  align-self: stretch; min-height: 40px;
}

/* Ripple */
.ripple-btn { position: relative; overflow: hidden; }
.ripple-btn::after {
  content: ''; position: absolute; inset: 0;
  background: rgba(255,255,255,0.15);
  opacity: 0; border-radius: inherit;
  transition: opacity 0.2s;
}
.ripple-btn:active::after { opacity: 1; }
`;

/* ─── Dashboard ────────────────────────────────────────────────────────────── */
const Dashboard = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState("Student");
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ lost: 0, found: 0, claimed: 0 });
    const [activities, setActivities] = useState([]);
    const [myClaims, setMyClaims] = useState([]);
    const [myFinderReports, setMyFinderReports] = useState([]);
    const [activeTab, setActiveTab] = useState("reports");
    const [showAllClaims, setShowAllClaims] = useState(false);
    const [showAllPosts, setShowAllPosts] = useState(false);
    const [showAllFinderReports, setShowAllFinderReports] = useState(false);
    const [activeDateFilter, setActiveDateFilter] = useState("all");

    const filteredActivities = useMemo(
        () => activities.filter((a) => isWithinPeriod(a.date, activeDateFilter)),
        [activities, activeDateFilter]
    );

    const fetchDashboardData = useCallback(async (period = activeDateFilter) => {
        try {
            setLoading(true);
            const [statsData, activitiesData, claimsData] = await Promise.all([
                api.getDashboardStats(period),
                api.getRecentActivity(period),
                api.getMyClaims(),
            ]);
            setStats(statsData);
            setActivities(activitiesData);
            const order = { pending: 0, approved: 1, rejected: 2, picked_up: 3 };
            setMyClaims(
                claimsData
                    .filter(c => c.type !== "finder_report")
                    .sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9))
            );
            setMyFinderReports(
                claimsData
                    .filter(c => c.type === "finder_report")
                    .sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9))
            );
        } catch (err) {
            console.error("Failed to fetch dashboard data:", err);
            if (err.message.includes("401")) navigate("/login");
        } finally {
            setLoading(false);
        }
    }, [activeDateFilter, navigate]);

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (!savedUser) { navigate("/login"); return; }
        const parsedUser = JSON.parse(savedUser);
        setUserName(parsedUser.name || "User");
        fetchDashboardData("all");
        // inject global CSS once
        if (!document.getElementById("uclaim-dash-styles")) {
            const el = document.createElement("style");
            el.id = "uclaim-dash-styles";
            el.textContent = GLOBAL_CSS;
            document.head.appendChild(el);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    const handleDateFilterChange = (key) => {
        setActiveDateFilter(key);
        fetchDashboardData(key);
    };

    /* helpers */
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMins = Math.floor((now - date) / 60000);
        const diffHours = Math.floor((now - date) / 3600000);
        const diffDays = Math.floor((now - date) / 86400000);
        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const getImageUrl = (activity) => {
        const baseUrl = getBaseUrl();
        let raw = activity.image || activity.images?.[0] || activity.photo
            || activity.photos?.[0] || activity.imgUrl || activity.imageUrl || null;
        if (!raw) return null;
        if (raw.startsWith("data:") || raw.startsWith("http://") || raw.startsWith("https://")) return raw;
        return baseUrl + (raw.startsWith("/") ? "" : "/") + raw;
    };

    const getStatusConfig = (activity) => {
        const status = activity.status?.toLowerCase();
        const type = activity.type?.toLowerCase();
        if (status === "claimed" || status === "resolved")
            return {
                label: "Resolved", bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-200", strip: "#00A8E8",
                icon: <CheckIcon />
            };
        if (status === "active" && type === "lost")
            return {
                label: "Lost", bg: "bg-red-50", text: "text-red-500", border: "border-red-200", strip: "#EF4444",
                icon: <QuestionIcon />
            };
        if (status === "active" && type === "found")
            return {
                label: "Found", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", strip: "#10B981",
                icon: <SearchIcon sm />
            };
        return { label: status || "Unknown", bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200", strip: "#94A3B8", icon: null };
    };

    const getTypeIcon = (type) => {
        const isLost = type?.toLowerCase() === "lost";
        return (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLost ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"}`}>
                {isLost ? <QuestionIcon /> : <SearchIcon />}
            </div>
        );
    };

    const activeClaims = myClaims.filter(c => c.status === "pending" || c.status === "approved");

    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">

            {/* Welcome Header */}
            <div className="mb-8 animate-fade-up" style={{ animationDelay: "0ms" }}>
                <h1 className="text-3xl font-extrabold text-[#001F3F] tracking-tight">
                    Welcome back,{" "}
                    <span
                        className="text-transparent bg-clip-text"
                        style={{ backgroundImage: "linear-gradient(135deg, #00A8E8, #0090CC)" }}
                    >
                        {userName}
                    </span>
                </h1>
                <p className="text-[#94A3B8] mt-1.5 text-sm font-medium">
                    Here&apos;s what&apos;s happening with your items today.
                </p>
            </div>

            {loading ? (
                <DashboardSkeleton />
            ) : (
                <>
                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 animate-fade-up" style={{ animationDelay: "60ms" }}>
                        {/* PRIMARY — Report an Item */}
                        <button
                            onClick={() => navigate("/report")}
                            className="ripple-btn p-7 rounded-2xl flex items-center gap-5 text-left text-white group transition-all duration-300 hover:-translate-y-1"
                            style={{
                                background: "linear-gradient(135deg, #00A8E8 0%, #0090CC 100%)",
                                boxShadow: "0 8px 24px rgba(0,168,232,0.28), 0 2px 6px rgba(0,168,232,0.18)",
                            }}
                        >
                            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:bg-white/30">
                                <PlusIcon className="w-7 h-7" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-lg tracking-tight">Report an Item</h4>
                                <p className="text-white/70 text-sm mt-0.5">Lost something? Report it now.</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-white/50 transition-all group-hover:text-white group-hover:translate-x-1" />
                        </button>

                        {/* PEER — Browse Items (light sky tint, not plain white) */}
                        <button
                            onClick={() => navigate("/search")}
                            className="p-7 rounded-2xl flex items-center gap-5 text-left group transition-all duration-300 hover:-translate-y-1 border border-[#E0F4FC]"
                            style={{
                                background: "linear-gradient(135deg, #EBF8FF 0%, #F0FAFF 100%)",
                                boxShadow: "0 4px 16px rgba(0,168,232,0.08), 0 1px 4px rgba(0,168,232,0.06)",
                            }}
                        >
                            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 text-[#00A8E8] transition-all duration-300 group-hover:bg-[#00A8E8] group-hover:text-white group-hover:scale-110" style={{ boxShadow: "0 2px 8px rgba(0,168,232,0.15)" }}>
                                <ListIcon className="w-7 h-7" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-lg text-[#001F3F] tracking-tight">Browse Items</h4>
                                <p className="text-[#64A8C8] text-sm mt-0.5">Search all lost &amp; found listings.</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-[#B0D8ED] transition-all group-hover:text-[#00A8E8] group-hover:translate-x-1" />
                        </button>
                    </div>

                    {/* Overview header */}
                    <div className="mb-4 animate-fade-up" style={{ animationDelay: "120ms" }}>
                        <h3 className="text-base font-bold text-[#001F3F] tracking-tight">Overview</h3>
                        <p className="text-xs text-[#94A3B8] mt-0.5 font-medium">Current status of your activity</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 animate-fade-up" style={{ animationDelay: "160ms" }}>
                        <StatBox
                            label="Lost Posts" val={stats.lost} color="text-red-500"
                            iconBg="bg-red-50" glowColor="rgba(239,68,68,0.12)"
                            icon={<QuestionIcon className="w-5 h-5 text-red-500" />}
                            bar barColor="#EF4444"
                        />
                        <StatBox
                            label="Found Posts" val={stats.found} color="text-emerald-600"
                            iconBg="bg-emerald-50" glowColor="rgba(16,185,129,0.12)"
                            icon={<SearchIcon className="w-5 h-5 text-emerald-500" />}
                            bar barColor="#10B981"
                        />
                        <StatBox
                            label="Resolved Items" val={stats.resolved ?? 0} color="text-sky-500"
                            iconBg="bg-sky-50" glowColor="rgba(0,168,232,0.12)"
                            icon={<CheckIcon className="w-5 h-5 text-sky-500" />}
                            bar barColor="#00A8E8"
                        />
                        <StatBox
                            label="Awaiting Review" val={stats.awaitingReview ?? 0}
                            color="text-amber-500" iconBg="bg-amber-50"
                            glowColor="rgba(245,158,11,0.12)"
                            icon={<ClockIcon className="w-5 h-5 text-amber-500" />}
                            bar barColor="#F59E0B"
                        />
                    </div>

                    {/* Activity section */}
                    <div
                        className="rounded-2xl overflow-hidden mb-8 animate-fade-up bg-white"
                        style={{
                            boxShadow: "0 8px 24px rgba(0,0,0,0.05), 0 1px 4px rgba(0,0,0,0.04)",
                            border: "1px solid #F1F5F9",
                            animationDelay: "200ms",
                        }}
                    >
                        {/* Combined header with segmented toggle */}
                        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#F1F5F9]">
                            <div>
                                <h3 className="text-base font-bold text-[#001F3F] tracking-tight">Activity</h3>
                                <p className="text-xs text-[#94A3B8] mt-0.5 font-medium">Your reports, claims, and found items</p>
                            </div>

                            {/* Segmented toggle — right side of header */}
                            <div className="flex items-center bg-[#F1F5F9] p-1 rounded-xl gap-0.5">
                                {[
                                    { key: "reports", label: "Posts", icon: <PostsTabIcon />, badge: 0 },
                                    { key: "claims", label: "Claims", icon: <ClaimsTabIcon />, badge: activeClaims.length },
                                    { key: "finds", label: "Finds", icon: <FindsTabIcon />, badge: myFinderReports.filter(f => f.status === "pending" || f.status === "approved").length },
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${activeTab === tab.key
                                            ? "bg-white text-[#00A8E8] shadow-sm"
                                            : "text-[#94A3B8] hover:text-[#001F3F]"
                                            }`}
                                    >
                                        <span>{tab.icon}</span>
                                        {tab.label}
                                        {tab.badge > 0 && (
                                            <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">
                                                {tab.badge}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab content */}
                        <div>
                            {activeTab === "claims" ? (
                                <ClaimsTab
                                    myClaims={myClaims}
                                    activeClaims={activeClaims}
                                    showAllClaims={showAllClaims}
                                    setShowAllClaims={setShowAllClaims}
                                    formatDate={formatDate}
                                    navigate={navigate}
                                />
                            ) : activeTab === "finds" ? (
                                <FindsTab
                                    myFinderReports={myFinderReports}
                                    showAllFinderReports={showAllFinderReports}
                                    setShowAllFinderReports={setShowAllFinderReports}
                                    formatDate={formatDate}
                                    navigate={navigate}
                                />
                            ) : (
                                <PostsTab
                                    filteredActivities={filteredActivities}
                                    showAllPosts={showAllPosts}
                                    setShowAllPosts={setShowAllPosts}
                                    formatDate={formatDate}
                                    getImageUrl={getImageUrl}
                                    getStatusConfig={getStatusConfig}
                                    getTypeIcon={getTypeIcon}
                                    navigate={navigate}
                                    activeDateFilter={activeDateFilter}
                                    onDateFilter={handleDateFilterChange}
                                />
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

/* ─── Posts Tab ────────────────────────────────────────────────────────────── */
const PostsTab = ({
    filteredActivities, showAllPosts, setShowAllPosts,
    formatDate, getImageUrl, getStatusConfig, getTypeIcon,
    navigate, activeDateFilter, onDateFilter,
}) => {
    const activePosts = filteredActivities.filter(a => a.status?.toLowerCase() !== "claimed" && a.status?.toLowerCase() !== "resolved");
    const resolvedPosts = filteredActivities.filter(a => a.status?.toLowerCase() === "claimed" || a.status?.toLowerCase() === "resolved");

    if (filteredActivities.length === 0) return (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-16 h-16 bg-[#F8FAFC] rounded-2xl flex items-center justify-center mb-4 text-[#CBD5E1]">
                <BoxIcon className="w-8 h-8" />
            </div>
            <p className="text-[#001F3F] font-bold text-base">No posts yet</p>
            <p className="text-[#94A3B8] text-sm mt-1 max-w-xs">Lost something? Post it so others can help. Found something? Report it so the owner can claim it.</p>
        </div>
    );

    const renderRow = (activity) => {
        const sc = getStatusConfig(activity);
        const imageUrl = getImageUrl(activity);
        const hasImage = !!imageUrl;
        return (
            <div
                key={activity.id}
                className="flex items-center gap-0 hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                onClick={() => navigate(`/item/${activity.id}`)}
            >
                {/* Left color strip */}
                <div className="row-strip ml-4" style={{ backgroundColor: sc.strip }} />

                <div className="flex items-center gap-4 flex-1 p-4 pl-3 min-w-0">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F1F5F9] flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                            {hasImage
                                ? <img src={imageUrl} alt={activity.title} className="w-full h-full object-cover"
                                    onError={(e) => { e.target.style.display = "none"; }} />
                                : getTypeIcon(activity.type)
                            }
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[#001F3F] text-sm truncate group-hover:text-[#00A8E8] transition-colors mb-0.5">{activity.title}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
                            <span className="flex items-center gap-1">
                                <PinIcon className="w-3 h-3" />
                                {activity.location}
                            </span>
                            <span className="w-0.5 h-0.5 bg-[#CBD5E1] rounded-full" />
                            <span>{formatDate(activity.date)}</span>
                        </div>
                    </div>

                    {/* Status badge */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`inline-flex items-center justify-center gap-1.5 h-7 px-3 rounded-full text-[11px] font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                            {sc.icon}
                            {sc.label}
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#E2E8F0] group-hover:text-[#00A8E8] transition-colors" />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="divide-y divide-[#F8FAFC]">
            {activePosts.map(renderRow)}

            {showAllPosts && resolvedPosts.length > 0 && (
                <>
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 h-px bg-[#F1F5F9]" />
                        <span className="text-[10px] font-bold text-[#CBD5E1] uppercase tracking-widest">Resolved</span>
                        <div className="flex-1 h-px bg-[#F1F5F9]" />
                    </div>
                    {resolvedPosts.map(renderRow)}
                </>
            )}

            {resolvedPosts.length > 0 && (
                <div className="px-4 py-3 text-center border-t border-[#F8FAFC]">
                    <button onClick={() => setShowAllPosts(p => !p)} className="text-xs font-bold text-[#94A3B8] hover:text-[#00A8E8] transition-colors">
                        {showAllPosts ? "Hide resolved posts" : `Show ${resolvedPosts.length} resolved post${resolvedPosts.length > 1 ? "s" : ""}`}
                    </button>
                </div>
            )}
        </div>
    );
};

/* ─── Claims Tab ───────────────────────────────────────────────────────────── */
const CLAIM_STATUS = {
    pending: { label: "Pending Review", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", strip: "#F59E0B" },
    approved: { label: "Approved", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", strip: "#10B981" },
    rejected: { label: "Rejected", bg: "bg-red-50", text: "text-red-500", border: "border-red-200", strip: "#EF4444" },
    picked_up: { label: "Picked Up", bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-200", strip: "#00A8E8" },
};

const FINDER_STATUS = {
    pending: { label: "Finder Report Pending", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", strip: "#F59E0B" },
    approved: { label: "Item at SAO", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", strip: "#10B981" },
    rejected: { label: "Report Declined", bg: "bg-red-50", text: "text-red-500", border: "border-red-200", strip: "#EF4444" },
    picked_up: { label: "Owner Collected", bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-200", strip: "#00A8E8" },
};

const ClaimsTab = ({ myClaims, activeClaims, showAllClaims, setShowAllClaims, formatDate, navigate }) => {
    const completedClaims = myClaims.filter(c => c.status !== "pending" && c.status !== "approved");

    if (myClaims.length === 0) return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-[#F8FAFC] rounded-2xl flex items-center justify-center mb-4 text-[#CBD5E1]">
                <CheckIcon className="w-8 h-8" />
            </div>
            <p className="text-[#001F3F] font-bold text-base">No claims yet</p>
            <p className="text-[#94A3B8] text-sm mt-1">Items you claim will appear here.</p>
        </div>
    );

    const renderRow = (claim) => {
        const cs = CLAIM_STATUS[claim.status] || CLAIM_STATUS.pending;
        const itemData = claim.item;
        const itemId = itemData?._id || itemData;
        const itemTitle = itemData?.title || "Unknown item";
        const itemImage = itemData?.images?.[0] || null;
        return (
            <div
                key={claim._id}
                className="flex items-center gap-0 hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                onClick={() => navigate(`/item/${itemId}`)}
            >
                {/* Left strip */}
                <div className="row-strip ml-4" style={{ backgroundColor: cs.strip }} />

                <div className="flex items-center gap-4 flex-1 p-4 pl-3 min-w-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F1F5F9] flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
                        {itemImage
                            ? <img src={itemImage} alt={itemTitle} className="w-full h-full object-cover" />
                            : <BoxIcon className="w-6 h-6 text-[#CBD5E1]" />
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[#001F3F] text-sm truncate group-hover:text-[#00A8E8] transition-colors">{itemTitle}</h4>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5 font-medium">Claimed {formatDate(claim.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`inline-flex items-center h-7 px-3 rounded-full text-[11px] font-bold border ${cs.bg} ${cs.text} ${cs.border}`}>{cs.label}</span>
                        <ChevronRight className="w-4 h-4 text-[#E2E8F0] group-hover:text-[#00A8E8] transition-colors" />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="divide-y divide-[#F8FAFC]">
            {activeClaims.map(renderRow)}

            {showAllClaims && completedClaims.length > 0 && (
                <>
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 h-px bg-[#F1F5F9]" />
                        <span className="text-[10px] font-bold text-[#CBD5E1] uppercase tracking-widest">Past</span>
                        <div className="flex-1 h-px bg-[#F1F5F9]" />
                    </div>
                    {completedClaims.map(renderRow)}
                </>
            )}

            {completedClaims.length > 0 && (
                <div className="px-4 py-3 text-center">
                    <button onClick={() => setShowAllClaims(p => !p)} className="text-xs font-bold text-[#94A3B8] hover:text-[#00A8E8] transition-colors">
                        {showAllClaims ? "Hide past claims" : `Show ${completedClaims.length} past claim${completedClaims.length > 1 ? "s" : ""}`}
                    </button>
                </div>
            )}

        </div>
    );
};

/* ─── Finds Tab ────────────────────────────────────────────────────────────── */
const FindsTab = ({ myFinderReports, showAllFinderReports, setShowAllFinderReports, formatDate, navigate }) => {
    const activeFinderReports = myFinderReports.filter(f => f.status === "pending" || f.status === "approved");
    const completedFinderReports = myFinderReports.filter(f => f.status !== "pending" && f.status !== "approved");

    if (myFinderReports.length === 0) return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-[#F8FAFC] rounded-2xl flex items-center justify-center mb-4 text-[#CBD5E1]">
                <SearchIcon className="w-8 h-8" />
            </div>
            <p className="text-[#001F3F] font-bold text-base">No finder reports yet</p>
            <p className="text-[#94A3B8] text-sm mt-1">Items you've found and turned in will appear here.</p>
        </div>
    );

    return (
        <div className="divide-y divide-[#F8FAFC]">
            {activeFinderReports.map(report => {
                const fs = FINDER_STATUS[report.status] || FINDER_STATUS.pending;
                const itemData = report.item;
                const itemId = itemData?._id || itemData;
                const itemTitle = itemData?.title || "Unknown item";
                const itemImage = itemData?.images?.[0] || null;
                return (
                    <div
                        key={report._id}
                        className="flex items-center gap-0 hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                        onClick={() => navigate(`/item/${itemId}`)}
                    >
                        <div className="row-strip ml-4" style={{ backgroundColor: fs.strip }} />
                        <div className="flex items-center gap-4 flex-1 p-4 pl-3 min-w-0">
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F1F5F9] flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
                                {itemImage
                                    ? <img src={itemImage} alt={itemTitle} className="w-full h-full object-cover" />
                                    : <BoxIcon className="w-6 h-6 text-[#CBD5E1]" />
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-[#001F3F] text-sm truncate group-hover:text-[#00A8E8] transition-colors">{itemTitle}</h4>
                                <p className="text-[11px] text-[#94A3B8] mt-0.5 font-medium">Found report · {formatDate(report.createdAt)}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`inline-flex items-center h-7 px-3 rounded-full text-[11px] font-bold border ${fs.bg} ${fs.text} ${fs.border}`}>{fs.label}</span>
                                <ChevronRight className="w-4 h-4 text-[#E2E8F0] group-hover:text-[#00A8E8] transition-colors" />
                            </div>
                        </div>
                    </div>
                );
            })}

            {showAllFinderReports && completedFinderReports.map(report => {
                const fs = FINDER_STATUS[report.status] || FINDER_STATUS.pending;
                const itemData = report.item;
                const itemId = itemData?._id || itemData;
                const itemTitle = itemData?.title || "Unknown item";
                const itemImage = itemData?.images?.[0] || null;
                return (
                    <div
                        key={report._id}
                        className="flex items-center gap-0 hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                        onClick={() => navigate(`/item/${itemId}`)}
                    >
                        <div className="row-strip ml-4" style={{ backgroundColor: fs.strip }} />
                        <div className="flex items-center gap-4 flex-1 p-4 pl-3 min-w-0">
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F1F5F9] flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
                                {itemImage
                                    ? <img src={itemImage} alt={itemTitle} className="w-full h-full object-cover" />
                                    : <BoxIcon className="w-6 h-6 text-[#CBD5E1]" />
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-[#001F3F] text-sm truncate group-hover:text-[#00A8E8] transition-colors">{itemTitle}</h4>
                                <p className="text-[11px] text-[#94A3B8] mt-0.5 font-medium">Found report · {formatDate(report.createdAt)}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`inline-flex items-center h-7 px-3 rounded-full text-[11px] font-bold border ${fs.bg} ${fs.text} ${fs.border}`}>{fs.label}</span>
                                <ChevronRight className="w-4 h-4 text-[#E2E8F0] group-hover:text-[#00A8E8] transition-colors" />
                            </div>
                        </div>
                    </div>
                );
            })}

            {completedFinderReports.length > 0 && (
                <div className="px-4 py-3 text-center border-t border-[#F8FAFC]">
                    <button onClick={() => setShowAllFinderReports(p => !p)} className="text-xs font-bold text-[#94A3B8] hover:text-[#00A8E8] transition-colors">
                        {showAllFinderReports ? "Hide resolved finds" : `Show ${completedFinderReports.length} resolved find${completedFinderReports.length > 1 ? "s" : ""}`}
                    </button>
                </div>
            )}
        </div>
    );
};

/* ─── Stat Box ─────────────────────────────────────────────────────────────── */
const StatBox = ({ label, val, color, iconBg, glowColor, icon, bar, barColor }) => (
    <div
        className="stat-card relative bg-white border border-[#F1F5F9] p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 cursor-default overflow-hidden"
        style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)" }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = `0 12px 28px ${glowColor}, 0 2px 8px rgba(0,0,0,0.05)`}
        onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)"}
    >
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>{icon}</div>
        <p className={`text-2xl font-extrabold ${color} mb-0.5 animate-count-up tracking-tight`}>{val}</p>
        <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">{label}</p>
    </div>
);

/* ─── Skeleton ─────────────────────────────────────────────────────────────── */
const DashboardSkeleton = () => (
    <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-28 bg-gray-100 rounded-2xl" />
            <div className="h-28 bg-gray-100 rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
        </div>
        <div className="h-80 bg-gray-100 rounded-2xl" />
    </div>
);

/* ─── Micro-icon components ────────────────────────────────────────────────── */
const PlusIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const ListIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.008v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;
const ChevronRight = ({ className = "w-4 h-4" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
const CheckIcon = ({ className = "w-3.5 h-3.5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const QuestionIcon = ({ className = "w-3.5 h-3.5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>;
const SearchIcon = ({ className = "w-3.5 h-3.5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ClockIcon = ({ className = "w-3.5 h-3.5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PinIcon = ({ className = "w-3 h-3" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>;
const BoxIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>;
const PostsTabIcon = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const ClaimsTabIcon = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>;
const FindsTabIcon = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" /></svg>;

export default Dashboard;