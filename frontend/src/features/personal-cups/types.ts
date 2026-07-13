import type { MenuItem } from '../menus/types';

export interface PersonalCup {
  id: string;
  date: string;
  menuId: string;
  quantity: number;
  useCup: boolean;
  notes?: string;
  menu?: MenuItem;
  estimatedCost?: number;
  staffName?: string | null;
}
