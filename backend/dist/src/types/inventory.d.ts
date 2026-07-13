import { Ingredient } from './ingredient';
export type InventoryTransactionType = 'PURCHASE' | 'SALE_USAGE' | 'PERSONAL_USAGE' | 'MANUAL_ADJUSTMENT' | 'WASTE' | 'CORRECTION';
export interface InventoryTransaction {
    id: string;
    ingredientId: string;
    type: InventoryTransactionType | string;
    quantityChange: number;
    unit: string;
    unitCostSnapshot: number;
    referenceType: 'EXPENSE' | 'SALE' | 'PERSONAL_CUP' | 'MANUAL' | string | null;
    referenceId: string | null;
    notes: string | null;
    createdAt: Date;
    ingredient?: Ingredient;
}
