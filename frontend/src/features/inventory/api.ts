import { request } from '../../lib/apiClient';

export const inventory = {
  transactions: (ingredientId?: string) =>
    request(`/api/inventory/transactions${ingredientId ? `?ingredientId=${ingredientId}` : ''}`),
  adjust: (body: { ingredientId: string; quantityChange: number; type: string; notes: string }) =>
    request('/api/inventory/adjust', { method: 'POST', body: JSON.stringify(body) }),
};
