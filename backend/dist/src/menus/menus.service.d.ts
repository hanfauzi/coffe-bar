import { PrismaService } from '../prisma.service';
export declare class MenusService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        hpp: number;
        recipes: ({
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
        })[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        category: string;
        defaultSellingPrice: import("@prisma/client-runtime-utils").Decimal;
        active: boolean;
    }[]>;
    findOne(id: string): Promise<{
        hpp: number;
        recipes: ({
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
        })[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        category: string;
        defaultSellingPrice: import("@prisma/client-runtime-utils").Decimal;
        active: boolean;
    }>;
    create(body: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        category: string;
        defaultSellingPrice: import("@prisma/client-runtime-utils").Decimal;
        active: boolean;
    }>;
    update(id: string, body: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        category: string;
        defaultSellingPrice: import("@prisma/client-runtime-utils").Decimal;
        active: boolean;
    }>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        category: string;
        defaultSellingPrice: import("@prisma/client-runtime-utils").Decimal;
        active: boolean;
    }>;
}
