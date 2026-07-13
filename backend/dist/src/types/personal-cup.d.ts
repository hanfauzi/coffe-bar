import { MenuItem } from './menu';
export interface PersonalConsumption {
    id: string;
    date: Date;
    menuId: string;
    estimatedCost: number;
    useCup: boolean;
    notes: string | null;
    createdAt: Date;
    menu?: MenuItem;
}
