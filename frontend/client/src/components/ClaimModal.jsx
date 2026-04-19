import { useState } from "react";
import { X, Upload, Phone, Mail, FileText, AlertCircle } from "lucide-react";
import { api } from "../services/api";

function ClaimModal({ item, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        proofDescription: "",
        contactPhone: "",
        contactEmail: "",
        proofImages: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [uploadingImages, setUploadingImages] = useState(false);

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploadingImages(true);
        const uploadedUrls = [];

        try {
            for (const file of files) {
                // Convert to base64 for simple upload (in production, use proper cloud storage)
                const reader = new FileReader();
                const promise = new Promise((resolve) => {
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                });
                const base64 = await promise;
                uploadedUrls.push(base64);
            }

            setFormData(prev => ({
                ...prev,
                proofImages: [...prev.proofImages, ...uploadedUrls]
            }));
        } catch (err) {
            setError("Failed to upload images");
        } finally {
            setUploadingImages(false);
        }
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            proofImages: prev.proofImages.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await api.submitClaim(item._id, formData);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || "Failed to submit claim");
        } finally {
            setLoading(false);
        }
    };

    // Get user email from localStorage as default
    const savedUser = localStorage.getItem("user");
    const userEmail = savedUser ? JSON.parse(savedUser).email : "";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Claim This Item</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Submit proof that this {item.type} item belongs to you
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Item Preview */}
                <div className="p-6 bg-blue-50/50 border-b border-blue-100">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-gray-200 rounded-2xl overflow-hidden flex-shrink-0">
                            {item.images && item.images[0] ? (
                                <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">{item.title}</h3>
                            <p className="text-sm text-gray-500 capitalize">{item.type} • {item.category} • {item.location}</p>
                            <p className="text-xs text-gray-400 mt-1">Item ID: #{item._id?.slice(-6).toUpperCase()}</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-600 font-medium">{error}</p>
                        </div>
                    )}

                    {/* Proof Description */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            <FileText className="w-4 h-4 inline mr-2" />
                            Proof of Ownership *
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            Describe specific details that prove this item is yours (serial numbers, distinctive marks, contents, etc.)
                        </p>
                        <textarea
                            required
                            value={formData.proofDescription}
                            onChange={(e) => setFormData({ ...formData, proofDescription: e.target.value })}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition min-h-[120px] resize-none"
                            placeholder="Example: This is my blue backpack with a Jansport logo. It contains my student ID card (ID: 2021-XXXXX), a red water bottle, and a MacBook Pro with a 'CS Dept' sticker..."
                            maxLength={1000}
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">{formData.proofDescription.length}/1000</p>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                <Phone className="w-4 h-4 inline mr-2" />
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                required
                                value={formData.contactPhone}
                                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                <Mail className="w-4 h-4 inline mr-2" />
                                Email Address *
                            </label>
                            <input
                                type="email"
                                required
                                defaultValue={userEmail}
                                value={formData.contactEmail}
                                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                                placeholder="your@email.com"
                            />
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            <Upload className="w-4 h-4 inline mr-2" />
                            Supporting Images (Optional)
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                            Upload photos of proof (receipts, ID, item photos, etc.)
                        </p>

                        <div className="flex flex-wrap gap-3">
                            {formData.proofImages.map((img, idx) => (
                                <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                                    <img src={img} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}

                            <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
                                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                <span className="text-xs text-gray-400">Add</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    disabled={uploadingImages}
                                />
                            </label>
                        </div>
                        {uploadingImages && (
                            <p className="text-xs text-blue-500 mt-2">Uploading...</p>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <p className="text-sm text-amber-800">
                            <strong>What happens next?</strong><br />
                            An admin will review your claim within 24-48 hours. You'll receive a notification when it's approved or rejected. If approved, the item reporter will be notified to arrange pickup/return.
                        </p>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.proofDescription || !formData.contactPhone || !formData.contactEmail}
                            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Submit Claim"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ClaimModal;