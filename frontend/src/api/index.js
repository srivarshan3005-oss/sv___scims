import axios from 'axios';

/**
 * baseURL is '/api' — CRA proxy in package.json rewrites it to
 * http://localhost:8080/api, matching Spring's context-path=/api.
 *
 * package.json proxy: "http://localhost:8080" (no /api suffix)
 * axios baseURL:      "/api"
 * Final URL:          http://localhost:8080/api/...  ✓
 */
const API_BASE = '/api';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT token ──────────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 Unauthorized globally ────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Avoid redirect loop if already on /login
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ============================================================
// AUTH
// ============================================================
export const authAPI = {
    login:    (data) => api.post('/auth/login',    data),
    register: (data) => api.post('/auth/register', data),
};

// ============================================================
// CITIZEN — COMPLAINTS
// ============================================================
export const complaintAPI = {
    /**
     * For multipart/form-data, pass the FormData directly.
     * When axios receives a FormData it automatically sets the correct
     * Content-Type header including the multipart boundary string.
     * We must NOT set Content-Type manually — doing so omits the boundary
     * and the server cannot parse the parts. Setting it to undefined lets
     * axios override it correctly.
     */
    create: (formData) =>
        api.post('/citizen/complaints', formData, {
            headers: { 'Content-Type': undefined },
        }),
    getMyComplaints: (page = 0, size = 10) =>
        api.get(`/citizen/complaints?page=${page}&size=${size}`),
    getById: (id) => api.get(`/citizen/complaints/${id}`),
    delete:  (id) => api.delete(`/citizen/complaints/${id}`),
};

// ============================================================
// CITIZEN — PROFILE & DASHBOARD
// ============================================================
export const profileAPI = {
    get:          ()         => api.get('/citizen/profile'),
    update:       (data)     => api.put('/citizen/profile', data),
    /**
     * Same multipart fix — let axios set the Content-Type with boundary.
     */
    uploadImage:  (formData) =>
        api.post('/citizen/profile/image', formData, {
            headers: { 'Content-Type': undefined },
        }),
    getDashboard: () => api.get('/citizen/dashboard'),
};

// ============================================================
// ADMIN — COMPLAINTS
// ============================================================
export const adminComplaintAPI = {
    getAll:       (params)   => api.get('/admin/complaints', { params }),
    getById:      (id)       => api.get(`/admin/complaints/${id}`),
    updateStatus: (id, data) => api.patch(`/admin/complaints/${id}/status`, data),
    delete:       (id)       => api.delete(`/admin/complaints/${id}`),
};

// ============================================================
// ADMIN — USERS
// ============================================================
export const adminUserAPI = {
    getDashboard:  ()         => api.get('/admin/dashboard'),
    getAll:        (params)   => api.get('/admin/users', { params }),
    getById:       (id)       => api.get(`/admin/users/${id}`),
    toggleStatus:  (id)       => api.patch(`/admin/users/${id}/toggle-status`),
    delete:        (id)       => api.delete(`/admin/users/${id}`),
};

// ============================================================
// CATEGORIES
// ============================================================
export const categoryAPI = {
    getActive: ()         => api.get('/categories/active'),
    getAll:    ()         => api.get('/categories'),
    create:    (data)     => api.post('/categories', data),
    update:    (id, data) => api.put(`/categories/${id}`, data),
    toggle:    (id)       => api.patch(`/categories/${id}/toggle`),
    delete:    (id)       => api.delete(`/categories/${id}`),
};

// ============================================================
// SUPER ADMIN — DEPARTMENTS
// ============================================================
export const departmentAPI = {
    getAll:    ()         => api.get('/admin/departments'),
    getActive: ()         => api.get('/admin/departments/active'),
    getById:   (id)       => api.get(`/admin/departments/${id}`),
    create:    (data)     => api.post('/admin/departments', data),
    update:    (id, data) => api.put(`/admin/departments/${id}`, data),
    toggle:    (id)       => api.patch(`/admin/departments/${id}/toggle`),
    delete:    (id)       => api.delete(`/admin/departments/${id}`),
};

// ============================================================
// SUPER ADMIN — SUB ADMINS
// ============================================================
export const subAdminAPI = {
    getAll:       (params)   => api.get('/admin/subadmins', { params }),
    getById:      (id)       => api.get(`/admin/subadmins/${id}`),
    create:       (data)     => api.post('/admin/subadmins', data),
    update:       (id, data) => api.put(`/admin/subadmins/${id}`, data),
    toggleStatus: (id)       => api.patch(`/admin/subadmins/${id}/toggle-status`),
    delete:       (id)       => api.delete(`/admin/subadmins/${id}`),
};

// ============================================================
// SUB ADMIN — DEPARTMENT-SCOPED COMPLAINTS & DASHBOARD
// ============================================================
export const subAdminComplaintAPI = {
    getDashboard: ()         => api.get('/subadmin/dashboard'),
    getAll:       (params)   => api.get('/subadmin/complaints', { params }),
    getById:      (id)       => api.get(`/subadmin/complaints/${id}`),
    updateStatus: (id, data) => api.patch(`/subadmin/complaints/${id}/status`, data),
};

export default api;
