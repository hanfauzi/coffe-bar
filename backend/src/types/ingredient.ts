export type IngredientCategory = 'RAW_MATERIAL' | 'PACKAGING' | 'OTHER';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory | string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  latestUnitCost: number;
  isPackaging: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
