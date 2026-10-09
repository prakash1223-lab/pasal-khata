import api from './api';

export const dashboardService = {
  getSummary: (period = 'month') => api.get('/dashboard', { params: { period } }),
};
