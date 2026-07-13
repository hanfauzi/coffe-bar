import { ExpensesService } from './expenses.service';
export declare class ExpensesController {
    private service;
    constructor(service: ExpensesService);
    findAll(): Promise<{
        id: string;
        date: Date;
        supplier: string;
        notes: string | null;
        totalCost: number;
        items: {
            id: string;
            expenseId: string;
            ingredientId: string;
            quantity: number;
            unitCost: number;
            ingredient: {
                name: string;
                unit: string;
            };
        }[];
    }[]>;
    create(body: any): Promise<{
        id: string;
        date: Date;
        supplier: string;
        notes: string | null;
        totalCost: number;
        items: {
            id: string;
            expenseId: string;
            ingredientId: string;
            quantity: number;
            unitCost: number;
            ingredient: {
                name: string;
                unit: string;
            };
        }[];
    } | null>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        date: Date;
        supplier: string;
        totalAmount: import("@prisma/client-runtime-utils").Decimal;
    }>;
}
