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
var PersonalCupsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalCupsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const fifo_inventory_helper_1 = require("../inventory/fifo-inventory.helper");
let PersonalCupsService = PersonalCupsService_1 = class PersonalCupsService {
    prisma;
    logger = new common_1.Logger(PersonalCupsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        try {
            return await this.prisma.personalConsumption.findMany({
                include: {
                    menu: {
                        select: { name: true },
                    },
                },
                orderBy: { date: 'desc' },
            });
        }
        catch (error) {
            this.logger.error(`Gagal mendapatkan log konsumsi pribadi: ${error.message}`, error.stack);
            throw error;
        }
    }
    async create(body) {
        const { menuId, useCup, notes, date } = body;
        if (!menuId) {
            this.logger.warn('Gagal mencatat konsumsi pribadi: menuId kosong');
            throw new common_1.BadRequestException('menuId is required');
        }
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const menu = await tx.menu.findUnique({
                    where: { id: menuId },
                    include: { recipes: { include: { ingredient: true } } },
                });
                if (!menu) {
                    this.logger.warn(`Gagal mencatat konsumsi pribadi: menu ID "${menuId}" tidak ditemukan`);
                    throw new common_1.NotFoundException('Menu tidak ditemukan');
                }
                let estimatedCost = 0;
                const ingredientsToConsume = [];
                for (const r of menu.recipes) {
                    const shouldSkip = !Boolean(useCup) && r.canExcludeForPersonalUse;
                    if (shouldSkip)
                        continue;
                    ingredientsToConsume.push({
                        ingredientId: r.ingredientId,
                        qty: Number(r.quantity),
                        unit: r.unit,
                        name: r.ingredient.name,
                    });
                }
                const consumption = await tx.personalConsumption.create({
                    data: {
                        menuId,
                        useCup: Boolean(useCup),
                        estimatedCost: 0,
                        notes,
                        date: date ? new Date(date) : new Date(),
                    },
                });
                for (const ing of ingredientsToConsume) {
                    const { totalCost, weightedUnitCost } = await (0, fifo_inventory_helper_1.consumeStockFIFO)(tx, ing.ingredientId, ing.qty);
                    estimatedCost += totalCost;
                    await tx.ingredient.update({
                        where: { id: ing.ingredientId },
                        data: {
                            currentStock: {
                                decrement: ing.qty,
                            },
                        },
                    });
                    await tx.inventoryTransaction.create({
                        data: {
                            ingredientId: ing.ingredientId,
                            type: 'PERSONAL_USAGE',
                            quantityChange: -ing.qty,
                            unit: ing.unit,
                            unitCostSnapshot: weightedUnitCost,
                            referenceType: 'PERSONAL_CUP',
                            referenceId: consumption.id,
                            notes: `Konsumsi pribadi (${menu.name}) (ID: ${consumption.id.slice(0, 8)})`,
                        },
                    });
                }
                return tx.personalConsumption.update({
                    where: { id: consumption.id },
                    data: { estimatedCost },
                });
            });
            this.logger.log(`Konsumsi pribadi berhasil dicatat: ID=${result.id}, Menu ID=${menuId}, HPP=${result.estimatedCost}`);
            return result;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.BadRequestException)
                throw error;
            this.logger.error(`Gagal mencatat konsumsi pribadi untuk menu ID "${menuId}": ${error.message}`, error.stack);
            throw error;
        }
    }
    async delete(id) {
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const consumption = await tx.personalConsumption.findUnique({
                    where: { id },
                });
                if (!consumption) {
                    this.logger.warn(`Gagal menghapus log konsumsi pribadi: ID "${id}" tidak ditemukan`);
                    throw new common_1.NotFoundException('Log konsumsi pribadi tidak ditemukan');
                }
                const invTransactions = await tx.inventoryTransaction.findMany({
                    where: {
                        referenceType: 'PERSONAL_CUP',
                        referenceId: consumption.id,
                        quantityChange: { lt: 0 },
                    },
                });
                for (const t of invTransactions) {
                    const qtyToRestore = Math.abs(Number(t.quantityChange));
                    const unitCostSnapshot = Number(t.unitCostSnapshot);
                    await (0, fifo_inventory_helper_1.restoreStockFIFO)(tx, t.ingredientId, qtyToRestore, unitCostSnapshot);
                    await tx.ingredient.update({
                        where: { id: t.ingredientId },
                        data: {
                            currentStock: {
                                increment: qtyToRestore,
                            },
                        },
                    });
                    await tx.inventoryTransaction.create({
                        data: {
                            ingredientId: t.ingredientId,
                            type: 'MANUAL_ADJUSTMENT',
                            quantityChange: qtyToRestore,
                            unit: t.unit,
                            unitCostSnapshot: unitCostSnapshot,
                            referenceType: 'PERSONAL_CUP',
                            referenceId: consumption.id,
                            notes: `Restorasi stok dari pembatalan konsumsi pribadi (ID: ${consumption.id.slice(0, 8)})`,
                        },
                    });
                }
                return tx.personalConsumption.delete({ where: { id } });
            });
            this.logger.log(`Log konsumsi pribadi berhasil dihapus: ID=${id}`);
            return result;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.error(`Gagal menghapus log konsumsi pribadi ID "${id}": ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.PersonalCupsService = PersonalCupsService;
exports.PersonalCupsService = PersonalCupsService = PersonalCupsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PersonalCupsService);
//# sourceMappingURL=personal-cups.service.js.map