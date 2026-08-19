import api from './api';

export const paymentService = {
  getAll: (params) => api.get('/payments', { params }),
  create: (data)   => api.post('/payments', data),
};
