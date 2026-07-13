import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { consumeStockFIFO, restoreStockFIFO } from '../inventory/fifo-inventory.helper';

@Injectable()
export class PersonalCupsService {
  private readonly logger = new Logger(PersonalCupsService.name);

  constructor(private prisma: PrismaService) {}

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
    } catch (error: any) {
      this.logger.error(`Gagal mendapatkan log konsumsi pribadi: ${error.message}`, error.stack);
      throw error;
    }
  }

  async create(body: any) {
    const { menuId, useCup, notes, date } = body;
    if (!menuId) {
      this.logger.warn('Gagal mencatat konsumsi pribadi: menuId kosong');
      throw new BadRequestException('menuId is required');
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const menu = await tx.menu.findUnique({
          where: { id: menuId },
          include: { recipes: { include: { ingredient: true } } },
        });

        if (!menu) {
          this.logger.warn(`Gagal mencatat konsumsi pribadi: menu ID "${menuId}" tidak ditemukan`);
          throw new NotFoundException('Menu tidak ditemukan');
        }

        let estimatedCost = 0;
        const ingredientsToConsume: { ingredientId: string; qty: number; unit: string; name: string }[] = [];

        for (const r of menu.recipes) {
          const shouldSkip = !Boolean(useCup) && r.canExcludeForPersonalUse;
          if (shouldSkip) continue;

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
          const { totalCost, weightedUnitCost } = await consumeStockFIFO(tx, ing.ingredientId, ing.qty);
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
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(`Gagal mencatat konsumsi pribadi untuk menu ID "${menuId}": ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const consumption = await tx.personalConsumption.findUnique({
          where: { id },
        });

        if (!consumption) {
          this.logger.warn(`Gagal menghapus log konsumsi pribadi: ID "${id}" tidak ditemukan`);
          throw new NotFoundException('Log konsumsi pribadi tidak ditemukan');
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

          await restoreStockFIFO(tx, t.ingredientId, qtyToRestore, unitCostSnapshot);

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
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Gagal menghapus log konsumsi pribadi ID "${id}": ${error.message}`, error.stack);
      throw error;
    }
  }
}
