import { PrismaService } from '../prisma.service';
export declare class InventoryService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getTransactions(ingredientId?: string): Promise<({
        ingredient: {
            name: string;
            category: string;
            unit: string;
        };
    } & {
        id: string;
        createdAt: Date;
        unit: string;
        ingredientId: string;
        type: string;
        quantityChange: import("@prisma/client-runtime-utils").Decimal;
        unitCostSnapshot: import("@prisma/client-runtime-utils").Decimal;
        referenceType: string | null;
        referenceId: string | null;
        notes: string | null;
    })[]>;
    adjustStock(body: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        category: string;
        unit: string;
        currentStock: import("@prisma/client-runtime-utils").Decimal;
        minimumStock: import("@prisma/client-runtime-utils").Decimal;
        safetyStock: import("@prisma/client-runtime-utils").Decimal;
        latestUnitCost: import("@prisma/client-runtime-utils").Decimal;
        isPackaging: boolean;
        isActive: boolean;
    }>;
}
