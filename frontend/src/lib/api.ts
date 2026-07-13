import { auth } from '../features/auth/api';
import { ingredients } from '../features/ingredients/api';
import { inventory } from '../features/inventory/api';
import { expenses } from '../features/expenses/api';
import { menus, recipes } from '../features/menus/api';
import { sales } from '../features/sales/api';
import { personalCups } from '../features/personal-cups/api';
import { reports } from '../features/reports/api';
import { orders } from '../features/orders/api';

export const api = {
  auth,
  ingredients,
  inventory,
  expenses,
  menus,
  recipes,
  sales,
  personalCups,
  reports,
  orders,
};

export { getToken, setToken, getUser, setUser } from './apiClient';
