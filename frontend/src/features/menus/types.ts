import type { Ingredient } from '../ingredients/types';

export interface RecipeItem {
  id: string;
  menuId: string;
  ingredientId: string;
  quantity: number;
  lessSugarQuantity?: number | null;
  unit: string;
  optional?: boolean;
  canExcludeForPersonalUse?: boolean;
  ingredient?: Ingredient;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category?: 'MAIN' | 'ADDITIONAL';
  active: boolean;
  recipes?: RecipeItem[];
  defaultSellingPrice?: number;
  hpp?: number;
}
