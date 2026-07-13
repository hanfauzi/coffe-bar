import { PersonalCupsService } from './personal-cups.service';
export declare class PersonalCupsController {
    private service;
    constructor(service: PersonalCupsService);
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
