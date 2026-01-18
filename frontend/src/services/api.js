/**
 * API Service
 * Single Responsibility: Handle all API communications
 */
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Response interceptor for error handling
api.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

// Category API
export const categoryApi = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
};

// Transaction API
export const transactionApi = {
  getAll: (limit = 100) => api.get(`/transactions?limit=${limit}`),
  getByCategory: (categoryId, limit = 50) => api.get(`/transactions/category/${categoryId}?limit=${limit}`),
  getRecent: (days = 7) => api.get(`/transactions/recent?days=${days}`),
  getByDateRange: (startDate, endDate) => api.get(`/transactions/date-range?startDate=${startDate}&endDate=${endDate}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`)
};

// Portfolio API
export const portfolioApi = {
  getDashboard: () => api.get('/portfolio/dashboard'),
  getOverview: () => api.get('/portfolio/overview'),
  getDistribution: () => api.get('/portfolio/distribution'),
  getPnlByCategory: () => api.get('/portfolio/pnl'),
  getPnl7Days: () => api.get('/portfolio/pnl-7days'),
  getHistory: (days = 30) => api.get(`/portfolio/history?days=${days}`),
  updateCurrentValue: (categoryId, currentValue) => api.put(`/portfolio/value/${categoryId}`, { current_value: currentValue }),
  createSnapshot: () => api.post('/portfolio/snapshot')
};

// External Price API
export const priceApi = {
  getDCDSPrice: () => api.get('/price/dcds'),
  getGoldPrice: () => api.get('/price/gold'),
  getUSDPrice: () => api.get('/price/usd'),
  getPriceByFundCode: (fundCode) => api.get(`/price/fund/${fundCode}`),
  updateCategoryWithDCDS: (categoryId) => api.post(`/price/dcds/update/${categoryId}`),
  updateCategoryWithGold: (categoryId) => api.post(`/price/gold/update/${categoryId}`),
  updateCategoryWithUSD: (categoryId) => api.post(`/price/usd/update/${categoryId}`)
};

// Expense API - Quản lý chi tiêu
export const expenseApi = {
  getAll: () => api.get('/expenses'),
  getCategories: () => api.get('/expenses/categories'),
  getItemNames: () => api.get('/expenses/item-names'),
  getTrackedItems: () => api.get('/expenses/tracked-items'),
  saveTrackedItems: (items) => api.put('/expenses/tracked-items', { items }),
  getTrend: (months = 12) => api.get(`/expenses/trend?months=${months}`),
  getItemTrend: (itemName, months = 12) => api.get(`/expenses/trend/item/${encodeURIComponent(itemName)}?months=${months}`),
  getMultipleItemsTrend: (items, months = 12) => api.post(`/expenses/trend/items?months=${months}`, { items }),
  getByMonth: (month) => api.get(`/expenses/month/${month}`),
  getById: (id) => api.get(`/expenses/${id}`),
  createMonth: (month, notes) => api.post('/expenses', { month, notes }),
  addItem: (monthlyExpenseId, data) => api.post(`/expenses/${monthlyExpenseId}/items`, data),
  updateItem: (id, data) => api.put(`/expenses/items/${id}`, data),
  deleteItem: (id) => api.delete(`/expenses/items/${id}`),
  copyFromMonth: (sourceMonth, targetMonth) => api.post('/expenses/copy', { sourceMonth, targetMonth }),
  deleteMonth: (month) => api.delete(`/expenses/month/${month}`)
};

export default api;
