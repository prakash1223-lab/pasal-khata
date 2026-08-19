import api from './api';

export const authService = {
  login:          (data)         => api.post('/auth/login', data),
  customerLogin:  (data)         => api.post('/auth/customer-login', data),
  getMe:          ()             => api.get('/auth/me'),
  changePassword: (data)         => api.put('/auth/change-password', data),
  updateShop:     (shopId, data) => api.put(`/shops/${shopId}`, data),
  getStaff:       ()             => api.get('/users'),
  addStaff:       (data)         => api.post('/users', data),
};
