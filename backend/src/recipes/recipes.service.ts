import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RecipesService {
  private readonly logger = new Logger(RecipesService.name);

  constructor(private prisma: PrismaService) {}

  async findByMenu(menuId: string) {
    try {
      return await this.prisma.recipeItem.findMany({
        where: { menuId },
        include: { ingredient: true },
      });
    } catch (error: any) {
      this.logger.error(`Gagal mendapatkan resep untuk menu ID "${menuId}": ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateRecipe(menuId: string, recipes: any[]) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Delete old recipe items
        await tx.recipeItem.deleteMany({ where: { menuId } });

        const createdItems: any[] = [];
        for (const item of recipes) {
          const ing = await tx.ingredient.findUnique({ where: { id: item.ingredientId } });
          if (!ing) {
            this.logger.warn(`Gagal memperbarui resep: Bahan baku ID "${item.ingredientId}" tidak ditemukan`);
            throw new NotFoundException(`Ingredient ${item.ingredientId} not found`);
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
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Gagal memperbarui resep untuk menu ID "${menuId}": ${error.message}`, error.stack);
      throw error;
    }
  }
}
