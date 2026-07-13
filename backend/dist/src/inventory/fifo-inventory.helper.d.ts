import { Prisma } from '@prisma/client';
export interface FIFOResult {
    totalCost: number;
    weightedUnitCost: number;
}
export declare function consumeStockFIFO(tx: Prisma.TransactionClient, ingredientId: string, quantityToConsume: number): Promise<FIFOResult>;
export declare function addStockBatch(tx: Prisma.TransactionClient, ingredientId: string, quantity: number, unitCost: number, expenseItemId?: string): Promise<void>;
export declare function restoreStockFIFO(tx: Prisma.TransactionClient, ingredientId: string, quantityToRestore: number, unitCostSnapshot: number): Promise<void>;
