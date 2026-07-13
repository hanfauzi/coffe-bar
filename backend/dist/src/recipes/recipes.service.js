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
var RecipesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let RecipesService = RecipesService_1 = class RecipesService {
    prisma;
    logger = new common_1.Logger(RecipesService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByMenu(menuId) {
        try {
            return await this.prisma.recipeItem.findMany({
                where: { menuId },
                include: { ingredient: true },
            });
        }
        catch (error) {
            this.logger.error(`Gagal mendapatkan resep untuk menu ID "${menuId}": ${error.message}`, error.stack);
            throw error;
        }
    }
    async updateRecipe(menuId, recipes) {
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                await tx.recipeItem.deleteMany({ where: { menuId } });
                const createdItems = [];
                for (const item of recipes) {
                    const ing = await tx.ingredient.findUnique({ where: { id: item.ingredientId } });
                    if (!ing) {
                        this.logger.warn(`Gagal memperbarui resep: Bahan baku ID "${item.ingredientId}" tidak ditemukan`);
                        throw new common_1.NotFoundException(`Ingredient ${item.ingredientId} not found`);
                    }
                    const created = await tx.recipeItem.create({
                        data: {
                            menuId,
                            ingredientId: item.ingredientId,
                            quantity: Number(item.quantity),
                            unit: item.unit || ing.unit,
                            optional: item.optional !== undefined ? Boolean(item.optional) : false,
                            canExcludeForPersonalUse: item.canExcludeForPersonalUse !== undefined ? Boolean(item.canExcludeForPersonalUse) : (ing.category === 'PACKAGING'),
                        },
                    });
                    createdItems.push(created);
                }
                return createdItems;
            });
            this.logger.log(`Resep berhasil diperbarui untuk menu ID: ${menuId}`);
            return result;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.error(`Gagal memperbarui resep untuk menu ID "${menuId}": ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.RecipesService = RecipesService;
exports.RecipesService = RecipesService = RecipesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecipesService);
//# sourceMappingURL=recipes.service.js.map