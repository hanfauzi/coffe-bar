import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class IngredientsService {
  private readonly logger = new Logger(IngredientsService.name);

  constructor(private prisma: PrismaService) {}

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
    } catch (error: any) {
      this.logger.error(`Gagal mendapatkan daftar bahan baku: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const ing = await this.prisma.ingredient.findUnique({
        where: { id },
        include: {
          reservations: true,
        },
      });
      if (!ing) {
        this.logger.warn(`Bahan baku dengan ID "${id}" tidak ditemukan`);
        throw new NotFoundException('Bahan baku tidak ditemukan');
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
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Gagal mencari bahan baku ID "${id}": ${error.message}`, error.stack);
      throw error;
    }
  }

  async create(body: any) {
    const { name, category, currentStock, unit, minimumStock, safetyStock, latestUnitCost, isPackaging } = body;
    if (!name || !unit) {
      this.logger.warn('Gagal membuat bahan baku: nama atau satuan kosong');
      throw new BadRequestException('Name and unit are required');
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
              shadowCost: undefined, // default parameter bypass
              unitCostSnapshot: Number(latestUnitCost) || 0,
              referenceType: 'MANUAL',
              notes: 'Setup stok awal bahan baku',
            } as any,
          });
        }

        return ingredient;
      });

      this.logger.log(`Bahan baku baru berhasil disimpan: ID=${result.id}, Nama="${name}"`);
      return result;
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Gagal membuat bahan baku "${name}": ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, body: any) {
    try {
      // Check if exists first
      const item = await this.prisma.ingredient.findUnique({ where: { id } });
      if (!item) {
        this.logger.warn(`Gagal memperbarui: bahan baku ID "${id}" tidak ditemukan`);
        throw new NotFoundException('Bahan baku tidak ditemukan');
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
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Gagal memperbarui bahan baku ID "${id}": ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const item = await this.prisma.ingredient.findUnique({ where: { id } });
      if (!item) {
        this.logger.warn(`Gagal menghapus: bahan baku ID "${id}" tidak ditemukan`);
        throw new NotFoundException('Bahan baku tidak ditemukan');
      }

      const deleted = await this.prisma.ingredient.delete({ where: { id } });
      this.logger.log(`Bahan baku berhasil dihapus: ID=${id}, Nama="${deleted.name}"`);
      return deleted;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Gagal menghapus bahan baku ID "${id}": ${error.message}`, error.stack);
      throw error;
    }
  }
}
