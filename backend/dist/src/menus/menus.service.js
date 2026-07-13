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
var MenusService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenusService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let MenusService = MenusService_1 = class MenusService {
    prisma;
    logger = new common_1.Logger(MenusService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        try {
            const menus = await this.prisma.menu.findMany({
                include: {
                    recipes: {
                        include: {
                            ingredient: true,
                        },
                    },
                },
                orderBy: { name: 'asc' },
            });
            return menus.map((menu) => {
                let hpp = 0;
                for (const recipe of menu.recipes) {
                    hpp += Number(recipe.quantity) * (Number(recipe.ingredient.latestUnitCost) || 0);
                }
                return {
                    ...menu,
                    hpp,
                };
            });
        }
        catch (error) {
            this.logger.error(`Gagal mengambil daftar menu: ${error.message}`, error.stack);
            throw error;
        }
    }
    async findOne(id) {
        try {
            const menu = await this.prisma.menu.findUnique({
                where: { id },
                include: {
                    recipes: {
                        include: {
                            ingredient: true,
                        },
                    },
                },
            });
            if (!menu) {
                this.logger.warn(`Menu dengan ID "${id}" tidak ditemukan`);
                throw new common_1.NotFoundException('Menu tidak ditemukan');
            }
            let hpp = 0;
            for (const recipe of menu.recipes) {
                hpp += Number(recipe.quantity) * (Number(recipe.ingredient.latestUnitCost) || 0);
            }
            return {
                ...menu,
                hpp,
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.error(`Gagal mengambil data menu ID "${id}": ${error.message}`, error.stack);
            throw error;
        }
    }
    async create(body) {
        const { name, defaultSellingPrice, category, recipes } = body;
        if (!name || defaultSellingPrice === undefined) {
            this.logger.warn('Gagal membuat menu: nama atau harga jual default kosong');
            throw new common_1.BadRequestException('Name and defaultSellingPrice are required');
        }
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const menu = await tx.menu.create({
                    data: {
                        name,
                        defaultSellingPrice: Number(defaultSellingPrice),
                        category: category || 'MAIN',
                        active: true,
                    },
                });
                if (recipes && recipes.length > 0) {
                    for (const r of recipes) {
                        const ing = await tx.ingredient.findUnique({ where: { id: r.ingredientId } });
                        if (!ing) {
                            this.logger.warn(`Gagal membuat resep: Bahan baku ID "${r.ingredientId}" tidak ditemukan`);
                            throw new common_1.NotFoundException(`Bahan baku ${r.ingredientId} tidak ditemukan`);
                        }
                        await tx.recipeItem.create({
                            data: {
                                menuId: menu.id,
                                ingredientId: r.ingredientId,
                                quantity: Number(r.quantity),
                                lessSugarQuantity: r.lessSugarQuantity !== undefined && r.lessSugarQuantity !== null ? Number(r.lessSugarQuantity) : null,
                                unit: r.unit || ing.unit,
                                optional: r.optional !== undefined ? Boolean(r.optional) : false,
                                canExcludeForPersonalUse: r.canExcludeForPersonalUse !== undefined ? Boolean(r.canExcludeForPersonalUse) : (ing.category === 'PACKAGING'),
                            },
                        });
                    }
                }
                return menu;
            });
            this.logger.log(`Menu baru berhasil dibuat: ID=${result.id}, Nama="${name}"`);
            return result;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.BadRequestException)
                throw error;
            this.logger.error(`Gagal membuat menu "${name}": ${error.message}`, error.stack);
            throw error;
        }
    }
    async update(id, body) {
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const checkMenu = await tx.menu.findUnique({ where: { id } });
                if (!checkMenu) {
                    this.logger.warn(`Gagal memperbarui: menu ID "${id}" tidak ditemukan`);
                    throw new common_1.NotFoundException('Menu tidak ditemukan');
                }
                const { name, defaultSellingPrice, category, active, recipes } = body;
                const menu = await tx.menu.update({
                    where: { id },
                    data: {
                        name,
                        defaultSellingPrice: defaultSellingPrice !== undefined ? Number(defaultSellingPrice) : undefined,
                        category: category !== undefined ? category : undefined,
                        active: active !== undefined ? Boolean(active) : undefined,
                    },
                });
                if (recipes !== undefined) {
                    await tx.recipeItem.deleteMany({ where: { menuId: id } });
                    for (const r of recipes) {
                        const ing = await tx.ingredient.findUnique({ where: { id: r.ingredientId } });
                        if (!ing) {
                            this.logger.warn(`Gagal memperbarui resep: Bahan baku ID "${r.ingredientId}" tidak ditemukan`);
                            throw new common_1.NotFoundException(`Bahan baku ${r.ingredientId} tidak ditemukan`);
                        }
                        await tx.recipeItem.create({
                            data: {
                                menuId: id,
                                ingredientId: r.ingredientId,
                                quantity: Number(r.quantity),
                                lessSugarQuantity: r.lessSugarQuantity !== undefined && r.lessSugarQuantity !== null ? Number(r.lessSugarQuantity) : null,
                                unit: r.unit || ing.unit,
                                optional: r.optional !== undefined ? Boolean(r.optional) : false,
                                canExcludeForPersonalUse: r.canExcludeForPersonalUse !== undefined ? Boolean(r.canExcludeForPersonalUse) : (ing.category === 'PACKAGING'),
                            },
                        });
                    }
                }
                return menu;
            });
            this.logger.log(`Menu berhasil diperbarui: ID=${id}, Nama="${result.name}"`);
            return result;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.error(`Gagal memperbarui menu ID "${id}": ${error.message}`, error.stack);
            throw error;
        }
    }
    async delete(id) {
        try {
            const checkMenu = await this.prisma.menu.findUnique({ where: { id } });
            if (!checkMenu) {
                this.logger.warn(`Gagal menghapus: menu ID "${id}" tidak ditemukan`);
                throw new common_1.NotFoundException('Menu tidak ditemukan');
            }
            const deleted = await this.prisma.menu.delete({ where: { id } });
            this.logger.log(`Menu berhasil dihapus: ID=${id}, Nama="${deleted.name}"`);
            return deleted;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.error(`Gagal menghapus menu ID "${id}": ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.MenusService = MenusService;
exports.MenusService = MenusService = MenusService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MenusService);
//# sourceMappingURL=menus.service.js.map