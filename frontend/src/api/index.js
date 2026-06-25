import axios from "axios";

// Backend URL via CRA proxy
const API_BASE = "/api";

const api = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
});

// ============================================================
// REQUEST INTERCEPTOR (JWT ATTACHED HERE)
// ============================================================
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        console.log(
            `[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`
        );

        return config;
    },
    (error) => Promise.reject(error)
);

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.response?.status === 401 &&
            !window.location.pathname.startsWith("/login")
        ) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.replace("/login");
        }

        return Promise.reject(error);
    }
);

// ============================================================
// AUTH
// ============================================================
export const authAPI = {
    login: (data) => api.post("/auth/login", data),
    register: (data) => api.post("/auth/register", data),
};

// ============================================================
// CITIZEN - COMPLAINTS
// ============================================================
export const complaintAPI = {
    // ✅ FIXED: multipart support added here
    create: (formData) =>
        api.post("/citizen/complaints", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }),

    getMyComplaints: (page = 0, size = 10) =>
        api.get("/citizen/complaints", {
            params: { page, size },
        }),

    getById: (id) =>
        api.get(`/citizen/complaints/${id}`),

    delete: (id) =>
        api.delete(`/citizen/complaints/${id}`),
};

// ============================================================
// CITIZEN - PROFILE
// ============================================================
export const profileAPI = {
    get: () =>
        api.get("/citizen/profile"),

    update: (data) =>
        api.put("/citizen/profile", data),

    uploadImage: (formData) =>
        api.post("/citizen/profile/image", formData),

    getDashboard: () =>
        api.get("/citizen/dashboard"),
};

// ============================================================
// ADMIN - COMPLAINTS
// ============================================================
export const adminComplaintAPI = {
    getAll: (params) =>
        api.get("/admin/complaints", { params }),

    getById: (id) =>
        api.get(`/admin/complaints/${id}`),

    updateStatus: (id, data) =>
        api.patch(`/admin/complaints/${id}/status`, data),

    delete: (id) =>
        api.delete(`/admin/complaints/${id}`),
};

// ============================================================
// ADMIN - USERS
// ============================================================
export const adminUserAPI = {
    getDashboard: () =>
        api.get("/admin/dashboard"),

    getAll: (params) =>
        api.get("/admin/users", { params }),

    getById: (id) =>
        api.get(`/admin/users/${id}`),

    toggleStatus: (id) =>
        api.patch(`/admin/users/${id}/toggle-status`),

    delete: (id) =>
        api.delete(`/admin/users/${id}`),
};

// ============================================================
// CATEGORIES
// ============================================================
export const categoryAPI = {
    getActive: () =>
        api.get("/categories/active"),

    getAll: () =>
        api.get("/categories"),

    create: (data) =>
        api.post("/categories", data),

    update: (id, data) =>
        api.put(`/categories/${id}`, data),

    toggle: (id) =>
        api.patch(`/categories/${id}/toggle`),

    delete: (id) =>
        api.delete(`/categories/${id}`),
};

export default api;