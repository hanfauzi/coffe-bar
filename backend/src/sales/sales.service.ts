import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { consumeStockFIFO, restoreStockFIFO } from '../inventory/fifo-inventory.helper';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      return await this.prisma.sale.findMany({
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
        orderBy: { saleDate: 'desc' },
      });
    } catch (error: any) {
      this.logger.error(`Gagal mendapatkan daftar penjualan: ${error.message}`, error.stack);
      throw error;
    }
  }

  async create(body: any) {
    const { saleDate, notes, items } = body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      this.logger.warn('Gagal mencatat penjualan: daftar item penjualan kosong');
      throw new BadRequestException('Items must be a non-empty array');
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        let totalRevenue = 0;
        let totalHpp = 0;
        const saleItemsToCreate: any[] = [];

        for (const item of items) {
          const qty = Number(item.quantity);
          const unitPrice = Number(item.unitPrice);
          const customPrice = item.customPrice !== undefined && item.customPrice !== null ? Number(item.customPrice) : null;
          const finalUnitPrice = customPrice !== null ? customPrice : unitPrice;
          const finalPrice = qty * finalUnitPrice;

          totalRevenue += finalPrice;

          const excludedIds = item.excludedIngredients || [];
          const sugarLevel = item.sugarLevel || 'NORMAL';

          const ingredientsUsed: { ingredientId: string; qtyToDeduct: number; unit: string; name: string }[] = [];

          if (item.menuId) {
            const menu = await tx.menu.findUnique({
              where: { id: item.menuId },
              include: { recipes: { include: { ingredient: true } } },
            });

            if (menu) {
              for (const r of menu.recipes) {
                if (excludedIds.includes(r.ingredientId)) {
                  continue;
                }
                let qtyUsed = Number(r.quantity);
                if (r.ingredient.name.toLowerCase().includes('gula') && sugarLevel === 'LESS') {
                  if (r.lessSugarQuantity !== null && r.lessSugarQuantity !== undefined) {
                    qtyUsed = Number(r.lessSugarQuantity);
                  } else {
                    const nameLower = menu.name.toLowerCase();
                    if (nameLower.includes('kopi susu') || nameLower.includes('kopsus')) {
                      qtyUsed = 10;
                    } else if (nameLower.includes('hazelnut') || nameLower.includes('pandan')) {
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
          }

          // Consume ingredients FIFO for parent item
          let parentHpp = 0;
          const parentTransactions: any[] = [];
          for (const ing of ingredientsUsed) {
            const { totalCost, weightedUnitCost } = await consumeStockFIFO(tx, ing.ingredientId, ing.qtyToDeduct);
            parentHpp += totalCost;

            // Update main ingredient currentStock
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

          const extrasToProcess: any[] = [];
          if (item.extras && item.extras.length > 0) {
            for (const extra of item.extras) {
              const extraQty = Number(extra.quantity);
              const extraUnitPrice = Number(extra.unitPrice);
              const extraFinalPrice = extraQty * extraUnitPrice;
              totalRevenue += extraFinalPrice;

              let extraHpp = 0;
              const extraIngredientsUsed: { ingredientId: string; qtyToDeduct: number; unit: string; name: string }[] = [];

              const extraMenu = await tx.menu.findUnique({
                where: { id: extra.menuId },
                include: { recipes: { include: { ingredient: true } } },
              });
              if (extraMenu) {
                for (const r of extraMenu.recipes) {
                  const qtyToDeduct = Number(r.quantity) * extraQty;
                  extraIngredientsUsed.push({
                    ingredientId: r.ingredientId,
                    qtyToDeduct,
                    unit: r.unit,
                    name: r.ingredient.name,
                  });
                }
              }

              const extraTransactions: any[] = [];
              for (const ing of extraIngredientsUsed) {
                const { totalCost, weightedUnitCost } = await consumeStockFIFO(tx, ing.ingredientId, ing.qtyToDeduct);
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
                unitPrice: extraUnitPrice,
                customPrice: null,
                finalPrice: extraFinalPrice,
                hppSnapshot: extraQty > 0 ? extraHpp / extraQty : 0,
                notes: extra.notes || null,
                transactions: extraTransactions,
              });
            }
          }

          saleItemsToCreate.push({
            menuId: item.menuId || null,
            quantity: qty,
            unitPrice,
            customPrice,
            finalPrice,
            hppSnapshot: qty > 0 ? parentHpp / qty : 0,
            notes: item.notes || null,
            excludedIngredients: excludedIds,
            sugarLevel: sugarLevel,
            extras: extrasToProcess,
            parentTransactions,
          });
        }

        const grossProfit = totalRevenue - totalHpp;

        const sale = await tx.sale.create({
          data: {
            saleDate: saleDate ? new Date(saleDate) : new Date(),
            totalRevenue,
            totalHpp,
            grossProfit,
            notes,
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

        return tx.sale.findUnique({
          where: { id: sale.id },
          include: { items: true },
        });
      });

      this.logger.log(`Transaksi penjualan berhasil dicatat: ID=${result?.id}, Total Revenue=${result?.totalRevenue}`);
      return result;
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Gagal mencatat transaksi penjualan: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const sale = await tx.sale.findUnique({
          where: { id },
          include: { items: true },
        });

        if (!sale) {
          this.logger.warn(`Gagal menghapus penjualan: ID "${id}" tidak ditemukan`);
          throw new NotFoundException('Transaksi penjualan tidak ditemukan');
        }

        const invTransactions = await tx.inventoryTransaction.findMany({
          where: {
            referenceType: 'SALE',
            referenceId: sale.id,
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
              referenceType: 'SALE',
              referenceId: sale.id,
              notes: `Restorasi stok dari pembatalan penjualan (Sale ID: ${sale.id.slice(0, 8)})`,
            },
          });
        }

        return tx.sale.delete({ where: { id } });
      });

      this.logger.log(`Transaksi penjualan berhasil dihapus/dibatalkan: ID=${id}`);
      return result;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Gagal menghapus transaksi penjualan ID "${id}": ${error.message}`, error.stack);
      throw error;
    }
  }
}
