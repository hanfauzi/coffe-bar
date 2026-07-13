import type { MenuItem } from '../menus/types';

export interface SaleItem {
  id: string;
  saleId: string;
  menuId: string | null;
  quantity: number;
  unitPrice: number;
  customPrice: number | null;
  finalPrice: number;
  menu?: MenuItem;
  parentItemId?: string | null;
  excludedIngredients?: string[];
  sugarLevel?: string;
  extras?: SaleItem[];
}

export interface Sale {
  id: string;
  date: string;
  notes?: string;
  items: SaleItem[];
  totalAmount: number;
  totalHpp: number;
  grossProfit: number;
}
