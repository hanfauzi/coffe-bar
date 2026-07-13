import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { addStockBatch, consumeStockFIFO } from './fifo-inventory.helper';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private prisma: PrismaService) {}

  async getTransactions(ingredientId?: string) {
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
    } catch (error: any) {
      this.logger.error(`Gagal mendapatkan transaksi inventaris: ${error.message}`, error.stack);
      throw error;
    }
  }

  async adjustStock(body: any) {
    const { ingredientId, quantityChange, type, notes } = body; 
    if (!ingredientId || quantityChange === undefined) {
      this.logger.warn('Gagal menyesuaikan stok: ID bahan baku atau jumlah perubahan kosong');
      throw new BadRequestException('ingredientId and quantityChange are required');
    }
    const change = Number(quantityChange);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const ingredient = await tx.ingredient.findUnique({ where: { id: ingredientId } });
        if (!ingredient) {
          this.logger.warn(`Gagal menyesuaikan stok: bahan baku ID "${ingredientId}" tidak ditemukan`);
          throw new NotFoundException('Bahan baku tidak ditemukan');
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
          // Add to FIFO batches
          await addStockBatch(tx, ingredientId, change, costSnapshot);
        } else if (change < 0) {
          // Consume from FIFO batches
          const { weightedUnitCost } = await consumeStockFIFO(tx, ingredientId, Math.abs(change));
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
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(`Gagal menyesuaikan stok bahan ID "${ingredientId}": ${error.message}`, error.stack);
      throw error;
    }
  }
}
