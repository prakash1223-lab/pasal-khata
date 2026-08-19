import api from './api';

export const supplierService = {
  getAll:          (params)     => api.get('/suppliers', { params }),
  getById:         (id)         => api.get(`/suppliers/${id}`),
  getTransactions: (id)         => api.get(`/suppliers/${id}/transactions`),
  create:          (data)       => api.post('/suppliers', data),
  update:          (id, data)   => api.put(`/suppliers/${id}`, data),
  delete:          (id)         => api.delete(`/suppliers/${id}`),
  payUdharo:       (supplierId, data) => api.post('/supplier-payments', { supplierId, ...data }),
};
