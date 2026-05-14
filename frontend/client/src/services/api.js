const API_URL = "https://uclaim-proj-production.up.railway.app/api";


const getToken = () => localStorage.getItem("token");

const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();

    const config = {
        headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
        ...options,
    };

    if (options.body && typeof options.body === "object") {
        config.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error ${response.status} on ${endpoint}:`, errorText);

            if (response.status === 401 && !endpoint.includes("/admin/settings")) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/login";
            }

            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }

            throw new Error(errorMessage);
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        }
        return { success: true };
    } catch (error) {
        console.error("API Request failed:", error);
        throw error;
    }
};

export const api = {
    // ── Public (no token needed) ─────────────────────────────
    getPublicSettings: () => apiRequest("/settings"),

    // Items (User)
    getItems: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/items/all${queryString ? `?${queryString}` : ""}`);
    },
    addItem: (data) => apiRequest("/items/add", { method: "POST", body: data }),
    getItem: (id) => apiRequest(`/items/${id}`),
    updateItemStatus: (id, status) =>
        apiRequest(`/items/${id}/status`, { method: "PATCH", body: { status } }),
    // ✅ NEW: Edit item details (owner only)
    updateItem: (id, data) => apiRequest(`/items/${id}`, { method: "PUT", body: data }),
    // ✅ NEW: Delete item + its claims (owner only)
    deleteItem: (id) => apiRequest(`/items/${id}`, { method: "DELETE" }),

    // Dashboard (User)
    getDashboardStats: (period = "all") => apiRequest(`/items/stats/dashboard?period=${period}`),
    getRecentActivity: (period = "all") => apiRequest(`/items/recent?period=${period}`),
    getNotifications: () => apiRequest("/items/notifications"),

    // Claims (User)
    submitClaim: (data) => apiRequest("/claims/submit", { method: "POST", body: data }),
    submitFinderReport: (data) => apiRequest("/claims/submit-finder-report", { method: "POST", body: data }),
    getMyClaims: () => apiRequest("/claims/my-claims"),
    getIncomingClaims: () => apiRequest("/claims/incoming-claims"),
    getClaimDetails: (id) => apiRequest(`/claims/${id}`),

    // User Profile
    getProfile: () => apiRequest("/user/profile"),
    updateProfile: (data) => apiRequest("/user/profile", { method: "PUT", body: data }),
    changePassword: (data) => apiRequest("/auth/change-password", { method: "POST", body: data }),
    getUserStats: () => apiRequest("/user/stats"),
    getUserItems: () => apiRequest("/user/items"),

    // Auth
    login: (credentials) => apiRequest("/auth/login", { method: "POST", body: credentials }),
    register: (data) => apiRequest("/auth/register", { method: "POST", body: data }),
    verifyEmail: (token) => apiRequest("/auth/verify-email", { method: "POST", body: { token } }),
    resendVerification: (email) => apiRequest("/auth/resend-verification", { method: "POST", body: { email } }),
    forgotPassword: (email) => apiRequest("/auth/forgot-password", { method: "POST", body: { email } }),
    resetPassword: (token, newPassword) => apiRequest("/auth/reset-password", { method: "POST", body: { token, newPassword } }),

    // Admin Items
    getAllItemsAdmin: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/admin/items${queryString ? `?${queryString}` : ""}`);
    },
    updateItemStatusAdmin: (id, status) =>
        apiRequest(`/admin/items/${id}/status`, { method: "PUT", body: { status } }),
    deleteItemAdmin: (id) => apiRequest(`/admin/items/${id}`, { method: "DELETE" }),

    // Admin Claim SAO Actions
    markPickedUp: (id) =>
        apiRequest(`/claims/admin/${id}/mark-picked-up`, { method: "PUT" }),
    updateItemSAOStatus: (id, isAtSAO) =>
        apiRequest(`/items/${id}/sao-status`, { method: "PATCH", body: { isAtSAO } }),
    getItemAdmin: (id) => apiRequest(`/admin/items/${id}`),

    // Admin Stats
    getAdminStats: () => apiRequest("/admin/stats"),
    getAdminStatsByRange: (range) => apiRequest(`/admin/stats/${range}`),

    // Admin Users
    getAllUsers: () => apiRequest("/admin/users"),
    createUser: (data) => apiRequest("/admin/users/create", { method: "POST", body: data }),
    updateUser: (id, data) => apiRequest(`/admin/users/${id}`, { method: "PUT", body: data }),
    updateUserRole: (id, role) =>
        apiRequest(`/admin/users/${id}/role`, { method: "PUT", body: { role } }),
    deleteUser: (id) => apiRequest(`/admin/users/${id}`, { method: "DELETE" }),

    // Admin Reports
    getReports: (period) => apiRequest(`/admin/reports?period=${period}`),

    // Admin Claims
    getAllClaimsAdmin: (status) =>
        apiRequest(`/claims/admin/all${status ? `?status=${status}` : ""}`),
    getPendingClaimsCount: () => apiRequest("/claims/admin/pending-count"),
    approveClaim: (id, reviewNotes) =>
        apiRequest(`/claims/admin/${id}/approve`, { method: "PUT", body: { reviewNotes } }),
    rejectClaim: (id, rejectionReason) =>
        apiRequest(`/claims/admin/${id}/reject`, { method: "PUT", body: { rejectionReason } }),

    // ✅ Finder Report Admin Actions
    confirmFinderReceived: (id, adminNotes) =>
        apiRequest(`/claims/admin/${id}/confirm-finder-received`, { method: "PUT", body: { adminNotes } }),
    declineFinderReport: (id, rejectionReason) =>
        apiRequest(`/claims/admin/${id}/decline-finder-report`, { method: "PUT", body: { rejectionReason } }),
    ownerCollected: (id) =>
        apiRequest(`/claims/admin/${id}/owner-collected`, { method: "PUT" }),

    // Watch / Unwatch item
    watchItem: (id) => apiRequest(`/items/${id}/watch`, { method: "POST" }),
    getWatchStatus: (id) => apiRequest(`/items/${id}/watch`),

    // User DB Notifications
    getDbNotifications: () => apiRequest("/items/user/db-notifications"),
    markDbNotificationsRead: () => apiRequest("/items/user/db-notifications/read", { method: "PATCH" }),

    // ── Staff Endpoints (reuse admin routes, staffOrAdmin middleware allows access) ──
    getStaffDashboardStats: () => api.getAdminStats(),
    getStaffItems: (params = {}) => api.getAllItemsAdmin(params),
    updateItemStatusStaff: (id, status) => api.updateItemStatusAdmin(id, status),
    deleteItemStaff: (id) => api.deleteItemAdmin(id),
    updateItemSAOStatusStaff: (id, isAtSAO) => api.updateItemSAOStatus(id, isAtSAO),
    getStaffBadgeCounts: () => apiRequest("/admin/badge-counts"),

    // ── Staff Claim Endpoints (reuse /claims/admin/* routes) ──
    getStaffClaims: (status) =>
        apiRequest(`/claims/admin/all${status ? `?status=${status}` : ""}`),
    approveClaimStaff: (id, reviewNotes) =>
        apiRequest(`/claims/admin/${id}/approve`, { method: "PUT", body: { reviewNotes } }),
    rejectClaimStaff: (id, rejectionReason) =>
        apiRequest(`/claims/admin/${id}/reject`, { method: "PUT", body: { rejectionReason } }),
    markPickedUpStaff: (id) =>
        apiRequest(`/claims/admin/${id}/mark-picked-up`, { method: "PUT" }),
    confirmFinderReceivedStaff: (id, adminNotes) =>
        apiRequest(`/claims/admin/${id}/confirm-finder-received`, { method: "PUT", body: { adminNotes } }),
    declineFinderReportStaff: (id, rejectionReason) =>
        apiRequest(`/claims/admin/${id}/decline-finder-report`, { method: "PUT", body: { rejectionReason } }),
    ownerCollectedStaff: (id) =>
        apiRequest(`/claims/admin/${id}/owner-collected`, { method: "PUT" }),

    // Announcements
    getAnnouncements: () => apiRequest("/admin/announcements"),
    createAnnouncement: (data) => apiRequest("/admin/announcements", { method: "POST", body: data }),
    updateAnnouncement: (id, data) => apiRequest(`/admin/announcements/${id}`, { method: "PUT", body: data }),
    deleteAnnouncement: (id) => apiRequest(`/admin/announcements/${id}`, { method: "DELETE" }),

    // Admin Categories
    getCategories: () => apiRequest("/categories"),
    getAllCategoriesAdmin: () => apiRequest("/admin/categories/all"),
    createCategory: (data) => apiRequest("/admin/categories", { method: "POST", body: data }),
    updateCategory: (id, data) => apiRequest(`/admin/categories/${id}`, { method: "PUT", body: data }),
    deleteCategory: (id) => apiRequest(`/admin/categories/${id}`, { method: "DELETE" }),

    // Admin Settings
    getAdminSettings: () => apiRequest("/admin/settings"),
    saveAdminSettings: (settings) =>
        apiRequest("/admin/settings", { method: "PUT", body: settings }),
    resetAdminSettings: () => apiRequest("/admin/settings/reset", { method: "POST" }),
};

export default api;