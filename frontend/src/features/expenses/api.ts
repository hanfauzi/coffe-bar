import { request } from '../../lib/apiClient';

export const expenses = {
  list: () => request('/api/expenses'),
  create: (body: any) => request('/api/expenses', { method: 'POST', body: JSON.stringify(body) }),
  delete: (id: string) => request(`/api/expenses/${id}`, { method: 'DELETE' }),
};
