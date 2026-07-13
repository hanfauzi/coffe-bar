import { OrdersService } from './orders.service';
export declare class OrdersController {
    private service;
    constructor(service: OrdersService);
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
    complete(id: string, body: any): Promise<{
        orderId: string;
        status: string;
        saleId: string;
    }>;
}
