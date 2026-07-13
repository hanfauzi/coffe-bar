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
var ExpensesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpensesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const fifo_inventory_helper_1 = require("../inventory/fifo-inventory.helper");
let ExpensesService = ExpensesService_1 = class ExpensesService {
    prisma;
    logger = new common_1.Logger(ExpensesService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        try {
            const expenses = await this.prisma.expense.findMany({
                include: {
                    items: {
                        include: {
                            ingredient: { select: { name: true, unit: true } },
                        },
                    },
                },
                orderBy: { date: 'desc' },
            });
            return expenses.map((exp) => ({
                id: exp.id,
                date: exp.date,
                supplier: exp.supplier,
                notes: exp.notes,
                totalCost: Number(exp.totalAmount),
                items: exp.items.map((item) => ({
                    id: item.id,
                    expenseId: item.expenseId,
                    ingredientId: item.ingredientId,
                    quantity: Number(item.quantity),
                    unitCost: Number(item.unitCostSnapshot),
                    ingredient: {
                        name: item.ingredient.name,
                        unit: item.ingredient.unit,
                    },
                })),
            }));
        }
        catch (error) {
            this.logger.error(`Gagal mendapatkan daftar pengeluaran: ${error.message}`, error.stack);
            throw error;
        }
    }
    async create(body) {
        const { supplier, notes, items, date } = body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            this.logger.warn('Gagal membuat pengeluaran: daftar item belanja kosong');
            throw new common_1.BadRequestException('Items must be a non-empty array');
        }
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                let grandTotal = 0;
                for (const item of items) {
                    grandTotal += Number(item.totalPrice);
                }
                const expense = await tx.expense.create({
                    data: {
                        supplier: supplier || 'Supplier Umum',
                        notes,
                        totalAmount: grandTotal,
                        date: date ? new Date(date) : new Date(),
                    },
                });
                for (const item of items) {
                    const qty = Number(item.quantity);
                    const totalPrice = Number(item.totalPrice);
                    const ingredientId = item.ingredientId;
                    const latestUnitCost = qty > 0 ? totalPrice / qty : 0;
                    const expenseItem = await tx.expenseItem.create({
                        data: {
                            expenseId: expense.id,
                            ingredientId,
                            quantity: qty,
                            unit: item.unit || 'gram',
                            totalPrice,
                            unitCostSnapshot: latestUnitCost,
                        },
                    });
                    await (0, fifo_inventory_helper_1.addStockBatch)(tx, ingredientId, qty, latestUnitCost, expenseItem.id);
                    await tx.ingredient.update({
                        where: { id: ingredientId },
                        data: {
                            currentStock: {
                                increment: qty,
                            },
                            latestUnitCost: latestUnitCost,
                        },
                    });
                    await tx.inventoryTransaction.create({
                        data: {
                            ingredientId,
                            type: 'PURCHASE',
                            quantityChange: qty,
                            unit: item.unit || 'gram',
                            unitCostSnapshot: latestUnitCost,
                            referenceType: 'EXPENSE',
                            referenceId: expense.id,
                            notes: `Pembelian dari ${supplier || 'Supplier Umum'} (Exp ID: ${expense.id.slice(0, 8)})`,
                        },
                    });
                }
                const created = await tx.expense.findUnique({
                    where: { id: expense.id },
                    include: {
                        items: {
                            include: {
                                ingredient: { select: { name: true, unit: true } },
                            },
                        },
                    },
                });
                if (!created)
                    return null;
                return {
                    id: created.id,
                    date: created.date,
                    supplier: created.supplier,
                    notes: created.notes,
                    totalCost: Number(created.totalAmount),
                    items: created.items.map((item) => ({
                        id: item.id,
                        expenseId: item.expenseId,
                        ingredientId: item.ingredientId,
                        quantity: Number(item.quantity),
                        unitCost: Number(item.unitCostSnapshot),
                        ingredient: {
                            name: item.ingredient.name,
                            unit: item.ingredient.unit,
                        },
                    })),
                };
            });
            this.logger.log(`Pengeluaran berhasil dicatat: ID=${result?.id}, Supplier=${supplier || 'Supplier Umum'}, Total=${result?.totalCost}`);
            return result;
        }
        catch (error) {
            this.logger.error(`Gagal mencatat pengeluaran: ${error.message}`, error.stack);
            throw error;
        }
    }
    async delete(id) {
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const expense = await tx.expense.findUnique({
                    where: { id },
                    include: { items: true },
                });
                if (!expense) {
                    this.logger.warn(`Gagal menghapus pengeluaran: ID "${id}" tidak ditemukan`);
                    throw new common_1.NotFoundException('Pengeluaran tidak ditemukan');
                }
                for (const item of expense.items) {
                    await tx.ingredient.update({
                        where: { id: item.ingredientId },
                        data: {
                            currentStock: {
                                decrement: item.quantity,
                            },
                        },
                    });
                    await tx.ingredientBatch.deleteMany({
                        where: { expenseItemId: item.id },
                    });
                    await tx.inventoryTransaction.create({
                        data: {
                            ingredientId: item.ingredientId,
                            type: 'MANUAL_ADJUSTMENT',
                            quantityChange: -Number(item.quantity),
                            unit: item.unit,
                            unitCostSnapshot: Number(item.unitCostSnapshot),
                            referenceType: 'EXPENSE',
                            referenceId: expense.id,
                            notes: `Pembatalan/Hapus pengeluaran (Exp ID: ${expense.id.slice(0, 8)})`,
                        },
                    });
                }
                return tx.expense.delete({ where: { id } });
            });
            this.logger.log(`Pengeluaran berhasil dihapus: ID=${id}`);
            return result;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.error(`Gagal menghapus pengeluaran ID "${id}": ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.ExpensesService = ExpensesService;
exports.ExpensesService = ExpensesService = ExpensesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExpensesService);
//# sourceMappingURL=expenses.service.js.map