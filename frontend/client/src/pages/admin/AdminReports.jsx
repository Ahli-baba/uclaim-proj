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
    ExternalLink
} from "lucide-react";

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

            // 🔥 FIXED: Fetch recent activity and transform to expected format
            try {
                const response = await api.getRecentActivity();
                console.log("Raw recent activity:", response); // Debug

                // Transform backend data to match frontend expectations
                const transformedActivity = response.map(item => ({
                    _id: item.id,  // Backend uses 'id', frontend expects '_id'
                    type: item.type || 'item_reported',
                    createdAt: item.date,  // Backend uses 'date', frontend expects 'createdAt'
                    status: item.status,
                    user: { name: item.user },  // Backend has string 'user', frontend expects object
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

            // Fetch insights
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

    // 🔥 FIXED: Working navigation function
    const handleActivityClick = (activity) => {
        console.log("Navigating for activity:", activity);

        // Navigate to All Items page with the specific item
        if (activity.item?._id) {
            navigate('/admin/items');
            // You can add logic here to highlight the specific item after navigation
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
                return { icon: <Package className="w-4 h-4" />, bg: 'bg-red-100 text-red-600' };
            case 'item_claimed':
            case 'claimed':
                return { icon: <CheckCircle className="w-4 h-4" />, bg: 'bg-emerald-100 text-emerald-600' };
            case 'user_registered':
                return { icon: <Users className="w-4 h-4" />, bg: 'bg-blue-100 text-blue-600' };
            case 'item_found':
                return { icon: <Package className="w-4 h-4" />, bg: 'bg-green-100 text-green-600' };
            case 'found':
                return { icon: <Package className="w-4 h-4" />, bg: 'bg-emerald-100 text-emerald-600' };
            default:
                return { icon: <FileText className="w-4 h-4" />, bg: 'bg-slate-100 text-slate-600' };
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
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const growthPercent = calculateGrowth();
    const topCategories = getTopCategories();
    const resolutionRate = stats?.overview?.totalItems > 0
        ? Math.round((stats.overview.claimedItems / stats.overview.totalItems) * 100)
        : 0;

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

            <div className="report-container space-y-6">

                <div className="print-header">
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                        UClaim Management System - {getReportTitle()}
                    </h1>
                    <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>
                        Generated on: {new Date().toLocaleString()} | Period: {getDateRangeLabel()}
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 no-print">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            {getReportTitle()} • {getDateRangeLabel()}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer hover:border-indigo-300 transition"
                            >
                                <option value="7">Last 7 Days</option>
                                <option value="30">Last 30 Days</option>
                                <option value="90">Last 3 Months</option>
                                <option value="365">Last Year</option>
                            </select>
                            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        <div className="relative">
                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                className="pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer hover:border-indigo-300 transition"
                            >
                                <option value="overview">Overview</option>
                                <option value="items">Items Report</option>
                                <option value="users">Users Report</option>
                                <option value="claims">Claims Report</option>
                            </select>
                            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleExport('csv')}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
                            >
                                <Download className="w-4 h-4" />
                                CSV
                            </button>
                            <button
                                onClick={() => handleExport('pdf')}
                                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
                            >
                                <Printer className="w-4 h-4" />
                                PDF
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Package className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 no-print">
                                <TrendingUp className="w-3 h-3" /> +12.5%
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{stats?.overview?.totalItems || 0}</p>
                        <p className="text-sm text-slate-500 mt-1">Total Items</p>
                        <p className="text-xs text-slate-400 mt-2">{stats?.overview?.lostItems || 0} lost • {stats?.overview?.foundItems || 0} found</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                            </div>
                            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 no-print">
                                <TrendingUp className="w-3 h-3" /> +8.2%
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{stats?.overview?.claimedItems || 0}</p>
                        <p className="text-sm text-slate-500 mt-1">Items Claimed</p>
                        <p className="text-xs text-slate-400 mt-2">Success rate: {resolutionRate}%</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <Users className="w-5 h-5 text-indigo-600" />
                            </div>
                            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 no-print">
                                <TrendingUp className="w-3 h-3" /> +24%
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{stats?.overview?.totalUsers || 0}</p>
                        <p className="text-sm text-slate-500 mt-1">Active Users</p>
                        <p className="text-xs text-slate-400 mt-2 no-print">+{stats?.overview?.newUsers || 0} new this period</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-amber-50 rounded-lg">
                                <FileText className="w-5 h-5 text-amber-600" />
                            </div>
                            <span className="text-xs font-medium text-red-600 flex items-center gap-1 no-print">
                                <TrendingDown className="w-3 h-3" /> -5%
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{stats?.overview?.pendingItems || 0}</p>
                        <p className="text-sm text-slate-500 mt-1">Pending Claims</p>
                        <p className="text-xs text-slate-400 mt-2 no-print">Requires attention</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-500" />
                                Activity Trends
                            </h3>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <span className="text-slate-600">Lost</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                                    <span className="text-slate-600">Found</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                                    <span className="text-slate-600">Claimed</span>
                                </div>
                            </div>
                        </div>

                        {chartData.length === 0 ? (
                            <div className="h-64 flex items-center justify-center text-slate-400">
                                No data available for this period
                            </div>
                        ) : (
                            <div className="h-64 flex items-end justify-between gap-2">
                                {chartData.map((data, idx) => (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer">
                                        <div className="w-full flex flex-col gap-1 relative">
                                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10 no-print">
                                                Lost: {data.lost}<br />
                                                Found: {data.found}<br />
                                                Claimed: {data.claimed}
                                            </div>
                                            <div
                                                className="w-full bg-blue-400 rounded-t transition-all hover:bg-blue-500"
                                                style={{ height: `${Math.max(data.claimed * 8, 4)}px` }}
                                            ></div>
                                            <div
                                                className="w-full bg-emerald-400 rounded-t transition-all hover:bg-emerald-500"
                                                style={{ height: `${Math.max(data.found * 8, 4)}px` }}
                                            ></div>
                                            <div
                                                className="w-full bg-red-400 rounded-t transition-all hover:bg-red-500"
                                                style={{ height: `${Math.max(data.lost * 8, 4)}px` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs text-slate-400 mt-1">{data.date}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-emerald-500" />
                            Item Distribution
                        </h3>

                        <div className="flex items-center justify-center mb-6">
                            <div className="relative w-40 h-40 rounded-full" style={{
                                background: `conic-gradient(
                                    #ef4444 0deg ${(stats?.overview?.lostItems / stats?.overview?.totalItems) * 360 || 0}deg,
                                    #10b981 ${(stats?.overview?.lostItems / stats?.overview?.totalItems) * 360 || 0}deg ${((stats?.overview?.lostItems + stats?.overview?.foundItems) / stats?.overview?.totalItems) * 360 || 0}deg,
                                    #3b82f6 ${((stats?.overview?.lostItems + stats?.overview?.foundItems) / stats?.overview?.totalItems) * 360 || 0}deg 360deg
                                )`
                            }}>
                                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-slate-900">{stats?.overview?.totalItems || 0}</p>
                                        <p className="text-xs text-slate-500">Total</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <span className="text-sm text-slate-600">Lost Items</span>
                                </div>
                                <span className="font-semibold text-slate-900">{stats?.overview?.lostItems || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                                    <span className="text-sm text-slate-600">Found Items</span>
                                </div>
                                <span className="font-semibold text-slate-900">{stats?.overview?.foundItems || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                                    <span className="text-sm text-slate-600">Claimed</span>
                                </div>
                                <span className="font-semibold text-slate-900">{stats?.overview?.claimedItems || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🔥 FIXED: Recent Activity Log with working navigation */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between no-print">
                        <h3 className="text-lg font-bold text-slate-900">Recent Activity Log</h3>
                        <button
                            onClick={() => navigate('/admin/items')}
                            className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1"
                        >
                            View All <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Activity</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider no-print">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentActivity.length > 0 ? (
                                    recentActivity.map((activity, idx) => {
                                        const { icon, bg } = getActivityIcon(activity.type);

                                        return (
                                            <tr key={activity._id || idx} className="hover:bg-slate-50/50 transition">
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {activity.createdAt
                                                        ? new Date(activity.createdAt).toLocaleDateString()
                                                        : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>
                                                            {icon}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-900">
                                                                {getActivityLabel(activity.type)}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {activity.item?.title || activity.description || 'No details'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {activity.user?.name || 'System'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${activity.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                            activity.status === 'completed' || activity.status === 'approved' || activity.status === 'claimed' ? 'bg-green-100 text-green-700' :
                                                                activity.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                                    'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {activity.status?.charAt(0).toUpperCase() + activity.status?.slice(1) || 'Active'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 no-print">
                                                    {/* 🔥 WORKING: Icon button with onClick */}
                                                    <button
                                                        onClick={() => {
                                                            console.log("Button clicked for:", activity);
                                                            handleActivityClick(activity);
                                                        }}
                                                        className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors cursor-pointer"
                                                        title="View Details"
                                                        type="button"
                                                    >
                                                        <ArrowUpRight className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                            No recent activity found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white no-print">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold mb-2">📊 Weekly Insights</h3>
                            <p className="text-indigo-100 text-sm max-w-xl">
                                Item reporting has
                                <span className={`font-bold text-white ${growthPercent >= 0 ? '' : 'text-red-200'}`}>
                                    {growthPercent >= 0 ? ' increased' : ' decreased'} by {Math.abs(growthPercent)}%
                                </span> this week.
                                The most common lost items are <span className="font-bold text-white">{topCategories}</span>.
                                {stats?.overview?.pendingItems > 0 && ` ${stats.overview.pendingItems} items currently need attention.`}
                            </p>
                        </div>
                        <div className="hidden md:flex items-center gap-4">
                            <div className="text-center px-4 py-2 bg-white/20 rounded-xl backdrop-blur">
                                <p className="text-2xl font-bold">{resolutionRate}%</p>
                                <p className="text-xs text-indigo-100">Resolution Rate</p>
                            </div>
                            <div className="text-center px-4 py-2 bg-white/20 rounded-xl backdrop-blur">
                                <p className="text-2xl font-bold">{stats?.overview?.totalUsers || 0}</p>
                                <p className="text-xs text-indigo-100">Total Users</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="print-header text-center text-sm text-slate-500 pt-4 border-t border-slate-200">
                    <p>© 2026 UClaim Management System - Confidential Report</p>
                </div>
            </div>
        </>
    );
}

export default AdminReports;