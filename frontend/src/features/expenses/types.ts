import type { Ingredient } from '../ingredients/types';

export interface ExpenseItem {
  id: string;
  expenseId: string;
  ingredientId: string;
  quantity: number;
  unitCost: number;
  ingredient?: Ingredient;
}

export interface Expense {
  id: string;
  date: string;
  supplier?: string;
  totalCost: number;
  notes?: string;
  items: ExpenseItem[];
}
