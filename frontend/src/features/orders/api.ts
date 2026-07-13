import { request } from '../../lib/apiClient';

export const orders = {
  list: () => request('/api/orders'),
  create: (body: any) => request('/api/orders', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: any) => request(`/api/orders/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => request(`/api/orders/${id}`, { method: 'DELETE' }),
  complete: (id: string, body?: any) => request(`/api/orders/${id}/complete`, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
};
