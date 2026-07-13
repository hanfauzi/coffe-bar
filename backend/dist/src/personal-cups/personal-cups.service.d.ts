import { PrismaService } from '../prisma.service';
export declare class PersonalCupsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        menu: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        notes: string | null;
        date: Date;
        menuId: string;
        estimatedCost: import("@prisma/client-runtime-utils").Decimal;
        useCup: boolean;
    })[]>;
    create(body: any): Promise<{
        id: string;
        createdAt: Date;
        notes: string | null;
        date: Date;
        menuId: string;
        estimatedCost: import("@prisma/client-runtime-utils").Decimal;
        useCup: boolean;
    }>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        notes: string | null;
        date: Date;
        menuId: string;
        estimatedCost: import("@prisma/client-runtime-utils").Decimal;
        useCup: boolean;
    }>;
}
