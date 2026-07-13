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
var IngredientsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngredientsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let IngredientsService = IngredientsService_1 = class IngredientsService {
    prisma;
    logger = new common_1.Logger(IngredientsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        try {
            const list = await this.prisma.ingredient.findMany({
                include: {
                    reservations: true,
                },
                orderBy: { name: 'asc' },
            });
            return list.map((ing) => {
                const reservedStock = ing.reservations.reduce((sum, res) => sum + Number(res.quantity), 0);
                const current = Number(ing.currentStock);
                const availableStock = current - reservedStock;
                return {
                    ...ing,
                    currentStock: current,
                    minimumStock: Number(ing.minimumStock),
                    safetyStock: Number(ing.safetyStock),
                    latestUnitCost: Number(ing.latestUnitCost),
                    reservedStock,
                    availableStock,
                };
            });
        }
        catch (error) {
            this.logger.error(`Gagal mendapatkan daftar bahan baku: ${error.message}`, error.stack);
            throw error;
        }
    }
    async findOne(id) {
        try {
            const ing = await this.prisma.ingredient.findUnique({
                where: { id },
                include: {
                    reservations: true,
                },
            });
            if (!ing) {
                this.logger.warn(`Bahan baku dengan ID "${id}" tidak ditemukan`);
                throw new common_1.NotFoundException('Bahan baku tidak ditemukan');
            }
            const reservedStock = ing.reservations.reduce((sum, res) => sum + Number(res.quantity), 0);
            const current = Number(ing.currentStock);
            const availableStock = current - reservedStock;
            return {
                ...ing,
                currentStock: current,
                minimumStock: Number(ing.minimumStock),
                safetyStock: Number(ing.safetyStock),
                latestUnitCost: Number(ing.latestUnitCost),
                reservedStock,
                availableStock,
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.error(`Gagal mencari bahan baku ID "${id}": ${error.message}`, error.stack);
            throw error;
        }
    }
    async create(body) {
        const { name, category, currentStock, unit, minimumStock, safetyStock, latestUnitCost, isPackaging } = body;
        if (!name || !unit) {
            this.logger.warn('Gagal membuat bahan baku: nama atau satuan kosong');
            throw new common_1.BadRequestException('Name and unit are required');
        }
        const cat = category || 'RAW_MATERIAL';
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const ingredient = await tx.ingredient.create({
                    data: {
                        name,
                        category: cat,
                        currentStock: Number(currentStock) || 0,
                        unit,
                        minimumStock: Number(minimumStock) || 0,
                        safetyStock: Number(safetyStock) || 0,
                        latestUnitCost: Number(latestUnitCost) || 0,
                        isPackaging: Boolean(isPackaging) || cat === 'PACKAGING',
                        isActive: true,
                    },
                });
                if (Number(currentStock) > 0) {
                    await tx.inventoryTransaction.create({
                        data: {
                            ingredientId: ingredient.id,
                            type: 'MANUAL_ADJUSTMENT',
                            quantityChange: Number(currentStock),
                            unit: ingredient.unit,
                            shadowCost: undefined,
                            unitCostSnapshot: Number(latestUnitCost) || 0,
                            referenceType: 'MANUAL',
                            notes: 'Setup stok awal bahan baku',
                        },
                    });
                }
                return ingredient;
            });
            this.logger.log(`Bahan baku baru berhasil disimpan: ID=${result.id}, Nama="${name}"`);
            return result;
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException)
                throw error;
            this.logger.error(`Gagal membuat bahan baku "${name}": ${error.message}`, error.stack);
            throw error;
        }
    }
    async update(id, body) {
        try {
            const item = await this.prisma.ingredient.findUnique({ where: { id } });
            if (!item) {
                this.logger.warn(`Gagal memperbarui: bahan baku ID "${id}" tidak ditemukan`);
                throw new common_1.NotFoundException('Bahan baku tidak ditemukan');
            }
            const { name, category, unit, minimumStock, safetyStock, isPackaging, isActive } = body;
            const updated = await this.prisma.ingredient.update({
                where: { id },
                data: {
                    name,
                    category,
                    unit,
                    minimumStock: minimumStock !== undefined ? Number(minimumStock) : undefined,
                    safetyStock: safetyStock !== undefined ? Number(safetyStock) : undefined,
                    isPackaging: isPackaging !== undefined ? Boolean(isPackaging) : undefined,
                    isActive: isActive !== undefined ? Boolean(isActive) : undefined,
                },
            });
            this.logger.log(`Bahan baku berhasil diperbarui: ID=${id}, Nama="${updated.name}"`);
            return updated;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.error(`Gagal memperbarui bahan baku ID "${id}": ${error.message}`, error.stack);
            throw error;
        }
    }
    async delete(id) {
        try {
            const item = await this.prisma.ingredient.findUnique({ where: { id } });
            if (!item) {
                this.logger.warn(`Gagal menghapus: bahan baku ID "${id}" tidak ditemukan`);
                throw new common_1.NotFoundException('Bahan baku tidak ditemukan');
            }
            const deleted = await this.prisma.ingredient.delete({ where: { id } });
            this.logger.log(`Bahan baku berhasil dihapus: ID=${id}, Nama="${deleted.name}"`);
            return deleted;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.error(`Gagal menghapus bahan baku ID "${id}": ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.IngredientsService = IngredientsService;
exports.IngredientsService = IngredientsService = IngredientsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IngredientsService);
//# sourceMappingURL=ingredients.service.js.map