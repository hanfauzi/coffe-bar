import { ReconciliationsService } from './reconciliations.service';
export declare class ReconciliationsController {
    private service;
    constructor(service: ReconciliationsService);
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        notes: string | null;
        date: Date;
        account: string;
        systemBalance: import("@prisma/client-runtime-utils").Decimal;
        actualBalance: import("@prisma/client-runtime-utils").Decimal;
        difference: import("@prisma/client-runtime-utils").Decimal;
        reason: string;
        adjustTransactionId: string | null;
    }[]>;
    create(body: any): Promise<{
        id: string;
        createdAt: Date;
        notes: string | null;
        date: Date;
        account: string;
        systemBalance: import("@prisma/client-runtime-utils").Decimal;
        actualBalance: import("@prisma/client-runtime-utils").Decimal;
        difference: import("@prisma/client-runtime-utils").Decimal;
        reason: string;
        adjustTransactionId: string | null;
    }>;
}
