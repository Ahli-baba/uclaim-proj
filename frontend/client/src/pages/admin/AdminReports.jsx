import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import {
    Download,
    Calendar,
    TrendingUp,
    TrendingDown,
    PieChart,
    BarChart3,
    Users,
    Package,
    CheckCircle,
    FileText,
    ArrowRight,
    Filter,
    ChevronDown,
    Printer,
    ArrowUpRight,
    ExternalLink,
    AlertCircle,
    Layers,
    Activity
} from "lucide-react";

// ── Theme: Steel Blue / Navy Slate / Cool Gray ────────────────────────────────
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

function AdminReports() {
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState("7");
    const [reportType, setReportType] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [insights, setInsights] = useState(null);

    useEffect(() => {
        fetchReportData();
    }, [dateRange, reportType]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const data = await api.getAdminStatsByRange(dateRange);
            setStats(data);

            if (data.chartData && Array.isArray(data.chartData)) {
                setChartData(data.chartData);
            } else {
                setChartData([]);
            }

            try {
                const response = await api.getRecentActivity();
                console.log("Raw recent activity:", response);

                const transformedActivity = response.map(item => ({
                    _id: item.id,
                    type: item.type || 'item_reported',
                    createdAt: item.date,
                    status: item.status,
                    user: { name: item.user },
                    item: {
                        _id: item.id,
                        title: item.title,
                        location: item.location
                    },
                    description: `${item.type} item: ${item.title}`
                }));

                setRecentActivity(transformedActivity);
            } catch (err) {
                console.warn("Could not fetch recent activity:", err);
                setRecentActivity([]);
            }

            try {
                const reportsData = await api.getReports('daily');
                setInsights(reportsData);
            } catch (err) {
                console.warn("Could not fetch insights:", err);
                setInsights(null);
            }

        } catch (err) {
            console.error("Failed to fetch report data:", err);
            alert("Failed to load report data: " + (err.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        if (!stats) return;

        const headers = ["Date", "Lost", "Found", "Claimed"];
        const rows = chartData.map(day => [day.date, day.lost, day.found, day.claimed]);

        const csvContent = [
            `Report: ${getReportTitle()}`,
            `Period: ${getDateRangeLabel()}`,
            `Generated: ${new Date().toLocaleString()}`,
            "",
            headers.join(","),
            ...rows.map(row => row.join(",")),
            "",
            "Summary",
            `Total Items,${stats?.overview?.totalItems || 0}`,
            `Lost Items,${stats?.overview?.lostItems || 0}`,
            `Found Items,${stats?.overview?.foundItems || 0}`,
            `Claimed Items,${stats?.overview?.claimedItems || 0}`,
            `Total Users,${stats?.overview?.totalUsers || 0}`
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `report_${dateRange}days_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        document.body.classList.add('printing-report');
        setTimeout(() => {
            window.print();
            setTimeout(() => {
                document.body.classList.remove('printing-report');
            }, 1000);
        }, 100);
    };

    const handleExport = (format) => {
        if (format === 'csv') {
            exportToCSV();
        } else if (format === 'pdf') {
            exportToPDF();
        }
    };

    const handleActivityClick = (activity) => {
        console.log("Navigating for activity:", activity);
        if (activity.item?._id) {
            navigate('/admin/items');
        } else {
            navigate('/admin/items');
        }
    };

    const getReportTitle = () => {
        const titles = {
            overview: "Platform Overview Report",
            items: "Item Activity Report",
            users: "User Growth Report",
            claims: "Claims Processing Report"
        };
        return titles[reportType] || "Report";
    };

    const getDateRangeLabel = () => {
        const labels = {
            "7": "Last 7 Days",
            "30": "Last 30 Days",
            "90": "Last 3 Months",
            "365": "Last Year"
        };
        return labels[dateRange] || "Last 7 Days";
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'item_reported':
            case 'lost':
                return { icon: <Package className="w-4 h-4" style={{ color: "#B91C1C" }} />, bg: "rgba(239,68,68,0.08)" };
            case 'item_claimed':
            case 'claimed':
                return { icon: <CheckCircle className="w-4 h-4" style={{ color: "#047857" }} />, bg: "rgba(16,185,129,0.08)" };
            case 'user_registered':
                return { icon: <Users className="w-4 h-4" style={{ color: T.steel }} />, bg: "rgba(70,143,175,0.08)" };
            case 'item_found':
            case 'found':
                return { icon: <Package className="w-4 h-4" style={{ color: "#047857" }} />, bg: "rgba(16,185,129,0.08)" };
            default:
                return { icon: <FileText className="w-4 h-4" style={{ color: T.textLight }} />, bg: "rgba(29,53,87,0.06)" };
        }
    };

    const getActivityLabel = (type) => {
        const labels = {
            'item_reported': 'Item Reported',
            'lost': 'Lost Item',
            'found': 'Found Item',
            'item_claimed': 'Item Claimed',
            'user_registered': 'New User',
            'item_found': 'Item Found',
            'claim_approved': 'Claim Approved',
            'claim_rejected': 'Claim Rejected'
        };
        return labels[type] || 'Activity';
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending': return { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" };
            case 'completed':
            case 'approved':
            case 'claimed': return { bg: "#D1FAE5", text: "#065F46", border: "#A7F3D0" };
            case 'rejected': return { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" };
            default: return { bg: "rgba(70,143,175,0.08)", text: T.steel, border: "rgba(70,143,175,0.15)" };
        }
    };

    const getTopCategories = () => {
        if (insights?.categories && insights.categories.length > 0) {
            const sorted = [...insights.categories].sort((a, b) => b.count - a.count);
            const topTwo = sorted.slice(0, 2).map(c => c._id || 'Unknown');
            return topTwo.join(' and ') || 'Various Items';
        }
        return 'Various Items';
    };

    const calculateGrowth = () => {
        if (chartData.length >= 2) {
            const firstWeek = chartData.slice(0, Math.floor(chartData.length / 2)).reduce((a, b) => a + b.lost + b.found, 0);
            const secondWeek = chartData.slice(Math.floor(chartData.length / 2)).reduce((a, b) => a + b.lost + b.found, 0);
            if (firstWeek > 0) {
                return Math.round(((secondWeek - firstWeek) / firstWeek) * 100);
            }
        }
        return 0;
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="h-8 w-64 rounded animate-pulse" style={{ backgroundColor: "rgba(29,53,87,0.08)" }} />
                <div className="h-24 rounded-2xl border animate-pulse" style={{ backgroundColor: T.white, borderColor: T.border }} />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-28 rounded-2xl border animate-pulse" style={{ backgroundColor: T.white, borderColor: T.border }} />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-80 rounded-2xl border animate-pulse" style={{ backgroundColor: T.white, borderColor: T.border }} />
                    <div className="h-80 rounded-2xl border animate-pulse" style={{ backgroundColor: T.white, borderColor: T.border }} />
                </div>
            </div>
        );
    }

    const growthPercent = calculateGrowth();
    const topCategories = getTopCategories();
    const resolutionRate = stats?.overview?.totalItems > 0
        ? Math.round((stats.overview.claimedItems / stats.overview.totalItems) * 100)
        : 0;

    const overview = stats?.overview || {};

    const statCards = [
        {
            label: "Total Items",
            value: overview.totalItems || 0,
            sublabel: `${overview.lostItems || 0} lost · ${overview.foundItems || 0} found`,
            icon: Package,
            iconColor: T.navy,
            iconBg: "rgba(29,53,87,0.08)"
        },
        {
            label: "Items Claimed",
            value: overview.claimedItems || 0,
            sublabel: `Success rate: ${resolutionRate}%`,
            icon: CheckCircle,
            iconColor: "#047857",
            iconBg: "rgba(16,185,129,0.08)"
        },
        {
            label: "Active Users",
            value: overview.totalUsers || 0,
            sublabel: `+${overview.newUsers || 0} new this period`,
            icon: Users,
            iconColor: T.steel,
            iconBg: "rgba(70,143,175,0.08)"
        },
        {
            label: "Pending Claims",
            value: overview.pendingItems || 0,
            sublabel: "Requires attention",
            icon: FileText,
            iconColor: "#92400E",
            iconBg: "rgba(245,158,11,0.08)"
        }
    ];

    return (
        <>
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .report-container, .report-container * { visibility: visible; }
                    .report-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 20px;
                    }
                    .no-print { display: none !important; }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
                @media screen {
                    .print-header { display: none; }
                }
            `}</style>

            <div className="report-container max-w-7xl mx-auto space-y-8">

                <div className="print-header">
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0', color: T.navy }}>
                        UClaim Management System - {getReportTitle()}
                    </h1>
                    <p style={{ fontSize: '14px', color: T.textLight, margin: '0' }}>
                        Generated on: {new Date().toLocaleString()} | Period: {getDateRangeLabel()}
                    </p>
                </div>

                {/* ═══ HEADER ═══════════════════════════════════════════════════════════ */}
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-6 no-print" style={{ borderBottom: `1px solid ${T.border}` }}>
                    <div className="space-y-1">
                        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight" style={{ color: T.navy }}>
                            Reports & Analytics
                        </h1>
                        <p className="text-sm" style={{ color: T.textLight }}>
                            {getReportTitle()} · {getDateRangeLabel()}
                        </p>
                    </div>

                    {/* CSV / PDF Export Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleExport('csv')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
                            style={{
                                backgroundColor: T.white,
                                border: `1px solid ${T.border}`,
                                color: T.navy,
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = T.cool}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = T.white}
                        >
                            <Download className="w-4 h-4" />
                            CSV
                        </button>
                        <button
                            onClick={() => handleExport('pdf')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                            style={{ backgroundColor: T.navy }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#152a45"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = T.navy}
                        >
                            <Printer className="w-4 h-4" />
                            PDF
                        </button>
                    </div>
                </div>

                {/* ═══ WEEKLY INSIGHTS ══════════════════════════════════════════════════ */}
                <div className="rounded-2xl p-6 text-white no-print"
                    style={{
                        background: `linear-gradient(135deg, ${T.navy} 0%, ${T.steel} 100%)`,
                        boxShadow: "0 10px 40px -10px rgba(29,53,87,0.3)"
                    }}>
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4" style={{ opacity: 0.8 }} />
                                <h3 className="text-sm font-bold tracking-wide">Weekly Insights</h3>
                            </div>
                            <p className="text-[13px] max-w-xl" style={{ color: "rgba(255,255,255,0.75)" }}>
                                Item reporting has
                                <span className="font-bold text-white" style={{ color: growthPercent >= 0 ? T.white : "#FECACA" }}>
                                    {growthPercent >= 0 ? ' increased' : ' decreased'} by {Math.abs(growthPercent)}%
                                </span> this week.
                                The most common lost items are <span className="font-bold text-white">{topCategories}</span>.
                                {stats?.overview?.pendingItems > 0 && ` ${stats.overview.pendingItems} items currently need attention.`}
                            </p>
                        </div>
                        <div className="hidden md:flex items-center gap-4">
                            <div className="text-center px-4 py-3 rounded-xl"
                                style={{ backgroundColor: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
                                <p className="text-2xl font-bold">{resolutionRate}%</p>
                                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.7)" }}>Resolution Rate</p>
                            </div>
                            <div className="text-center px-4 py-3 rounded-xl"
                                style={{ backgroundColor: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
                                <p className="text-2xl font-bold">{stats?.overview?.totalUsers || 0}</p>
                                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.7)" }}>Total Users</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ DATE & TYPE FILTERS ════════════════════════════════════════════ */}
                <div className="flex flex-wrap items-center gap-3 no-print">
                    <div className="relative">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="pl-9 pr-8 py-2.5 rounded-xl text-sm font-semibold focus:outline-none appearance-none cursor-pointer transition-all duration-200"
                            style={{
                                backgroundColor: T.white,
                                border: `1px solid ${T.border}`,
                                color: T.navy,
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = T.steel}
                            onBlur={(e) => e.currentTarget.style.borderColor = T.border}
                        >
                            <option value="7">Last 7 Days</option>
                            <option value="30">Last 30 Days</option>
                            <option value="90">Last 3 Months</option>
                            <option value="365">Last Year</option>
                        </select>
                        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textLight }} />
                        <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: T.textLight }} />
                    </div>

                    <div className="relative">
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="pl-9 pr-8 py-2.5 rounded-xl text-sm font-semibold focus:outline-none appearance-none cursor-pointer transition-all duration-200"
                            style={{
                                backgroundColor: T.white,
                                border: `1px solid ${T.border}`,
                                color: T.navy,
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = T.steel}
                            onBlur={(e) => e.currentTarget.style.borderColor = T.border}
                        >
                            <option value="overview">Overview</option>
                            <option value="items">Items Report</option>
                            <option value="users">Users Report</option>
                            <option value="claims">Claims Report</option>
                        </select>
                        <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textLight }} />
                        <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: T.textLight }} />
                    </div>
                </div>

                {/* ═══ STAT CARDS ═══════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat, idx) => {
                        const Icon = stat.icon;
                        return (
                            <div key={idx}
                                className="group relative p-5 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 bg-white border hover:shadow-lg"
                                style={{ borderColor: T.border, boxShadow: "0 1px 3px rgba(29,53,87,0.04)" }}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="p-2 rounded-lg" style={{ backgroundColor: stat.iconBg }}>
                                        <Icon className="w-5 h-5" style={{ color: stat.iconColor }} />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold tracking-tight" style={{ color: T.navy }}>{stat.value}</p>
                                <p className="text-xs font-medium mt-1" style={{ color: T.textLight }}>{stat.label}</p>
                                <p className="text-[11px] mt-2" style={{ color: "rgba(107,114,128,0.7)" }}>{stat.sublabel}</p>
                            </div>
                        );
                    })}
                </div>

                {/* ═══ CHARTS GRID ══════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Activity Trends — spans 8 cols */}
                    <div className="lg:col-span-8 rounded-2xl p-6 space-y-5 bg-white border"
                        style={{ borderColor: T.border, boxShadow: "0 1px 3px rgba(29,53,87,0.04)" }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <BarChart3 className="w-4 h-4" style={{ color: T.steel }} />
                                <h3 className="text-sm font-bold tracking-wide" style={{ color: T.navy }}>Activity Trends</h3>
                            </div>
                            <div className="flex items-center gap-4 text-[11px]">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#EF4444" }}></div>
                                    <span style={{ color: T.textLight }}>Lost</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#10B981" }}></div>
                                    <span style={{ color: T.textLight }}>Found</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: T.steel }}></div>
                                    <span style={{ color: T.textLight }}>Claimed</span>
                                </div>
                            </div>
                        </div>

                        {chartData.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center space-y-2">
                                <AlertCircle className="w-8 h-8" style={{ color: "rgba(29,53,87,0.15)" }} />
                                <p className="text-sm" style={{ color: T.textLight }}>No data available for this period</p>
                            </div>
                        ) : (
                            <div className="h-64 flex items-end justify-between gap-2">
                                {chartData.map((data, idx) => (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer">
                                        <div className="w-full flex flex-col gap-1 relative">
                                            <div className="absolute -top-20 left-1/2 -translate-x-1/2 px-2 py-1.5 rounded-lg text-[10px] font-medium opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10 no-print"
                                                style={{ backgroundColor: T.navy, color: T.white }}>
                                                Lost: {data.lost}<br />
                                                Found: {data.found}<br />
                                                Claimed: {data.claimed}
                                            </div>
                                            <div
                                                className="w-full rounded-t transition-all duration-200"
                                                style={{
                                                    height: `${Math.max(data.claimed * 8, 4)}px`,
                                                    backgroundColor: T.steel,
                                                    opacity: 0.9
                                                }}
                                            ></div>
                                            <div
                                                className="w-full rounded-t transition-all duration-200"
                                                style={{
                                                    height: `${Math.max(data.found * 8, 4)}px`,
                                                    backgroundColor: "#10B981",
                                                    opacity: 0.85
                                                }}
                                            ></div>
                                            <div
                                                className="w-full rounded-t transition-all duration-200"
                                                style={{
                                                    height: `${Math.max(data.lost * 8, 4)}px`,
                                                    backgroundColor: "#EF4444",
                                                    opacity: 0.8
                                                }}
                                            ></div>
                                        </div>
                                        <span className="text-[10px] font-medium mt-1" style={{ color: T.textLight }}>{data.date}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Item Distribution — spans 4 cols */}
                    <div className="lg:col-span-4 rounded-2xl p-6 space-y-5 bg-white border"
                        style={{ borderColor: T.border, boxShadow: "0 1px 3px rgba(29,53,87,0.04)" }}>
                        <div className="flex items-center gap-2.5">
                            <PieChart className="w-4 h-4" style={{ color: T.steel }} />
                            <h3 className="text-sm font-bold tracking-wide" style={{ color: T.navy }}>Item Distribution</h3>
                        </div>

                        <div className="flex items-center justify-center py-2">
                            <div className="relative w-36 h-36 rounded-full" style={{
                                background: `conic-gradient(
                                    #EF4444 0deg ${(stats?.overview?.lostItems / stats?.overview?.totalItems) * 360 || 0}deg,
                                    #10B981 ${(stats?.overview?.lostItems / stats?.overview?.totalItems) * 360 || 0}deg ${((stats?.overview?.lostItems + stats?.overview?.foundItems) / stats?.overview?.totalItems) * 360 || 0}deg,
                                    ${T.steel} ${((stats?.overview?.lostItems + stats?.overview?.foundItems) / stats?.overview?.totalItems) * 360 || 0}deg 360deg
                                )`
                            }}>
                                <div className="absolute inset-4 rounded-full flex items-center justify-center" style={{ backgroundColor: T.white }}>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold" style={{ color: T.navy }}>{stats?.overview?.totalItems || 0}</p>
                                        <p className="text-[11px] font-medium" style={{ color: T.textLight }}>Total</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-2.5 rounded-xl"
                                style={{ backgroundColor: "rgba(239,68,68,0.06)" }}>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#EF4444" }}></div>
                                    <span className="text-[13px] font-medium" style={{ color: T.textLight }}>Lost Items</span>
                                </div>
                                <span className="text-sm font-bold" style={{ color: T.navy }}>{stats?.overview?.lostItems || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-xl"
                                style={{ backgroundColor: "rgba(16,185,129,0.06)" }}>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#10B981" }}></div>
                                    <span className="text-[13px] font-medium" style={{ color: T.textLight }}>Found Items</span>
                                </div>
                                <span className="text-sm font-bold" style={{ color: T.navy }}>{stats?.overview?.foundItems || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-xl"
                                style={{ backgroundColor: "rgba(70,143,175,0.06)" }}>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: T.steel }}></div>
                                    <span className="text-[13px] font-medium" style={{ color: T.textLight }}>Claimed</span>
                                </div>
                                <span className="text-sm font-bold" style={{ color: T.navy }}>{stats?.overview?.claimedItems || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="print-header text-center text-[13px] pt-4" style={{ color: T.textLight, borderTop: `1px solid ${T.border}` }}>
                    <p>© 2026 UClaim Management System - Confidential Report</p>
                </div>
            </div>
        </>
    );
}

export default AdminReports;