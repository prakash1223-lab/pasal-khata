import api from './api';

export const purchaseService = {
  getAll:      (params)          => api.get('/purchases', { params }),
  getById:     (id)              => api.get(`/purchases/${id}`),
  create:      (data)            => api.post('/purchases', data),
  payPurchase: (purchaseId, data)=> api.post(`/purchases/${purchaseId}/pay`, data),
};
