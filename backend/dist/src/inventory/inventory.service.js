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
var InventoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const fifo_inventory_helper_1 = require("./fifo-inventory.helper");
let InventoryService = InventoryService_1 = class InventoryService {
    prisma;
    logger = new common_1.Logger(InventoryService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTransactions(ingredientId) {
        try {
            const where = ingredientId ? { ingredientId } : {};
            return await this.prisma.inventoryTransaction.findMany({
                where,
                include: {
                    ingredient: {
                        select: { name: true, unit: true, category: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 200,
            });
        }
        catch (error) {
            this.logger.error(`Gagal mendapatkan transaksi inventaris: ${error.message}`, error.stack);
            throw error;
        }
    }
    async adjustStock(body) {
        const { ingredientId, quantityChange, type, notes } = body;
        if (!ingredientId || quantityChange === undefined) {
            this.logger.warn('Gagal menyesuaikan stok: ID bahan baku atau jumlah perubahan kosong');
            throw new common_1.BadRequestException('ingredientId and quantityChange are required');
        }
        const change = Number(quantityChange);
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const ingredient = await tx.ingredient.findUnique({ where: { id: ingredientId } });
                if (!ingredient) {
                    this.logger.warn(`Gagal menyesuaikan stok: bahan baku ID "${ingredientId}" tidak ditemukan`);
                    throw new common_1.NotFoundException('Bahan baku tidak ditemukan');
                }
                const updated = await tx.ingredient.update({
                    where: { id: ingredientId },
                    data: {
                        currentStock: {
                            increment: change,
                        },
                    },
                });
                let costSnapshot = Number(ingredient.latestUnitCost) || 0;
                if (change > 0) {
                    await (0, fifo_inventory_helper_1.addStockBatch)(tx, ingredientId, change, costSnapshot);
                }
                else if (change < 0) {
                    const { weightedUnitCost } = await (0, fifo_inventory_helper_1.consumeStockFIFO)(tx, ingredientId, Math.abs(change));
                    costSnapshot = weightedUnitCost;
                }
                await tx.inventoryTransaction.create({
                    data: {
                        ingredientId,
                        type: type || 'MANUAL_ADJUSTMENT',
                        quantityChange: change,
                        unit: ingredient.unit,
                        unitCostSnapshot: costSnapshot,
                        referenceType: 'MANUAL',
                        notes: notes || 'Penyesuaian stok manual',
                    },
                });
                return updated;
            });
            this.logger.log(`Penyesuaian stok berhasil: ID Bahan=${ingredientId}, Perubahan=${change}, Jenis=${type || 'MANUAL_ADJUSTMENT'}`);
            return result;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.BadRequestException)
                throw error;
            this.logger.error(`Gagal menyesuaikan stok bahan ID "${ingredientId}": ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = InventoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map