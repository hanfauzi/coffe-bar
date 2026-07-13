import { request } from '../../lib/apiClient';

export const ingredients = {
  list: () => request('/api/ingredients'),
  get: (id: string) => request(`/api/ingredients/${id}`),
  create: (body: any) => request('/api/ingredients', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: any) => request(`/api/ingredients/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => request(`/api/ingredients/${id}`, { method: 'DELETE' }),
};
