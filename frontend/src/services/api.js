import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
const AUTH_BASE_URL = process.env.REACT_APP_AUTH_URL || 'http://localhost:3001';

// Auth Service API
export const authService = {
  register: (email, password, name) =>
    axios.post(`${AUTH_BASE_URL}/api/auth/register`, { email, password, name }),

  login: (email, password) =>
    axios.post(`${AUTH_BASE_URL}/api/auth/login`, { email, password }),

  verify: (token) =>
    axios.post(`${AUTH_BASE_URL}/api/auth/verify`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
};

// Product API
export const productService = {
  getAllProducts: () =>
    axios.get(`${API_BASE_URL}/api/products`),

  getProductById: (id) =>
    axios.get(`${API_BASE_URL}/api/products/${id}`)
};

// Cart API
export const cartService = {
  getCart: (token) =>
    axios.get(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  addToCart: (token, item) =>
    axios.post(`${API_BASE_URL}/api/cart`, item, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  updateCartItem: (token, productId, data) =>
    axios.put(`${API_BASE_URL}/api/cart/${productId}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  removeFromCart: (token, productId) =>
    axios.delete(`${API_BASE_URL}/api/cart/${productId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  clearCart: (token) =>
    axios.delete(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    })
};

// Order API
export const orderService = {
  createOrder: (token, orderData) =>
    axios.post(`${API_BASE_URL}/api/orders`, orderData, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getUserOrders: (token) =>
    axios.get(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getOrderById: (token, id) =>
    axios.get(`${API_BASE_URL}/api/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
};
