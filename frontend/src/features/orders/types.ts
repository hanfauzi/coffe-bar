import type { MenuItem } from '../menus/types';

export interface OrderItem {
  id: string;
  orderId: string;
  menuId: string | null;
  quantity: number;
  unitPrice: number;
  customPrice: number | null;
  finalPrice: number;
  notes?: string | null;
  excludedIngredients?: string[];
  sugarLevel?: string;
  parentItemId?: string | null;
  menu?: MenuItem;
  extras?: OrderItem[];
}

export interface Order {
  id: string;
  orderDate: string;
  customerName?: string | null;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  notes?: string | null;
  items: OrderItem[];
  paymentMethod?: string | null;
  paymentStatus?: 'PENDING' | 'LUNAS' | 'BELUM_DIBAYAR';
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
