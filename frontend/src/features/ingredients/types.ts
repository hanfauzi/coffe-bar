export type IngredientCategory = 'RAW_MATERIAL' | 'PACKAGING' | 'OTHER';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  currentStock: number;
  unit: string;
  minimumStock: number;
  safetyStock?: number;
  reservedStock?: number;
  availableStock?: number;
  latestUnitCost: number;
  isPackaging: boolean;
}
