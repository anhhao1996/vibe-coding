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
  timeout: 20000
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
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
};

// Transaction API
export const transactionApi = {
  getAll: (limit = 100) => api.get(`/transactions?limit=${limit}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`)
};

// Portfolio API
export const portfolioApi = {
  getDashboard: () => api.get('/portfolio/dashboard'),
  updateCurrentPrice: (categoryId, currentPrice) => api.put(`/portfolio/price/${categoryId}`, { current_price: currentPrice }),
  createSnapshot: () => api.post('/portfolio/snapshot')
};

// External Price API
export const priceApi = {
  updateCategoryWithFmarket: (categoryId, slug = 'dcds') =>
    api.post(`/price/fmarket/update/${categoryId}`, { slug }),
  updateCategoryWithGold: (categoryId) => api.post(`/price/gold/update/${categoryId}`),
  updateCategoryWithUSD: (categoryId) => api.post(`/price/usd/update/${categoryId}`)
};

// Expense API - Quản lý chi tiêu
export const expenseApi = {
  getItemNames: () => api.get('/expenses/item-names'),
  getTrackedItems: () => api.get('/expenses/tracked-items'),
  saveTrackedItems: (items) => api.put('/expenses/tracked-items', { items }),
  getTrend: (months = 12) => api.get(`/expenses/trend?months=${months}`),
  getMultipleItemsTrend: (items, months = 12) => api.post(`/expenses/trend/items?months=${months}`, { items }),
  getByMonth: (month) => api.get(`/expenses/month/${month}`),
  createMonth: (month, notes) => api.post('/expenses', { month, notes }),
  addItem: (monthlyExpenseId, data) => api.post(`/expenses/${monthlyExpenseId}/items`, data),
  updateItem: (id, data) => api.put(`/expenses/items/${id}`, data),
  deleteItem: (id) => api.delete(`/expenses/items/${id}`),
  copyFromMonth: (sourceMonth, targetMonth) => api.post('/expenses/copy', { sourceMonth, targetMonth }),
  deleteMonth: (month) => api.delete(`/expenses/month/${month}`)
};

// Savings API - Quản lý tiết kiệm
export const savingsApi = {
  getAll: () => api.get('/savings'),
  getById: (id) => api.get(`/savings/${id}`),
  create: (data) => api.post('/savings', data),
  update: (id, data) => api.put(`/savings/${id}`, data),
  delete: (id) => api.delete(`/savings/${id}`),
  addTransaction: (bookId, data) => api.post(`/savings/${bookId}/transactions`, data),
  deleteTransaction: (id) => api.delete(`/savings/transactions/${id}`)
};

export default api;
