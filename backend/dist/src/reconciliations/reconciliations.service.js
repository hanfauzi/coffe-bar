"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ReconciliationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let ReconciliationsService = ReconciliationsService_1 = class ReconciliationsService {
    prisma;
    logger = new common_1.Logger(ReconciliationsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        try {
            return await this.prisma.cashReconciliation.findMany({
                orderBy: { date: 'desc' },
            });
        }
        catch (error) {
            this.logger.error(`Gagal mendapatkan riwayat rekonsiliasi: ${error.message}`, error.stack);
            throw error;
        }
    }
    async create(body) {
        const { date, account, systemBalance, actualBalance, reason, notes, makeAdjustment } = body;
        const sysBal = Number(systemBalance);
        const actBal = Number(actualBalance);
        const difference = actBal - sysBal;
        try {
            return await this.prisma.$transaction(async (tx) => {
                let adjustTransactionId = null;
                if (makeAdjustment && difference !== 0) {
                    const adjDate = date ? new Date(date) : new Date();
                    const adjNotes = `Adjustment Rekonsiliasi Kas: ${reason || ''}. ${notes || ''} (Akun: ${account})`.trim();
                    if (difference > 0) {
                        const sale = await tx.sale.create({
                            data: {
                                saleDate: adjDate,
                                totalRevenue: difference,
                                totalHpp: 0,
                                grossProfit: difference,
                                notes: adjNotes,
                            },
                        });
                        adjustTransactionId = sale.id;
                    }
                    else {
                        const expense = await tx.expense.create({
                            data: {
                                date: adjDate,
                                supplier: 'Koreksi Kas (Rekonsiliasi)',
                                notes: adjNotes,
                                totalAmount: Math.abs(difference),
                            },
                        });
                        adjustTransactionId = expense.id;
                    }
                }
                const reconciliation = await tx.cashReconciliation.create({
                    data: {
                        date: date ? new Date(date) : new Date(),
                        account,
                        systemBalance: sysBal,
                        actualBalance: actBal,
                        difference,
                        reason: reason || 'Koreksi Kas Lainnya',
                        notes,
                        adjustTransactionId,
                    },
                });
                this.logger.log(`Rekonsiliasi kas berhasil disimpan: ID=${reconciliation.id}, Selisih=${difference}`);
                return reconciliation;
            });
        }
        catch (error) {
            this.logger.error(`Gagal mencatat rekonsiliasi: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.ReconciliationsService = ReconciliationsService;
exports.ReconciliationsService = ReconciliationsService = ReconciliationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReconciliationsService);
//# sourceMappingURL=reconciliations.service.js.map