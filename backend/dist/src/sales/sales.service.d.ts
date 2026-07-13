import { PrismaService } from '../prisma.service';
export declare class SalesService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        items: ({
            menu: {
                name: string;
                category: string;
            } | null;
            extras: ({
                menu: {
                    name: string;
                    category: string;
                } | null;
            } & {
                id: string;
                quantity: import("@prisma/client-runtime-utils").Decimal;
                notes: string | null;
                menuId: string | null;
                unitPrice: import("@prisma/client-runtime-utils").Decimal;
                customPrice: import("@prisma/client-runtime-utils").Decimal | null;
                finalPrice: import("@prisma/client-runtime-utils").Decimal;
                hppSnapshot: import("@prisma/client-runtime-utils").Decimal;
                excludedIngredients: string[];
                sugarLevel: string;
                saleId: string;
                parentItemId: string | null;
            })[];
        } & {
            id: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            notes: string | null;
            menuId: string | null;
            unitPrice: import("@prisma/client-runtime-utils").Decimal;
            customPrice: import("@prisma/client-runtime-utils").Decimal | null;
            finalPrice: import("@prisma/client-runtime-utils").Decimal;
            hppSnapshot: import("@prisma/client-runtime-utils").Decimal;
            excludedIngredients: string[];
            sugarLevel: string;
            saleId: string;
            parentItemId: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        notes: string | null;
        saleDate: Date;
        totalRevenue: import("@prisma/client-runtime-utils").Decimal;
        totalHpp: import("@prisma/client-runtime-utils").Decimal;
        grossProfit: import("@prisma/client-runtime-utils").Decimal;
    })[]>;
    create(body: any): Promise<({
        items: {
            id: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            notes: string | null;
            menuId: string | null;
            unitPrice: import("@prisma/client-runtime-utils").Decimal;
            customPrice: import("@prisma/client-runtime-utils").Decimal | null;
            finalPrice: import("@prisma/client-runtime-utils").Decimal;
            hppSnapshot: import("@prisma/client-runtime-utils").Decimal;
            excludedIngredients: string[];
            sugarLevel: string;
            saleId: string;
            parentItemId: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        notes: string | null;
        saleDate: Date;
        totalRevenue: import("@prisma/client-runtime-utils").Decimal;
        totalHpp: import("@prisma/client-runtime-utils").Decimal;
        grossProfit: import("@prisma/client-runtime-utils").Decimal;
    }) | null>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        notes: string | null;
        saleDate: Date;
        totalRevenue: import("@prisma/client-runtime-utils").Decimal;
        totalHpp: import("@prisma/client-runtime-utils").Decimal;
        grossProfit: import("@prisma/client-runtime-utils").Decimal;
    }>;
}
