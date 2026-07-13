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
var OrdersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const fifo_inventory_helper_1 = require("../inventory/fifo-inventory.helper");
let OrdersService = OrdersService_1 = class OrdersService {
    prisma;
    logger = new common_1.Logger(OrdersService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async updateReservations(tx, orderId) {
        await tx.stockReservation.deleteMany({
            where: { orderId }
        });
        const order = await tx.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        menu: {
                            include: {
                                recipes: {
                                    include: { ingredient: true }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!order)
            return;
        if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
            return;
        }
        const requirements = {};
        const parentItems = order.items.filter((item) => !item.parentItemId);
        for (const parent of parentItems) {
            const qty = Number(parent.quantity);
            const excludedIds = parent.excludedIngredients || [];
            const sugarLevel = parent.sugarLevel || 'NORMAL';
            if (parent.menuId && parent.menu) {
                for (const r of parent.menu.recipes) {
                    if (excludedIds.includes(r.ingredientId))
                        continue;
                    let qtyUsed = Number(r.quantity);
                    if (r.ingredient.name.toLowerCase().includes('gula') && sugarLevel === 'LESS') {
                        if (r.lessSugarQuantity !== null && r.lessSugarQuantity !== undefined) {
                            qtyUsed = Number(r.lessSugarQuantity);
                        }
                        else {
                            const nameLower = parent.menu.name.toLowerCase();
                            if (nameLower.includes('kopi susu') || nameLower.includes('kopsus')) {
                                qtyUsed = 10;
                            }
                            else if (nameLower.includes('hazelnut') || nameLower.includes('pandan')) {
                                qtyUsed = 5;
                            }
                        }
                    }
                    const totalNeeded = qtyUsed * qty;
                    requirements[r.ingredientId] = (requirements[r.ingredientId] || 0) + totalNeeded;
                }
            }
            const itemExtras = order.items.filter((item) => item.parentItemId === parent.id);
            for (const extra of itemExtras) {
                const extraQty = Number(extra.quantity);
                if (extra.menuId && extra.menu) {
                    for (const r of extra.menu.recipes) {
                        const totalNeeded = Number(r.quantity) * extraQty;
                        requirements[r.ingredientId] = (requirements[r.ingredientId] || 0) + totalNeeded;
                    }
                }
            }
        }
        for (const [ingredientId, quantity] of Object.entries(requirements)) {
            if (quantity > 0) {
                await tx.stockReservation.create({
                    data: {
                        orderId,
                        ingredientId,
                        quantity,
                    }
                });
            }
        }
    }
    async findAll() {
        try {
            return await this.prisma.order.findMany({
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
                orderBy: { orderDate: 'desc' },
            });
        }
        catch (error) {
            this.logger.error(`Gagal mendapatkan daftar pesanan: ${error.message}`, error.stack);
            throw error;
        }
    }
    async findOne(id) {
        try {
            const order = await this.prisma.order.findUnique({
                where: { id },
                include: {
                    items: {
                        include: {
                            menu: {
                                include: {
                                    recipes: {
                                        include: { ingredient: true },
                                    },
                                },
                            },
                            extras: {
                                include: {
                                    menu: {
                                        include: {
                                            recipes: {
                                                include: { ingredient: true },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            if (!order) {
                this.logger.warn(`Pesanan dengan ID "${id}" tidak ditemukan`);
                throw new common_1.NotFoundException('Pesanan tidak ditemukan');
            }
            return order;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.error(`Gagal mencari pesanan ID "${id}": ${error.message}`, error.stack);
            throw error;
        }
    }
    async create(body) {
        const { orderDate, customerName, notes, items } = body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            this.logger.warn('Gagal mencatat pesanan: daftar item pesanan kosong');
            throw new common_1.BadRequestException('Items must be a non-empty array');
        }
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const order = await tx.order.create({
                    data: {
                        orderDate: orderDate ? new Date(orderDate) : new Date(),
                        customerName,
                        status: 'PENDING',
                        notes,
                    },
                });
                const itemMap = new Map();
                for (const item of items) {
                    if (!item.parentItemId) {
                        const qty = Number(item.quantity);
                        const unitPrice = Number(item.unitPrice);
                        const customPrice = item.customPrice !== undefined && item.customPrice !== null ? Number(item.customPrice) : null;
                        const finalUnitPrice = customPrice !== null ? customPrice : unitPrice;
                        const finalPrice = qty * finalUnitPrice;
                        const created = await tx.orderItem.create({
                            data: {
                                orderId: order.id,
                                menuId: item.menuId || null,
                                quantity: qty,
                                unitPrice,
                                customPrice,
                                finalPrice,
                                notes: item.notes || null,
                                excludedIngredients: item.excludedIngredients || [],
                                sugarLevel: item.sugarLevel || 'NORMAL',
                            },
                        });
                        itemMap.set(item.id, created.id);
                    }
                }
                for (const item of items) {
                    if (item.parentItemId) {
                        const parentDbId = itemMap.get(item.parentItemId);
                        if (parentDbId) {
                            const qty = Number(item.quantity);
                            const unitPrice = Number(item.unitPrice);
                            const finalPrice = qty * unitPrice;
                            await tx.orderItem.create({
                                data: {
                                    orderId: order.id,
                                    menuId: item.menuId || null,
                                    quantity: qty,
                                    unitPrice,
                                    customPrice: null,
                                    finalPrice,
                                    notes: item.notes || null,
                                    parentItemId: parentDbId,
                                    excludedIngredients: [],
                                },
                            });
                        }
                    }
                }
                await this.updateReservations(tx, order.id);
                return tx.order.findUnique({
                    where: { id: order.id },
                    include: { items: true },
                });
            });
            this.logger.log(`Pesanan berhasil dicatat: ID=${result?.id}, Pelanggan="${customerName}"`);
            return result;
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException)
                throw error;
            this.logger.error(`Gagal membuat pesanan untuk "${customerName}": ${error.message}`, error.stack);
            throw error;
        }
    }
    async delete(id) {
        try {
            const order = await this.prisma.order.findUnique({ where: { id } });
            if (!order) {
                this.logger.warn(`Gagal menghapus pesanan: ID "${id}" tidak ditemukan`);
                throw new common_1.NotFoundException('Pesanan tidak ditemukan');
            }
            const deleted = await this.prisma.order.delete({ where: { id } });
            this.logger.log(`Pesanan berhasil dihapus/dibatalkan: ID=${id}`);
            return deleted;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.error(`Gagal menghapus pesanan ID "${id}": ${error.message}`, error.stack);
            throw error;
        }
    }
    async complete(id, body) {
        const paymentMethod = body?.paymentMethod || 'Cash';
        const paymentStatus = body?.paymentStatus || 'LUNAS';
        const resolvedAt = body?.resolvedAt ? new Date(body.resolvedAt) : new Date();
        const completionNotes = body?.notes || '';
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const order = await tx.order.findUnique({
                    where: { id },
                    include: {
                        items: {
                            include: {
                                menu: {
                                    include: {
                                        recipes: {
                                            include: { ingredient: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
                if (!order) {
                    this.logger.warn(`Gagal menyelesaikan pesanan: ID "${id}" tidak ditemukan`);
                    throw new common_1.NotFoundException('Pesanan tidak ditemukan');
                }
                if (order.status === 'COMPLETED') {
                    this.logger.warn(`Gagal menyelesaikan pesanan ID "${id}": Sudah completed (idempotency check)`);
                    throw new common_1.BadRequestException('Pesanan sudah diselesaikan');
                }
                if (order.status === 'CANCELLED') {
                    this.logger.warn(`Gagal menyelesaikan pesanan ID "${id}": Sudah dibatalkan`);
                    throw new common_1.BadRequestException('Pesanan sudah dibatalkan');
                }
                let totalRevenue = 0;
                let totalHpp = 0;
                const saleItemsToCreate = [];
                const parentItems = order.items.filter(item => !item.parentItemId);
                for (const parent of parentItems) {
                    const qty = Number(parent.quantity);
                    const finalPrice = Number(parent.finalPrice);
                    totalRevenue += finalPrice;
                    const excludedIds = parent.excludedIngredients || [];
                    const sugarLevel = parent.sugarLevel || 'NORMAL';
                    const ingredientsUsed = [];
                    if (parent.menuId && parent.menu) {
                        for (const r of parent.menu.recipes) {
                            if (excludedIds.includes(r.ingredientId))
                                continue;
                            let qtyUsed = Number(r.quantity);
                            if (r.ingredient.name.toLowerCase().includes('gula') && sugarLevel === 'LESS') {
                                if (r.lessSugarQuantity !== null && r.lessSugarQuantity !== undefined) {
                                    qtyUsed = Number(r.lessSugarQuantity);
                                }
                                else {
                                    const nameLower = parent.menu.name.toLowerCase();
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
                    const itemExtras = order.items.filter(item => item.parentItemId === parent.id);
                    for (const extra of itemExtras) {
                        const extraQty = Number(extra.quantity);
                        const extraFinalPrice = Number(extra.finalPrice);
                        totalRevenue += extraFinalPrice;
                        let extraHpp = 0;
                        const extraIngredientsUsed = [];
                        const extraOrderInfo = order.items.find(item => item.id === extra.id);
                        if (extra.menuId && extraOrderInfo && extraOrderInfo.menu) {
                            for (const r of extraOrderInfo.menu.recipes) {
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
                            notes: extra.notes,
                            unitPrice: Number(extra.unitPrice),
                            customPrice: null,
                            finalPrice: extraFinalPrice,
                            hppSnapshot: extraQty > 0 ? extraHpp / extraQty : 0,
                            transactions: extraTransactions,
                        });
                    }
                    saleItemsToCreate.push({
                        menuId: parent.menuId,
                        quantity: qty,
                        unitPrice: Number(parent.unitPrice),
                        customPrice: parent.customPrice !== null ? Number(parent.customPrice) : null,
                        finalPrice,
                        hppSnapshot: qty > 0 ? parentHpp / qty : 0,
                        notes: parent.notes,
                        excludedIngredients: excludedIds,
                        sugarLevel,
                        extras: extrasToProcess,
                        parentTransactions,
                    });
                }
                const grossProfit = totalRevenue - totalHpp;
                const sale = await tx.sale.create({
                    data: {
                        saleDate: resolvedAt,
                        totalRevenue,
                        totalHpp,
                        grossProfit,
                        notes: `Konversi dari pesanan ${order.customerName || ''} (Order ID: ${order.id.slice(0, 8)})${completionNotes ? ' - ' + completionNotes : ''}`.trim(),
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
                await tx.stockReservation.deleteMany({
                    where: { orderId: id }
                });
                await tx.order.update({
                    where: { id },
                    data: {
                        status: 'COMPLETED',
                        paymentMethod,
                        paymentStatus,
                        resolvedAt,
                        notes: order.notes ? `${order.notes}\n[Selesai: ${completionNotes}]` : completionNotes || null,
                    },
                });
                return {
                    orderId: order.id,
                    status: 'COMPLETED',
                    saleId: sale.id,
                };
            });
            this.logger.log(`Pesanan berhasil diselesaikan dan dikonversi ke penjualan: ID=${id}, Sale ID=${result.saleId}`);
            return result;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.BadRequestException)
                throw error;
            this.logger.error(`Gagal menyelesaikan pesanan ID "${id}": ${error.message}`, error.stack);
            throw error;
        }
    }
    async update(id, body) {
        const { orderDate, customerName, notes, items } = body;
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const existingOrder = await tx.order.findUnique({ where: { id } });
                if (!existingOrder) {
                    this.logger.warn(`Gagal memperbarui pesanan: ID "${id}" tidak ditemukan`);
                    throw new common_1.NotFoundException('Pesanan tidak ditemukan');
                }
                if (existingOrder.status !== 'PENDING') {
                    this.logger.warn(`Gagal memperbarui pesanan ID "${id}": Status saat ini ${existingOrder.status}`);
                    throw new common_1.BadRequestException('Pesanan yang sudah selesai atau dibatalkan tidak bisa diubah');
                }
                await tx.orderItem.deleteMany({
                    where: { orderId: id }
                });
                await tx.order.update({
                    where: { id },
                    data: {
                        orderDate: orderDate ? new Date(orderDate) : existingOrder.orderDate,
                        customerName: customerName !== undefined ? customerName : existingOrder.customerName,
                        notes: notes !== undefined ? notes : existingOrder.notes,
                    }
                });
                for (const item of items) {
                    const qty = Number(item.quantity);
                    const unitPrice = Number(item.unitPrice);
                    const customPrice = item.customPrice !== undefined && item.customPrice !== null ? Number(item.customPrice) : null;
                    const finalUnitPrice = customPrice !== null ? customPrice : unitPrice;
                    const finalPrice = qty * finalUnitPrice;
                    const createdParentItem = await tx.orderItem.create({
                        data: {
                            orderId: id,
                            menuId: item.menuId || null,
                            quantity: qty,
                            unitPrice,
                            customPrice,
                            finalPrice,
                            notes: item.notes || null,
                            excludedIngredients: item.excludedIngredients || [],
                            sugarLevel: item.sugarLevel || 'NORMAL',
                        },
                    });
                    if (item.extras && item.extras.length > 0) {
                        for (const extra of item.extras) {
                            const extraQty = Number(extra.quantity);
                            const extraUnitPrice = Number(extra.unitPrice);
                            const extraFinalPrice = extraQty * extraUnitPrice;
                            await tx.orderItem.create({
                                data: {
                                    orderId: id,
                                    menuId: extra.menuId,
                                    quantity: extraQty,
                                    unitPrice: extraUnitPrice,
                                    customPrice: null,
                                    finalPrice: extraFinalPrice,
                                    notes: extra.notes || null,
                                    parentItemId: createdParentItem.id,
                                    excludedIngredients: [],
                                },
                            });
                        }
                    }
                }
                await this.updateReservations(tx, id);
                return tx.order.findUnique({
                    where: { id },
                    include: { items: true },
                });
            });
            this.logger.log(`Pesanan berhasil diperbarui: ID=${id}`);
            return result;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.BadRequestException)
                throw error;
            this.logger.error(`Gagal memperbarui pesanan ID "${id}": ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = OrdersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map