import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReconciliationsService {
  private readonly logger = new Logger(ReconciliationsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      return await this.prisma.cashReconciliation.findMany({
        orderBy: { date: 'desc' },
      });
    } catch (error: any) {
      this.logger.error(`Gagal mendapatkan riwayat rekonsiliasi: ${error.message}`, error.stack);
      throw error;
    }
  }

  async create(body: any) {
    const { date, account, systemBalance, actualBalance, reason, notes, makeAdjustment } = body;
    const sysBal = Number(systemBalance);
    const actBal = Number(actualBalance);
    const difference = actBal - sysBal;

    try {
      return await this.prisma.$transaction(async (tx) => {
        let adjustTransactionId: string | null = null;

        if (makeAdjustment && difference !== 0) {
          const adjDate = date ? new Date(date) : new Date();
          const adjNotes = `Adjustment Rekonsiliasi Kas: ${reason || ''}. ${notes || ''} (Akun: ${account})`.trim();

          if (difference > 0) {
            // Surplus: Create dummy Sale
            const sale = await tx.sale.create({
              data: {
                saleDate: adjDate,
                totalRevenue: difference,
                totalHpp: 0,
                grossProfit: difference,
                notes: adjNotes,
              },
            });
            adjustTransactionId = sale.id;
          } else {
            // Deficit: Create stock-free Expense
            const expense = await tx.expense.create({
              data: {
                date: adjDate,
                supplier: 'Koreksi Kas (Rekonsiliasi)',
                notes: adjNotes,
                totalAmount: Math.abs(difference),
              },
            });
            adjustTransactionId = expense.id;
          }
        }

        const reconciliation = await tx.cashReconciliation.create({
          data: {
            date: date ? new Date(date) : new Date(),
            account,
            systemBalance: sysBal,
            actualBalance: actBal,
            difference,
            reason: reason || 'Koreksi Kas Lainnya',
            notes,
            adjustTransactionId,
          },
        });

        this.logger.log(`Rekonsiliasi kas berhasil disimpan: ID=${reconciliation.id}, Selisih=${difference}`);
        return reconciliation;
      });
    } catch (error: any) {
      this.logger.error(`Gagal mencatat rekonsiliasi: ${error.message}`, error.stack);
      throw error;
    }
  }
}
