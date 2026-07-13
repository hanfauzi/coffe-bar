import { PrismaService } from '../prisma.service';
export declare class RecipesService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findByMenu(menuId: string): Promise<({
        ingredient: {
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
        };
    } & {
        id: string;
        unit: string;
        ingredientId: string;
        quantity: import("@prisma/client-runtime-utils").Decimal;
        menuId: string;
        lessSugarQuantity: import("@prisma/client-runtime-utils").Decimal | null;
        optional: boolean;
        canExcludeForPersonalUse: boolean;
    })[]>;
    updateRecipe(menuId: string, recipes: any[]): Promise<any[]>;
}
