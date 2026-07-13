import { request } from '../../lib/apiClient';

export const personalCups = {
  list: () => request('/api/personal-cups'),
  create: (body: any) => request('/api/personal-cups', { method: 'POST', body: JSON.stringify(body) }),
  delete: (id: string) => request(`/api/personal-cups/${id}`, { method: 'DELETE' }),
};
