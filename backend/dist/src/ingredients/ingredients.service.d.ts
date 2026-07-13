import { PrismaService } from '../prisma.service';
export declare class IngredientsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        currentStock: number;
        minimumStock: number;
        safetyStock: number;
        latestUnitCost: number;
        reservedStock: number;
        availableStock: number;
        reservations: {
            id: string;
            createdAt: Date;
            orderId: string;
            ingredientId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
        }[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        category: string;
        unit: string;
        isPackaging: boolean;
        isActive: boolean;
    }[]>;
    findOne(id: string): Promise<{
        currentStock: number;
        minimumStock: number;
        safetyStock: number;
        latestUnitCost: number;
        reservedStock: number;
        availableStock: number;
        reservations: {
            id: string;
            createdAt: Date;
            orderId: string;
            ingredientId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
        }[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        category: string;
        unit: string;
        isPackaging: boolean;
        isActive: boolean;
    }>;
    create(body: any): Promise<{
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
    update(id: string, body: any): Promise<{
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
    delete(id: string): Promise<{
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
