import { PrismaService } from '../prisma.service';
export declare class OrdersService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    updateReservations(tx: any, orderId: string): Promise<void>;
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
                orderId: string;
                quantity: import("@prisma/client-runtime-utils").Decimal;
                notes: string | null;
                menuId: string | null;
                unitPrice: import("@prisma/client-runtime-utils").Decimal;
                customPrice: import("@prisma/client-runtime-utils").Decimal | null;
                finalPrice: import("@prisma/client-runtime-utils").Decimal;
                excludedIngredients: string[];
                sugarLevel: string;
                parentItemId: string | null;
            })[];
        } & {
            id: string;
            orderId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            notes: string | null;
            menuId: string | null;
            unitPrice: import("@prisma/client-runtime-utils").Decimal;
            customPrice: import("@prisma/client-runtime-utils").Decimal | null;
            finalPrice: import("@prisma/client-runtime-utils").Decimal;
            excludedIngredients: string[];
            sugarLevel: string;
            parentItemId: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        orderDate: Date;
        customerName: string | null;
        status: string;
        paymentMethod: string | null;
        paymentStatus: string;
        resolvedAt: Date | null;
    })[]>;
    findOne(id: string): Promise<{
        items: ({
            menu: ({
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
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                category: string;
                defaultSellingPrice: import("@prisma/client-runtime-utils").Decimal;
                active: boolean;
            }) | null;
            extras: ({
                menu: ({
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
                } & {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    category: string;
                    defaultSellingPrice: import("@prisma/client-runtime-utils").Decimal;
                    active: boolean;
                }) | null;
            } & {
                id: string;
                orderId: string;
                quantity: import("@prisma/client-runtime-utils").Decimal;
                notes: string | null;
                menuId: string | null;
                unitPrice: import("@prisma/client-runtime-utils").Decimal;
                customPrice: import("@prisma/client-runtime-utils").Decimal | null;
                finalPrice: import("@prisma/client-runtime-utils").Decimal;
                excludedIngredients: string[];
                sugarLevel: string;
                parentItemId: string | null;
            })[];
        } & {
            id: string;
            orderId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            notes: string | null;
            menuId: string | null;
            unitPrice: import("@prisma/client-runtime-utils").Decimal;
            customPrice: import("@prisma/client-runtime-utils").Decimal | null;
            finalPrice: import("@prisma/client-runtime-utils").Decimal;
            excludedIngredients: string[];
            sugarLevel: string;
            parentItemId: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        orderDate: Date;
        customerName: string | null;
        status: string;
        paymentMethod: string | null;
        paymentStatus: string;
        resolvedAt: Date | null;
    }>;
    create(body: any): Promise<({
        items: {
            id: string;
            orderId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            notes: string | null;
            menuId: string | null;
            unitPrice: import("@prisma/client-runtime-utils").Decimal;
            customPrice: import("@prisma/client-runtime-utils").Decimal | null;
            finalPrice: import("@prisma/client-runtime-utils").Decimal;
            excludedIngredients: string[];
            sugarLevel: string;
            parentItemId: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        orderDate: Date;
        customerName: string | null;
        status: string;
        paymentMethod: string | null;
        paymentStatus: string;
        resolvedAt: Date | null;
    }) | null>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        orderDate: Date;
        customerName: string | null;
        status: string;
        paymentMethod: string | null;
        paymentStatus: string;
        resolvedAt: Date | null;
    }>;
    complete(id: string, body?: any): Promise<{
        orderId: string;
        status: string;
        saleId: string;
    }>;
    update(id: string, body: any): Promise<({
        items: {
            id: string;
            orderId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            notes: string | null;
            menuId: string | null;
            unitPrice: import("@prisma/client-runtime-utils").Decimal;
            customPrice: import("@prisma/client-runtime-utils").Decimal | null;
            finalPrice: import("@prisma/client-runtime-utils").Decimal;
            excludedIngredients: string[];
            sugarLevel: string;
            parentItemId: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        orderDate: Date;
        customerName: string | null;
        status: string;
        paymentMethod: string | null;
        paymentStatus: string;
        resolvedAt: Date | null;
    }) | null>;
}
