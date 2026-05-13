import { useState, useEffect } from "react";
import { Tag, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, AlertCircle, X, CheckCircle, Megaphone, Info, AlertTriangle } from "lucide-react";
import { api } from "../../services/api";

function StaffSettings() {
    const [activeTab, setActiveTab] = useState("categories");

    // Categories state
    const [categories, setCategories] = useState([]);
    const [catLoading, setCatLoading] = useState(false);
    const [catError, setCatError] = useState("");
    const [newCatName, setNewCatName] = useState("");
    const [newCatValue, setNewCatValue] = useState("");
    const [editingCat, setEditingCat] = useState(null);
    const [editName, setEditName] = useState("");
    const [editValue, setEditValue] = useState("");
    const [toast, setToast] = useState(null);

    // Announcements state
    const [announcements, setAnnouncements] = useState([]);
    const [annLoading, setAnnLoading] = useState(false);
    const [annError, setAnnError] = useState("");
    const [newAnnTitle, setNewAnnTitle] = useState("");
    const [newAnnMessage, setNewAnnMessage] = useState("");
    const [newAnnType, setNewAnnType] = useState("info");
    const [editingAnn, setEditingAnn] = useState(null);
    const [editAnnTitle, setEditAnnTitle] = useState("");
    const [editAnnMessage, setEditAnnMessage] = useState("");
    const [editAnnType, setEditAnnType] = useState("info");

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchCategories = async () => {
        setCatLoading(true);
        setCatError("");
        try {
            const data = await api.getAllCategoriesAdmin();
            setCategories(data);
        } catch {
            setCatError("Failed to load categories.");
        } finally {
            setCatLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); fetchAnnouncements(); }, []);

    const fetchAnnouncements = async () => {
        setAnnLoading(true);
        setAnnError("");
        try {
            const data = await api.getAnnouncements();
            setAnnouncements(data);
        } catch {
            setAnnError("Failed to load announcements.");
        } finally {
            setAnnLoading(false);
        }
    };

    const handleAddAnnouncement = async () => {
        if (!newAnnTitle.trim() || !newAnnMessage.trim()) {
            setAnnError("Title and message are required.");
            return;
        }
        setAnnError("");
        try {
            const updated = await api.createAnnouncement({ title: newAnnTitle.trim(), message: newAnnMessage.trim(), type: newAnnType });
            setAnnouncements(updated);
            setNewAnnTitle(""); setNewAnnMessage(""); setNewAnnType("info");
            showToast("Announcement posted!");
        } catch (err) {
            setAnnError(err.message || "Failed to add announcement.");
        }
    };

    const handleToggleAnnouncement = async (ann) => {
        try {
            const updated = await api.updateAnnouncement(ann._id, { isActive: !ann.isActive });
            setAnnouncements(updated);
        } catch {
            setAnnError("Failed to update announcement.");
        }
    };

    const handleDeleteAnnouncement = async (id) => {
        if (!window.confirm("Delete this announcement?")) return;
        try {
            await api.deleteAnnouncement(id);
            setAnnouncements(prev => prev.filter(a => a._id !== id));
            showToast("Announcement deleted.");
        } catch {
            setAnnError("Failed to delete announcement.");
        }
    };

    const startEditAnn = (ann) => {
        setEditingAnn(ann);
        setEditAnnTitle(ann.title);
        setEditAnnMessage(ann.message);
        setEditAnnType(ann.type);
    };

    const handleSaveEditAnn = async () => {
        if (!editAnnTitle.trim() || !editAnnMessage.trim()) return;
        try {
            const updated = await api.updateAnnouncement(editingAnn._id, { title: editAnnTitle.trim(), message: editAnnMessage.trim(), type: editAnnType });
            setAnnouncements(updated);
            setEditingAnn(null);
            showToast("Announcement updated!");
        } catch (err) {
            setAnnError(err.message || "Failed to save changes.");
        }
    };

    const annTypeConfig = {
        info: { label: "Info", color: "#0EA5E9", bg: "rgba(14,165,233,0.1)", icon: <Info className="w-4 h-4" /> },
        warning: { label: "Warning", color: "#D97706", bg: "rgba(217,119,6,0.1)", icon: <AlertTriangle className="w-4 h-4" /> },
        success: { label: "Success", color: "#047857", bg: "rgba(4,120,87,0.1)", icon: <CheckCircle className="w-4 h-4" /> },
    };

    const handleAddCategory = async () => {
        if (!newCatName.trim() || !newCatValue.trim()) {
            setCatError("Both name and value are required.");
            return;
        }
        setCatError("");
        try {
            const created = await api.createCategory({ name: newCatName.trim(), value: newCatValue.trim() });
            setCategories((prev) => [...prev, created]);
            setNewCatName("");
            setNewCatValue("");
            showToast("Category added!");
        } catch (err) {
            setCatError(err.message || "Failed to add category.");
        }
    };

    const handleToggleActive = async (cat) => {
        try {
            const updated = await api.updateCategory(cat._id, { isActive: !cat.isActive });
            setCategories((prev) => prev.map((c) => (c._id === cat._id ? updated : c)));
        } catch {
            setCatError("Failed to update category.");
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm("Delete this category? Items with this category won't be affected.")) return;
        try {
            await api.deleteCategory(id);
            setCategories((prev) => prev.filter((c) => c._id !== id));
            showToast("Category deleted.");
        } catch {
            setCatError("Failed to delete category.");
        }
    };

    const startEdit = (cat) => { setEditingCat(cat); setEditName(cat.name); setEditValue(cat.value); };

    const handleSaveEdit = async () => {
        if (!editName.trim() || !editValue.trim()) return;
        try {
            const updated = await api.updateCategory(editingCat._id, { name: editName.trim(), value: editValue.trim() });
            setCategories((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
            setEditingCat(null);
            showToast("Category updated!");
        } catch (err) {
            setCatError(err.message || "Failed to save changes.");
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">

            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-8 z-50 flex items-center gap-3 px-5 py-3 text-white rounded-xl shadow-lg text-sm font-semibold ${toast.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
                    <CheckCircle className="w-4 h-4" />
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[#1D3557]">Settings</h1>
                <p className="text-sm text-gray-400 mt-1">Manage platform settings</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200">
                {[
                    { key: "categories", label: "Categories", icon: <Tag className="w-4 h-4" /> },
                    { key: "announcements", label: "Announcements", icon: <Megaphone className="w-4 h-4" /> },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 -mb-px ${activeTab === tab.key
                                ? "border-[#1D3557] text-[#1D3557]"
                                : "border-transparent text-slate-400 hover:text-slate-600"
                            }`}
                    >
                        {tab.icon}{tab.label}
                    </button>
                ))}
            </div>

            {/* ── ANNOUNCEMENTS TAB ── */}
            {activeTab === "announcements" && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 p-6 border-b border-slate-100">
                        <div className="p-2.5 bg-[#1D3557]/10 rounded-xl">
                            <Megaphone className="w-5 h-5 text-[#1D3557]" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-[#1D3557]">Announcements</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Post notices visible to all users on the dashboard</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-5">
                        {annError && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {annError}
                                <button onClick={() => setAnnError("")} className="ml-auto"><X className="w-4 h-4" /></button>
                            </div>
                        )}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Post New Announcement</p>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 font-medium">Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. SAO office closed Nov 15"
                                    value={newAnnTitle}
                                    onChange={(e) => setNewAnnTitle(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#468FAF]/30 focus:border-[#468FAF] transition"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 font-medium">Message</label>
                                <textarea
                                    rows={3}
                                    placeholder="Full announcement text..."
                                    value={newAnnMessage}
                                    onChange={(e) => setNewAnnMessage(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#468FAF]/30 focus:border-[#468FAF] transition resize-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 font-medium">Type</label>
                                <div className="flex gap-2">
                                    {Object.entries(annTypeConfig).map(([key, cfg]) => (
                                        <button
                                            key={key}
                                            onClick={() => setNewAnnType(key)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all"
                                            style={{
                                                backgroundColor: newAnnType === key ? cfg.bg : "transparent",
                                                borderColor: newAnnType === key ? cfg.color : "#e2e8f0",
                                                color: newAnnType === key ? cfg.color : "#94a3b8",
                                            }}
                                        >
                                            {cfg.icon}{cfg.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={handleAddAnnouncement}
                                className="flex items-center gap-2 px-4 py-2 bg-[#1D3557] hover:bg-[#468FAF] text-white rounded-lg text-sm font-semibold transition-all duration-200"
                            >
                                <Plus className="w-4 h-4" />
                                Post Announcement
                            </button>
                        </div>
                        {annLoading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-7 h-7 animate-spin text-[#468FAF]" />
                            </div>
                        ) : announcements.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-sm">No announcements yet.</div>
                        ) : (
                            <div className="space-y-2">
                                {announcements.map((ann) => {
                                    const cfg = annTypeConfig[ann.type] || annTypeConfig.info;
                                    return (
                                        <div key={ann._id}
                                            className={`p-4 rounded-xl border transition ${ann.isActive ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100 opacity-60"}`}>
                                            {editingAnn?._id === ann._id ? (
                                                <div className="space-y-2">
                                                    <input value={editAnnTitle} onChange={(e) => setEditAnnTitle(e.target.value)}
                                                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#468FAF]/30" />
                                                    <textarea rows={2} value={editAnnMessage} onChange={(e) => setEditAnnMessage(e.target.value)}
                                                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#468FAF]/30 resize-none" />
                                                    <div className="flex gap-2">
                                                        {Object.entries(annTypeConfig).map(([key, c]) => (
                                                            <button key={key} onClick={() => setEditAnnType(key)}
                                                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border-2 transition-all"
                                                                style={{ backgroundColor: editAnnType === key ? c.bg : "transparent", borderColor: editAnnType === key ? c.color : "#e2e8f0", color: editAnnType === key ? c.color : "#94a3b8" }}>
                                                                {c.icon}{c.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={handleSaveEditAnn} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition">Save</button>
                                                        <button onClick={() => setEditingAnn(null)} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                                                        {cfg.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-[#1D3557]">{ann.title}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{ann.message}</p>
                                                        <p className="text-[10px] text-slate-300 mt-1">{new Date(ann.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${ann.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                                            {ann.isActive ? "Live" : "Hidden"}
                                                        </span>
                                                        <button onClick={() => handleToggleAnnouncement(ann)} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
                                                            {ann.isActive ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                                                        </button>
                                                        <button onClick={() => startEditAnn(ann)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition">
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteAnnouncement(ann._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── CATEGORIES TAB ── */}
            {activeTab === "categories" && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 p-6 border-b border-slate-100">
                        <div className="p-2.5 bg-[#468FAF]/10 rounded-xl">
                            <Tag className="w-5 h-5 text-[#468FAF]" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-[#1D3557]">Categories</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Add, edit, or remove item categories shown in dropdowns</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-5">
                        {catError && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {catError}
                                <button onClick={() => setCatError("")} className="ml-auto"><X className="w-4 h-4" /></button>
                            </div>
                        )}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Add New Category</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 font-medium">Display Name <span className="text-slate-300">(shown to users)</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Bags & Luggage"
                                        value={newCatName}
                                        onChange={(e) => setNewCatName(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#468FAF]/30 focus:border-[#468FAF] transition"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 font-medium">Value <span className="text-slate-300">(saved to database)</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Bags"
                                        value={newCatValue}
                                        onChange={(e) => setNewCatValue(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#468FAF]/30 focus:border-[#468FAF] transition"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleAddCategory}
                                className="flex items-center gap-2 px-4 py-2 bg-[#1D3557] hover:bg-[#468FAF] text-white rounded-lg text-sm font-semibold transition-all duration-200"
                            >
                                <Plus className="w-4 h-4" />
                                Add Category
                            </button>
                        </div>
                        {catLoading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-7 h-7 animate-spin text-[#468FAF]" />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {categories.map((cat) => (
                                    <div
                                        key={cat._id}
                                        className={`flex items-center gap-3 p-3.5 rounded-xl border transition ${cat.isActive ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100 opacity-60"}`}
                                    >
                                        {editingCat?._id === cat._id ? (
                                            <>
                                                <div className="flex-1 grid grid-cols-2 gap-2">
                                                    <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Display name" className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#468FAF]/30" />
                                                    <input value={editValue} onChange={(e) => setEditValue(e.target.value)} placeholder="Value" className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#468FAF]/30" />
                                                </div>
                                                <button onClick={handleSaveEdit} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition">Save</button>
                                                <button onClick={() => setEditingCat(null)} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition">Cancel</button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-[#1D3557]">{cat.name}</p>
                                                    <p className="text-xs text-slate-400">value: <span className="font-mono">{cat.value}</span></p>
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${cat.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                                    {cat.isActive ? "Active" : "Hidden"}
                                                </span>
                                                <button onClick={() => handleToggleActive(cat)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
                                                    {cat.isActive ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5" />}
                                                </button>
                                                <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteCategory(cat._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default StaffSettings;