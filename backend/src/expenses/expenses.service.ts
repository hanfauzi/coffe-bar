import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { addStockBatch } from '../inventory/fifo-inventory.helper';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(private prisma: PrismaService) {}

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
    } catch (error: any) {
      this.logger.error(`Gagal mendapatkan daftar pengeluaran: ${error.message}`, error.stack);
      throw error;
    }
  }

  async create(body: any) {
    const { supplier, notes, items, date } = body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      this.logger.warn('Gagal membuat pengeluaran: daftar item belanja kosong');
      throw new BadRequestException('Items must be a non-empty array');
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

          // Calculate latest cost per unit
          const latestUnitCost = qty > 0 ? totalPrice / qty : 0;

          // Create ExpenseItem
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

          // Add to FIFO batches
          await addStockBatch(tx, ingredientId, qty, latestUnitCost, expenseItem.id);

          // Update Ingredient stock and latest unit cost
          await tx.ingredient.update({
            where: { id: ingredientId },
            data: {
              currentStock: {
                increment: qty,
              },
              latestUnitCost: latestUnitCost,
            },
          });

          // Log stock ledger transaction
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

        if (!created) return null;

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
    } catch (error: any) {
      this.logger.error(`Gagal mencatat pengeluaran: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const expense = await tx.expense.findUnique({
          where: { id },
          include: { items: true },
        });
        if (!expense) {
          this.logger.warn(`Gagal menghapus pengeluaran: ID "${id}" tidak ditemukan`);
          throw new NotFoundException('Pengeluaran tidak ditemukan');
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

          // Delete associated batch
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
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Gagal menghapus pengeluaran ID "${id}": ${error.message}`, error.stack);
      throw error;
    }
  }
}
