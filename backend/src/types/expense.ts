import { Ingredient } from './ingredient';

export interface ExpenseItem {
  id: string;
  expenseId: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  totalPrice: number;
  unitCostSnapshot: number;
  ingredient?: Ingredient;
}

export interface Expense {
  id: string;
  date: Date;
  supplier: string;
  notes: string | null;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  items?: ExpenseItem[];
}
