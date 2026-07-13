import { request } from '../../lib/apiClient';

export const menus = {
  list: () => request('/api/menus'),
  get: (id: string) => request(`/api/menus/${id}`),
  create: (body: any) => request('/api/menus', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: any) => request(`/api/menus/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => request(`/api/menus/${id}`, { method: 'DELETE' }),
};

export const recipes = {
  getByMenu: (menuId: string) => request(`/api/recipes/menu/${menuId}`),
  update: (menuId: string, recipesList: any[]) => request(`/api/recipes/menu/${menuId}`, { method: 'POST', body: JSON.stringify({ recipes: recipesList }) }),
};
