import { RecipeItem } from './recipe';
export interface MenuItem {
    id: string;
    name: string;
    defaultSellingPrice: number;
    category: 'MAIN' | 'ADDITIONAL' | string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    recipes?: RecipeItem[];
}
