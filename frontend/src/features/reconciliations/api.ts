import { request } from '../../lib/apiClient';

export const reconciliations = {
  list: () => request('/api/reconciliations'),
  create: (body: any) => request('/api/reconciliations', { method: 'POST', body: JSON.stringify(body) }),
};
