import { request } from '../../lib/apiClient';

export const auth = {
  login: (body: any) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body: any) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  getProfile: () => request('/api/auth/profile'),
};
