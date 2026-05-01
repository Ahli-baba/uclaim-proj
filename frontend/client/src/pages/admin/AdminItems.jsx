import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Search, Trash2, Eye, CheckCircle, XCircle, Clock, X, MapPin, Calendar, User, Mail, Tag, FileText } from "lucide-react";

function AdminItems() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ status: "", type: "", search: "" });
    const [selectedItem, setSelectedItem] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchItems();
    }, [filter]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await api.getAllItemsAdmin(filter);
            setItems(data);
        } catch (err) {
            console.error("Failed to fetch items:", err);
            alert("Failed to fetch items from backend");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        try {
            await api.deleteItemAdmin(id);
            fetchItems();
        } catch (err) {
            alert("Failed to delete item: " + (err.message || "Unknown error"));
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            await api.updateItemStatusAdmin(id, status);
            fetchItems();
        } catch (err) {
            alert("Failed to update status: " + (err.message || "Unknown error"));
        }
    };

    const handleViewItem = (item) => {
        setSelectedItem(item);
        setShowModal(true);
    };

    const handleSAOToggle = async (item) => {
        try {
            await api.updateItemSAOStatus(item._id, !item.isAtSAO);
            fetchItems();
            if (selectedItem?._id === item._id) {
                setSelectedItem(prev => ({ ...prev, isAtSAO: !prev.isAtSAO }));
            }
        } catch (err) {
            alert("Failed to update SAO status: " + (err.message || "Unknown error"));
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedItem(null);
    };

    const getStatusColor = (status) => {
        const colors = {
            active: "bg-yellow-100 text-yellow-700",
            claimed: "bg-emerald-100 text-emerald-700",
            resolved: "bg-blue-100 text-blue-700"
        };
        return colors[status] || "bg-slate-100 text-slate-700";
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "active": return <Clock className="w-3 h-3" />;
            case "claimed": return <CheckCircle className="w-3 h-3" />;
            case "resolved": return <CheckCircle className="w-3 h-3" />;
            default: return null;
        }
    };

    const getTypeColor = (type) => {
        return type === "lost"
            ? "bg-red-100 text-red-700 border-red-200"
            : "bg-emerald-100 text-emerald-700 border-emerald-200";
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">All Items</h1>
                    <p className="text-slate-500 mt-1">Manage lost and found items across the platform</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4">
                <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={filter.search}
                        onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <select
                    value={filter.type}
                    onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All Types</option>
                    <option value="lost">Lost</option>
                    <option value="found">Found</option>
                </select>
                <select
                    value={filter.status}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="claimed">Claimed</option>
                    <option value="resolved">Resolved</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-500">Loading items...</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Item</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Type</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Reported By</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Date</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">SAO Status</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {items.map((item) => (
                                <tr key={item._id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center text-2xl overflow-hidden">
                                                {item.images?.[0] ? (
                                                    <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    "📦"
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">{item.title}</p>
                                                <p className="text-sm text-slate-500">{item.category}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize border ${getTypeColor(item.type)}`}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={item.status}
                                            onChange={(e) => handleStatusChange(item._id, e.target.value)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer flex items-center gap-1 ${getStatusColor(item.status)}`}
                                        >
                                            <option value="active">Active</option>
                                            <option value="claimed">Claimed</option>
                                            <option value="resolved">Resolved</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-slate-900">{item.reportedBy?.name || 'Unknown'}</p>
                                            <p className="text-sm text-slate-500">{item.reportedBy?.email || 'No email'}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.type === "found" ? (
                                            item.status === "resolved" ? (
                                                <span className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-purple-100 text-purple-700 border-purple-200">
                                                    ✓ Picked Up
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleSAOToggle(item)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${item.isAtSAO
                                                        ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200"
                                                        : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                                                        }`}
                                                >
                                                    {item.isAtSAO ? "✓ At SAO" : "Not at SAO"}
                                                </button>
                                            )
                                        ) : (
                                            <span className="text-xs text-slate-300">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleViewItem(item)}
                                                className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item._id)}
                                                className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                                                title="Delete Item"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!loading && items.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        <div className="text-4xl mb-2">📭</div>
                        <p>No items found matching your criteria</p>
                    </div>
                )}
            </div>

            {/* Item Detail Modal */}
            {showModal && selectedItem && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize border ${getTypeColor(selectedItem.type)}`}>
                                    {selectedItem.type}
                                </span>
                                <h2 className="text-xl font-bold text-slate-900">{selectedItem.title}</h2>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Image */}
                            {selectedItem.images?.[0] && (
                                <div className="w-full h-64 bg-slate-100 rounded-xl overflow-hidden">
                                    <img
                                        src={selectedItem.images[0]}
                                        alt={selectedItem.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            {/* SAO Status Toggle — Found items only */}
                            {selectedItem.type === "found" && (
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">SAO Presence</p>
                                            <p className="text-xs text-slate-400">
                                                {selectedItem.isAtSAO
                                                    ? "Item is now at the SAO office"
                                                    : "Item has not yet been brought to SAO"}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleSAOToggle(selectedItem)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${selectedItem.isAtSAO
                                            ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200"
                                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                                            }`}
                                    >
                                        {selectedItem.isAtSAO ? "✓ At SAO — Mark as Not Yet" : "Mark as At SAO"}
                                    </button>
                                </div>
                            )}

                            {/* Status Badge */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-600">Status:</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(selectedItem.status)}`}>
                                    {getStatusIcon(selectedItem.status)}
                                    {selectedItem.status?.charAt(0).toUpperCase() + selectedItem.status?.slice(1)}
                                </span>
                            </div>

                            {/* Description */}
                            {selectedItem.description && (
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2 text-slate-600">
                                        <FileText className="w-4 h-4" />
                                        <span className="font-medium">Description</span>
                                    </div>
                                    <p className="text-slate-700">{selectedItem.description}</p>
                                </div>
                            )}

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                    <Tag className="w-4 h-4 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-slate-500">Category</p>
                                        <p className="font-medium text-slate-900">{selectedItem.category || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-slate-500">Location</p>
                                        <p className="font-medium text-slate-900">{selectedItem.location || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                    <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-slate-500">Date Reported</p>
                                        <p className="font-medium text-slate-900">
                                            {selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                    <User className="w-4 h-4 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-slate-500">Reported By</p>
                                        <p className="font-medium text-slate-900">{selectedItem.reportedBy?.name || 'Unknown'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Reporter Contact */}
                            <div className="border-t border-slate-200 pt-4">
                                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Contact Information
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <p><span className="text-slate-500">Name:</span> {selectedItem.reportedBy?.name || 'N/A'}</p>
                                    <p><span className="text-slate-500">Email:</span> {selectedItem.reportedBy?.email || 'N/A'}</p>
                                    {selectedItem.reportedBy?.phone && (
                                        <p><span className="text-slate-500">Phone:</span> {selectedItem.reportedBy.phone}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    handleDelete(selectedItem._id);
                                    closeModal();
                                }}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Item
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminItems;