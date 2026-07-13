import type { Ingredient } from '../ingredients/types';

export type InventoryTransactionType =
  | 'PURCHASE'
  | 'SALE_USAGE'
  | 'PERSONAL_USAGE'
  | 'MANUAL_ADJUSTMENT'
  | 'WASTE'
  | 'CORRECTION';

export interface InventoryTransaction {
  id: string;
  ingredientId: string;
  quantityChange: number;
  type: InventoryTransactionType;
  date: string;
  notes?: string;
  ingredient?: Ingredient;
  createdAt?: string;
  referenceType?: string;
  referenceId?: string;
  unitCostSnapshot?: number;
}
