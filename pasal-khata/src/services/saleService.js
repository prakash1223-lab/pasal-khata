import api from './api';

export const saleService = {
  getAll:  (params) => api.get('/sales', { params }),
  getById: (id)     => api.get(`/sales/${id}`),
  create:  (data)   => api.post('/sales', data),
};
