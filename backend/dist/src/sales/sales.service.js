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
var SalesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const fifo_inventory_helper_1 = require("../inventory/fifo-inventory.helper");
let SalesService = SalesService_1 = class SalesService {
    prisma;
    logger = new common_1.Logger(SalesService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        try {
            return await this.prisma.sale.findMany({
                include: {
                    items: {
                        include: {
                            menu: { select: { name: true, category: true } },
                            extras: {
                                include: {
                                    menu: { select: { name: true, category: true } },
                                },
                            },
                        },
                    },
                },
                orderBy: { saleDate: 'desc' },
            });
        }
        catch (error) {
            this.logger.error(`Gagal mendapatkan daftar penjualan: ${error.message}`, error.stack);
            throw error;
        }
    }
    async create(body) {
        const { saleDate, notes, items } = body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            this.logger.warn('Gagal mencatat penjualan: daftar item penjualan kosong');
            throw new common_1.BadRequestException('Items must be a non-empty array');
        }
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                let totalRevenue = 0;
                let totalHpp = 0;
                const saleItemsToCreate = [];
                for (const item of items) {
                    const qty = Number(item.quantity);
                    const unitPrice = Number(item.unitPrice);
                    const customPrice = item.customPrice !== undefined && item.customPrice !== null ? Number(item.customPrice) : null;
                    const finalUnitPrice = customPrice !== null ? customPrice : unitPrice;
                    const finalPrice = qty * finalUnitPrice;
                    totalRevenue += finalPrice;
                    const excludedIds = item.excludedIngredients || [];
                    const sugarLevel = item.sugarLevel || 'NORMAL';
                    const ingredientsUsed = [];
                    if (item.menuId) {
                        const menu = await tx.menu.findUnique({
                            where: { id: item.menuId },
                            include: { recipes: { include: { ingredient: true } } },
                        });
                        if (menu) {
                            for (const r of menu.recipes) {
                                if (excludedIds.includes(r.ingredientId)) {
                                    continue;
                                }
                                let qtyUsed = Number(r.quantity);
                                if (r.ingredient.name.toLowerCase().includes('gula') && sugarLevel === 'LESS') {
                                    if (r.lessSugarQuantity !== null && r.lessSugarQuantity !== undefined) {
                                        qtyUsed = Number(r.lessSugarQuantity);
                                    }
                                    else {
                                        const nameLower = menu.name.toLowerCase();
                                        if (nameLower.includes('kopi susu') || nameLower.includes('kopsus')) {
                                            qtyUsed = 10;
                                        }
                                        else if (nameLower.includes('hazelnut') || nameLower.includes('pandan')) {
                                            qtyUsed = 5;
                                        }
                                    }
                                }
                                const qtyToDeduct = qtyUsed * qty;
                                ingredientsUsed.push({
                                    ingredientId: r.ingredientId,
                                    qtyToDeduct,
                                    unit: r.unit,
                                    name: r.ingredient.name,
                                });
                            }
                        }
                    }
                    let parentHpp = 0;
                    const parentTransactions = [];
                    for (const ing of ingredientsUsed) {
                        const { totalCost, weightedUnitCost } = await (0, fifo_inventory_helper_1.consumeStockFIFO)(tx, ing.ingredientId, ing.qtyToDeduct);
                        parentHpp += totalCost;
                        await tx.ingredient.update({
                            where: { id: ing.ingredientId },
                            data: { currentStock: { decrement: ing.qtyToDeduct } },
                        });
                        parentTransactions.push({
                            ingredientId: ing.ingredientId,
                            qtyToDeduct: ing.qtyToDeduct,
                            unit: ing.unit,
                            weightedUnitCost,
                            name: ing.name,
                        });
                    }
                    totalHpp += parentHpp;
                    const extrasToProcess = [];
                    if (item.extras && item.extras.length > 0) {
                        for (const extra of item.extras) {
                            const extraQty = Number(extra.quantity);
                            const extraUnitPrice = Number(extra.unitPrice);
                            const extraFinalPrice = extraQty * extraUnitPrice;
                            totalRevenue += extraFinalPrice;
                            let extraHpp = 0;
                            const extraIngredientsUsed = [];
                            const extraMenu = await tx.menu.findUnique({
                                where: { id: extra.menuId },
                                include: { recipes: { include: { ingredient: true } } },
                            });
                            if (extraMenu) {
                                for (const r of extraMenu.recipes) {
                                    const qtyToDeduct = Number(r.quantity) * extraQty;
                                    extraIngredientsUsed.push({
                                        ingredientId: r.ingredientId,
                                        qtyToDeduct,
                                        unit: r.unit,
                                        name: r.ingredient.name,
                                    });
                                }
                            }
                            const extraTransactions = [];
                            for (const ing of extraIngredientsUsed) {
                                const { totalCost, weightedUnitCost } = await (0, fifo_inventory_helper_1.consumeStockFIFO)(tx, ing.ingredientId, ing.qtyToDeduct);
                                extraHpp += totalCost;
                                await tx.ingredient.update({
                                    where: { id: ing.ingredientId },
                                    data: { currentStock: { decrement: ing.qtyToDeduct } },
                                });
                                extraTransactions.push({
                                    ingredientId: ing.ingredientId,
                                    qtyToDeduct: ing.qtyToDeduct,
                                    unit: ing.unit,
                                    weightedUnitCost,
                                    name: ing.name,
                                });
                            }
                            totalHpp += extraHpp;
                            extrasToProcess.push({
                                menuId: extra.menuId,
                                quantity: extraQty,
                                unitPrice: extraUnitPrice,
                                customPrice: null,
                                finalPrice: extraFinalPrice,
                                hppSnapshot: extraQty > 0 ? extraHpp / extraQty : 0,
                                notes: extra.notes || null,
                                transactions: extraTransactions,
                            });
                        }
                    }
                    saleItemsToCreate.push({
                        menuId: item.menuId || null,
                        quantity: qty,
                        unitPrice,
                        customPrice,
                        finalPrice,
                        hppSnapshot: qty > 0 ? parentHpp / qty : 0,
                        notes: item.notes || null,
                        excludedIngredients: excludedIds,
                        sugarLevel: sugarLevel,
                        extras: extrasToProcess,
                        parentTransactions,
                    });
                }
                const grossProfit = totalRevenue - totalHpp;
                const sale = await tx.sale.create({
                    data: {
                        saleDate: saleDate ? new Date(saleDate) : new Date(),
                        totalRevenue,
                        totalHpp,
                        grossProfit,
                        notes,
                    },
                });
                for (const item of saleItemsToCreate) {
                    const createdParentItem = await tx.saleItem.create({
                        data: {
                            saleId: sale.id,
                            menuId: item.menuId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            customPrice: item.customPrice,
                            finalPrice: item.finalPrice,
                            hppSnapshot: item.hppSnapshot,
                            notes: item.notes,
                            excludedIngredients: item.excludedIngredients || [],
                            sugarLevel: item.sugarLevel || 'NORMAL',
                        },
                    });
                    for (const txInfo of item.parentTransactions) {
                        await tx.inventoryTransaction.create({
                            data: {
                                ingredientId: txInfo.ingredientId,
                                type: 'SALE_USAGE',
                                quantityChange: -txInfo.qtyToDeduct,
                                unit: txInfo.unit,
                                unitCostSnapshot: txInfo.weightedUnitCost,
                                referenceType: 'SALE',
                                referenceId: sale.id,
                                notes: `Penjualan ${item.quantity}x (Sale ID: ${sale.id.slice(0, 8)})`,
                            },
                        });
                    }
                    for (const extra of item.extras) {
                        await tx.saleItem.create({
                            data: {
                                saleId: sale.id,
                                menuId: extra.menuId,
                                quantity: extra.quantity,
                                unitPrice: extra.unitPrice,
                                customPrice: extra.customPrice,
                                finalPrice: extra.finalPrice,
                                hppSnapshot: extra.hppSnapshot,
                                notes: extra.notes,
                                parentItemId: createdParentItem.id,
                                excludedIngredients: [],
                            },
                        });
                        for (const txInfo of extra.transactions) {
                            await tx.inventoryTransaction.create({
                                data: {
                                    ingredientId: txInfo.ingredientId,
                                    type: 'SALE_USAGE',
                                    quantityChange: -txInfo.qtyToDeduct,
                                    unit: txInfo.unit,
                                    unitCostSnapshot: txInfo.weightedUnitCost,
                                    referenceType: 'SALE',
                                    referenceId: sale.id,
                                    notes: `Penjualan Extra ${extra.quantity}x (Sale ID: ${sale.id.slice(0, 8)})`,
                                },
                            });
                        }
                    }
                }
                return tx.sale.findUnique({
                    where: { id: sale.id },
                    include: { items: true },
                });
            });
            this.logger.log(`Transaksi penjualan berhasil dicatat: ID=${result?.id}, Total Revenue=${result?.totalRevenue}`);
            return result;
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException)
                throw error;
            this.logger.error(`Gagal mencatat transaksi penjualan: ${error.message}`, error.stack);
            throw error;
        }
    }
    async delete(id) {
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const sale = await tx.sale.findUnique({
                    where: { id },
                    include: { items: true },
                });
                if (!sale) {
                    this.logger.warn(`Gagal menghapus penjualan: ID "${id}" tidak ditemukan`);
                    throw new common_1.NotFoundException('Transaksi penjualan tidak ditemukan');
                }
                const invTransactions = await tx.inventoryTransaction.findMany({
                    where: {
                        referenceType: 'SALE',
                        referenceId: sale.id,
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
                            referenceType: 'SALE',
                            referenceId: sale.id,
                            notes: `Restorasi stok dari pembatalan penjualan (Sale ID: ${sale.id.slice(0, 8)})`,
                        },
                    });
                }
                return tx.sale.delete({ where: { id } });
            });
            this.logger.log(`Transaksi penjualan berhasil dihapus/dibatalkan: ID=${id}`);
            return result;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.error(`Gagal menghapus transaksi penjualan ID "${id}": ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = SalesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SalesService);
//# sourceMappingURL=sales.service.js.map