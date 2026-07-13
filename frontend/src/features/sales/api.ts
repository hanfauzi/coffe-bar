import { request } from '../../lib/apiClient';

export const sales = {
  list: () => request('/api/sales'),
  create: (body: any) => request('/api/sales', { method: 'POST', body: JSON.stringify(body) }),
  delete: (id: string) => request(`/api/sales/${id}`, { method: 'DELETE' }),
};
