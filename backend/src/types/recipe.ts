import { Ingredient } from './ingredient';

export interface RecipeItem {
  id: string;
  menuId: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  optional: boolean;
  canExcludeForPersonalUse: boolean;
  ingredient?: Ingredient;
}
