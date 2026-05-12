import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import {
    Download, Calendar, ChevronDown, Printer,
    AlertCircle, Package, CheckCircle, FileText,
    MapPin, Tag, TrendingUp, Search
} from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from "recharts";

// ── Theme ───────────────────────────────────────────────────────────────────────
const T = {
    navy: "#1D3557",
    steel: "#468FAF",
    cool: "#F8F9FA",
    white: "#FFFFFF",
    text: "#1D3557",
    textLight: "#6B7280",
    border: "rgba(29,53,87,0.08)",
    surface: "#FFFFFF",
};

const CHART_COLORS = {
    lost: "#EF4444",
    found: "#10B981",
    claim: "#468FAF",
    approved: "#059669",
    rejected: "#DC2626",
    pending: "#F59E0B",
    pickedUp: "#7C3AED",
};

function AdminReports() {
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState("7");
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!token || user.role !== "admin") {
            navigate("/login");
            return;
        }
        fetchAllData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange, navigate]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const statsRes = await api.getAdminStatsByRange(dateRange);
            setStats(statsRes);
        } catch (err) {
            console.error("Failed to fetch report data:", err);
        } finally {
            setLoading(false);
        }
    };

    const getDateRangeLabel = () => {
        const labels = { "7": "Last 7 Days", "30": "Last 30 Days", "90": "Last 3 Months", "365": "Last Year" };
        return labels[dateRange] || "Last 7 Days";
    };

    // ── Derived Metrics ───────────────────────────────────────────────────────────

    // Use range-filtered claim metrics from backend
    // Claim Requests (type: "claim")
    const claimReqPending = stats?.claims?.claimReqPending || 0;
    const claimReqApproved = stats?.claims?.claimReqApproved || 0;
    const claimReqRejected = stats?.claims?.claimReqRejected || 0;
    const claimReqPickedUp = stats?.claims?.claimReqPickedUp || 0;
    const claimReqTotal = stats?.claims?.claimReqTotal || 0;

    const claimReqApprovalRate = stats?.claims?.claimReqApprovalRate || 0;
    const claimReqPickupRate = stats?.claims?.claimReqPickupRate || 0;

    // Finder Reports (type: "finder_report")
    const finderPending = stats?.claims?.finderPending || 0;
    const finderApproved = stats?.claims?.finderApproved || 0;
    const finderRejected = stats?.claims?.finderRejected || 0;
    const finderPickedUp = stats?.claims?.finderPickedUp || 0;
    const finderTotal = stats?.claims?.finderTotal || 0;

    const finderResolutionRate = stats?.claims?.finderResolutionRate || 0;


    // Chart data preparation
    const claimReqStatusData = [
        { name: "Pending", value: claimReqPending, color: CHART_COLORS.pending },
        { name: "Approved", value: claimReqApproved, color: CHART_COLORS.approved },
        { name: "Rejected", value: claimReqRejected, color: CHART_COLORS.rejected },
        { name: "Picked Up", value: claimReqPickedUp, color: CHART_COLORS.pickedUp },
    ].filter(d => d.value > 0);

    const finderStatusData = [
        { name: "Pending", value: finderPending, color: CHART_COLORS.pending },
        { name: "At SAO", value: finderApproved, color: CHART_COLORS.approved },
        { name: "Declined", value: finderRejected, color: CHART_COLORS.rejected },
        { name: "Resolved", value: finderPickedUp, color: CHART_COLORS.pickedUp },
    ].filter(d => d.value > 0);

    const categoryData = stats?.categories?.map(c => ({
        name: c._id || "Uncategorized",
        count: c.count,
    })) || [];

    const chartData = stats?.chartData || [];

    // ── Export ────────────────────────────────────────────────────────────────────

    const exportToCSV = () => {
        if (!stats) return;
        const rows = [
            ["Metric", "Value"],
            ["Period", getDateRangeLabel()],
            ["Total Items (Period)", stats?.overview?.totalItemsInRange || 0],
            ["Lost Items (Period)", stats?.overview?.lostItems || 0],
            ["Found Items (Period)", stats?.overview?.foundItems || 0],
            ["Items Currently at SAO", stats?.overview?.itemsAtSAO || 0],
            ["Total Users", stats?.overview?.totalUsers || 0],
            ["New Users (Period)", stats?.overview?.newUsers || 0],
            ["Pending Claim Requests", claimReqPending],
            ["Approved Claim Requests", claimReqApproved],
            ["Rejected Claim Requests", claimReqRejected],
            ["Picked Up Claim Requests", claimReqPickedUp],
            ["Claim Approval Rate", `${claimReqApprovalRate}%`],
            ["Claim Pickup Rate", `${claimReqPickupRate}%`],
            ["Pending Finder Reports", finderPending],
            ["At SAO Finder Reports", finderApproved],
            ["Declined Finder Reports", finderRejected],
            ["Resolved Finder Reports", finderPickedUp],
            ["Finder Resolution Rate", `${finderResolutionRate}%`],
        ];
        const csv = rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `uclaim_report_${dateRange}d_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
    };

    const exportToPDF = () => {
        document.body.classList.add("printing-report");
        setTimeout(() => {
            window.print();
            setTimeout(() => document.body.classList.remove("printing-report"), 1000);
        }, 100);
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="h-8 w-64 rounded animate-pulse" style={{ backgroundColor: "rgba(29,53,87,0.08)" }} />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-28 rounded-2xl border animate-pulse" style={{ backgroundColor: T.white, borderColor: T.border }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .report-container, .report-container * { visibility: visible; }
                    .report-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; }
                    .no-print { display: none !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
                @media screen { .print-header { display: none; } }
            `}</style>

            <div className="report-container max-w-7xl mx-auto space-y-8">

                <div className="print-header">
                    <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 10px 0", color: T.navy }}>
                        UClaim Management System — Operations Report
                    </h1>
                    <p style={{ fontSize: "14px", color: T.textLight, margin: "0" }}>
                        Generated: {new Date().toLocaleString()} | Period: {getDateRangeLabel()}
                    </p>
                </div>

                {/* ═══ HEADER ═══════════════════════════════════════════════════════════ */}
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-6 no-print" style={{ borderBottom: `1px solid ${T.border}` }}>
                    <div className="space-y-1">
                        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight" style={{ color: T.navy }}>
                            Reports & Analytics
                        </h1>
                        <p className="text-sm" style={{ color: T.textLight }}>
                            Operations overview · {getDateRangeLabel()}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="pl-9 pr-8 py-2.5 rounded-xl text-sm font-semibold focus:outline-none appearance-none cursor-pointer"
                                style={{ backgroundColor: T.white, border: `1px solid ${T.border}`, color: T.navy }}
                            >
                                <option value="7">Last 7 Days</option>
                                <option value="30">Last 30 Days</option>
                                <option value="90">Last 3 Months</option>
                                <option value="365">Last Year</option>
                            </select>
                            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textLight }} />
                            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: T.textLight }} />
                        </div>

                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                            style={{ backgroundColor: T.white, border: `1px solid ${T.border}`, color: T.navy }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = T.cool}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = T.white}
                        >
                            <Download className="w-4 h-4" />
                            CSV
                        </button>
                        <button
                            onClick={exportToPDF}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                            style={{ backgroundColor: T.navy }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#152a45"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = T.navy}
                        >
                            <Printer className="w-4 h-4" />
                            PDF
                        </button>
                    </div>
                </div>
                {/* ═══ INSIGHT BANNER ═════════════════════════════════════════════════ */}
                <div className="rounded-2xl p-6 text-white no-print" style={{
                    background: `linear-gradient(135deg, ${T.navy} 0%, ${T.steel} 100%)`,
                    boxShadow: "0 10px 40px -10px rgba(29,53,87,0.3)"
                }}>
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" style={{ opacity: 0.8 }} />
                                <h3 className="text-sm font-bold tracking-wide">Operational Insights</h3>
                            </div>
                            <p className="text-[13px] max-w-xl" style={{ color: "rgba(255,255,255,0.75)" }}>
                                {claimReqPending > 0 ? (
                                    <span><span className="font-bold text-white">{claimReqPending} claim request{claimReqPending > 1 ? "s" : ""}</span> pending review. </span>
                                ) : (
                                    <span>No pending claim requests. </span>
                                )}
                                {finderPending > 0 && (
                                    <span><span className="font-bold text-white">{finderPending} finder report{finderPending > 1 ? "s" : ""}</span> awaiting SAO confirmation. </span>
                                )}
                                {stats?.overview?.newUsers > 0 && (
                                    <span><span className="font-bold text-white">{stats.overview.newUsers} new user{stats.overview.newUsers > 1 ? "s" : ""}</span> joined this period. </span>
                                )}
                                {claimReqPickupRate > 0 && (
                                    <span><span className="font-bold text-white">{claimReqPickupRate}%</span> claim pickup rate. </span>
                                )}
                                {finderResolutionRate > 0 && (
                                    <span><span className="font-bold text-white">{finderResolutionRate}%</span> finder resolution rate.</span>
                                )}
                            </p>
                        </div>
                        <div className="hidden md:flex items-center gap-4">
                            <div className="text-center px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                                <p className="text-2xl font-bold">{claimReqApprovalRate}%</p>
                                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.7)" }}>Claim Approval</p>
                            </div>
                            <div className="text-center px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                                <p className="text-2xl font-bold">{finderResolutionRate}%</p>
                                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.7)" }}>Finder Resolution</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ CHARTS GRID ═══════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Activity Trends — Line Chart */}
                    <div className="lg:col-span-6 rounded-2xl p-6 space-y-5 bg-white border" style={{ borderColor: T.border, boxShadow: "0 1px 3px rgba(29,53,87,0.04)" }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <TrendingUp className="w-4 h-4" style={{ color: T.steel }} />
                                <h3 className="text-sm font-bold tracking-wide" style={{ color: T.navy }}>Item Reporting Trends</h3>
                            </div>
                            <div className="flex items-center gap-4 text-[11px]">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.lost }} />
                                    <span style={{ color: T.textLight }}>Lost</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.found }} />
                                    <span style={{ color: T.textLight }}>Found</span>
                                </div>
                            </div>
                        </div>

                        {chartData.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center space-y-2">
                                <AlertCircle className="w-8 h-8" style={{ color: "rgba(29,53,87,0.15)" }} />
                                <p className="text-sm" style={{ color: T.textLight }}>No data for this period</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorLost" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={CHART_COLORS.lost} stopOpacity={0.1} />
                                            <stop offset="95%" stopColor={CHART_COLORS.lost} stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorFound" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={CHART_COLORS.found} stopOpacity={0.1} />
                                            <stop offset="95%" stopColor={CHART_COLORS.found} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(29,53,87,0.06)" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: T.textLight }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: T.textLight }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: "12px", border: `1px solid ${T.border}`, fontSize: "12px" }}
                                        itemStyle={{ fontSize: "12px", fontWeight: 600 }}
                                    />
                                    <Area type="monotone" dataKey="lost" stroke={CHART_COLORS.lost} fillOpacity={1} fill="url(#colorLost)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="found" stroke={CHART_COLORS.found} fillOpacity={1} fill="url(#colorFound)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>


                    {/* Claim Requests Status — Donut Chart */}
                    <div className="lg:col-span-3 rounded-2xl p-6 space-y-5 bg-white border" style={{ borderColor: T.border, boxShadow: "0 1px 3px rgba(29,53,87,0.04)" }}>
                        <div className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4" style={{ color: T.steel }} />
                            <h3 className="text-sm font-bold tracking-wide" style={{ color: T.navy }}>Claim Requests</h3>
                        </div>

                        {claimReqTotal === 0 ? (
                            <div className="h-48 flex flex-col items-center justify-center space-y-2">
                                <AlertCircle className="w-8 h-8" style={{ color: "rgba(29,53,87,0.15)" }} />
                                <p className="text-sm" style={{ color: T.textLight }}>No claim requests in this period</p>
                            </div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie
                                            data={claimReqStatusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {claimReqStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: "12px", border: `1px solid ${T.border}`, fontSize: "12px" }}
                                            itemStyle={{ fontSize: "12px", fontWeight: 600 }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>

                                <div className="space-y-2">
                                    {claimReqStatusData.map((item) => (
                                        <div key={item.name} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: `${item.color}10` }}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                                <span className="text-xs font-medium" style={{ color: T.textLight }}>{item.name}</span>
                                            </div>
                                            <span className="text-sm font-bold" style={{ color: T.navy }}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    {/* Finder Reports Status — Donut Chart */}
                    <div className="lg:col-span-3 rounded-2xl p-6 space-y-5 bg-white border" style={{ borderColor: T.border, boxShadow: "0 1px 3px rgba(29,53,87,0.04)" }}>
                        <div className="flex items-center gap-2.5">
                            <Search className="w-4 h-4" style={{ color: T.steel }} />
                            <h3 className="text-sm font-bold tracking-wide" style={{ color: T.navy }}>Finder Reports</h3>
                        </div>

                        {finderTotal === 0 ? (
                            <div className="h-48 flex flex-col items-center justify-center space-y-2">
                                <AlertCircle className="w-8 h-8" style={{ color: "rgba(29,53,87,0.15)" }} />
                                <p className="text-sm" style={{ color: T.textLight }}>No finder reports in this period</p>
                            </div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie
                                            data={finderStatusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {finderStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: "12px", border: `1px solid ${T.border}`, fontSize: "12px" }}
                                            itemStyle={{ fontSize: "12px", fontWeight: 600 }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>

                                <div className="space-y-2">
                                    {finderStatusData.map((item) => (
                                        <div key={item.name} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: `${item.color}10` }}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                                <span className="text-xs font-medium" style={{ color: T.textLight }}>{item.name}</span>
                                            </div>
                                            <span className="text-sm font-bold" style={{ color: T.navy }}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ═══ BOTTOM ROW ═════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Category Breakdown */}
                    <div className="rounded-2xl p-6 space-y-5 bg-white border" style={{ borderColor: T.border, boxShadow: "0 1px 3px rgba(29,53,87,0.04)" }}>
                        <div className="flex items-center gap-2.5">
                            <Tag className="w-4 h-4" style={{ color: T.steel }} />
                            <h3 className="text-sm font-bold tracking-wide" style={{ color: T.navy }}>Top Categories</h3>
                        </div>

                        {categoryData.length === 0 ? (
                            <div className="h-48 flex flex-col items-center justify-center space-y-2">
                                <AlertCircle className="w-8 h-8" style={{ color: "rgba(29,53,87,0.15)" }} />
                                <p className="text-sm" style={{ color: T.textLight }}>No category data</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={categoryData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(29,53,87,0.06)" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: T.textLight }} axisLine={false} tickLine={false} />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: T.textLight }} axisLine={false} tickLine={false} width={100} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: "12px", border: `1px solid ${T.border}`, fontSize: "12px" }}
                                        itemStyle={{ fontSize: "12px", fontWeight: 600 }}
                                    />
                                    <Bar dataKey="count" fill={T.steel} radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Quick Stats Summary */}
                    <div className="rounded-2xl p-6 space-y-5 bg-white border" style={{ borderColor: T.border, boxShadow: "0 1px 3px rgba(29,53,87,0.04)" }}>
                        <div className="flex items-center gap-2.5">
                            <Package className="w-4 h-4" style={{ color: T.steel }} />
                            <h3 className="text-sm font-bold tracking-wide" style={{ color: T.navy }}>Item Overview</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "rgba(239,68,68,0.06)" }}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg" style={{ backgroundColor: "rgba(239,68,68,0.1)" }}>
                                        <AlertCircle className="w-4 h-4" style={{ color: CHART_COLORS.lost }} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: T.navy }}>{stats?.overview?.lostItems || 0}</p>
                                        <p className="text-[11px]" style={{ color: T.textLight }}>Lost items reported</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "rgba(16,185,129,0.06)" }}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg" style={{ backgroundColor: "rgba(16,185,129,0.1)" }}>
                                        <CheckCircle className="w-4 h-4" style={{ color: CHART_COLORS.found }} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: T.navy }}>{stats?.overview?.foundItems || 0}</p>
                                        <p className="text-[11px]" style={{ color: T.textLight }}>Found items reported</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "rgba(70,143,175,0.06)" }}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg" style={{ backgroundColor: "rgba(70,143,175,0.1)" }}>
                                        <MapPin className="w-4 h-4" style={{ color: T.steel }} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: T.navy }}>{stats?.overview?.itemsAtSAO || 0}</p>
                                        <p className="text-[11px]" style={{ color: T.textLight }}>Items currently at SAO</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 border-t" style={{ borderColor: T.border }}>
                                <div className="flex items-center justify-between text-xs">
                                    <span style={{ color: T.textLight }}>Claim-to-item ratio</span>
                                    <span className="font-bold" style={{ color: T.navy }}>
                                        {stats?.overview?.totalItemsInRange > 0 ? Math.round((claimReqTotal / stats.overview.totalItemsInRange) * 100) : 0}%
                                    </span>
                                </div>
                            </div>
                            <div className="pt-3 border-t" style={{ borderColor: T.border }}>
                                <div className="flex items-center justify-between text-xs">
                                    <span style={{ color: T.textLight }}>Finder-to-lost ratio</span>
                                    <span className="font-bold" style={{ color: T.navy }}>
                                        {stats?.overview?.lostItems > 0 ? Math.round((finderTotal / stats.overview.lostItems) * 100) : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="print-header text-center text-[13px] pt-4" style={{ color: T.textLight, borderTop: `1px solid ${T.border}` }}>
                    <p>© 2026 UClaim Management System — Confidential Report</p>
                </div>
            </div>
        </>
    );
}

export default AdminReports;