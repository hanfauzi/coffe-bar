import { MenuItem } from './menu';

export interface SaleItem {
  id: string;
  saleId: string;
  menuId: string | null;
  quantity: number;
  unitPrice: number;
  customPrice: number | null;
  finalPrice: number;
  hppSnapshot: number;
  notes: string | null;
  parentItemId: string | null;
  excludedIngredients: string[];
  sugarLevel: string;
  menu?: MenuItem | null;
  extras?: SaleItem[];
}

export interface Sale {
  id: string;
  saleDate: Date;
  totalRevenue: number;
  totalHpp: number;
  grossProfit: number;
  notes: string | null;
  createdAt: Date;
  items?: SaleItem[];
}
