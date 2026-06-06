import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bobo_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const sessionId = getOrCreateSessionId();
  config.headers['X-Session-Id'] = sessionId;

  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Có lỗi xảy ra';
    if (error.response?.status === 401) {
      localStorage.removeItem('bobo_token');
      localStorage.removeItem('bobo_user');
    }
    return Promise.reject(new Error(message));
  }
);

const getOrCreateSessionId = () => {
  let id = localStorage.getItem('bobo_session_id');
  if (!id) {
    id = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    localStorage.setItem('bobo_session_id', id);
  }
  return id;
};

// ==============================
// API Services
// ==============================
export const productApi = {
  getAll: (params) => api.get('/products', { params }),
  getBySlug: (slug) => api.get(`/products/${slug}`),
  getCompleteTheLook: (slug) => api.get(`/products/${slug}/complete-the-look`),
  getCategories: () => api.get('/products/categories'),
};

export const cartApi = {
  getCart: () => api.get('/cart'),
  addItem: (data) => api.post('/cart/items', data),
  updateItem: (itemId, data) => api.put(`/cart/items/${itemId}`, data),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`),
};

export const orderApi = {
  create: (data) => api.post('/orders', data),
  getByCode: (code, email) => api.get(`/orders/${code}`, { params: { email } }),
  getMyOrders: (params) => api.get('/orders/my-orders', { params }),
  cancel: (code, reason) => api.put(`/orders/${code}/cancel`, { reason }),
};

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  // Products
  getProducts: (params) => api.get('/admin/products', { params }),
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  // Orders
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrder: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
  // Site config
  getSiteHomepage: () => api.get('/admin/site/homepage'),
  updateSiteHomepage: (data) => api.put('/admin/site/homepage', data),
};

export default api;
