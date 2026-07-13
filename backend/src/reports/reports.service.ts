import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Today Sales
      const todaySales = await this.prisma.sale.findMany({
        where: {
          saleDate: {
            gte: today,
          },
        },
      });

      let todayRevenue = 0;
      let todayHpp = 0;
      for (const sale of todaySales) {
        todayRevenue += Number(sale.totalRevenue);
        todayHpp += Number(sale.totalHpp);
      }

      // Monthly Sales
      const monthlySales = await this.prisma.sale.findMany({
        where: {
          saleDate: {
            gte: startOfMonth,
          },
        },
      });

      let monthlyRevenue = 0;
      let monthlyHpp = 0;
      for (const sale of monthlySales) {
        monthlyRevenue += Number(sale.totalRevenue);
        monthlyHpp += Number(sale.totalHpp);
      }

      // Monthly Expenses
      const monthlyExpenses = await this.prisma.expense.findMany({
        where: {
          date: {
            gte: startOfMonth,
          },
        },
      });
      const monthlyExpenseTotal = monthlyExpenses.reduce((sum, exp) => sum + Number(exp.totalAmount), 0);

      // Monthly Waste Cost
      const monthlyWasteTransactions = await this.prisma.inventoryTransaction.findMany({
        where: {
          type: 'WASTE',
          createdAt: {
            gte: startOfMonth,
          },
        },
      });
      const monthlyWasteCost = monthlyWasteTransactions.reduce(
        (sum, tx) => sum + Math.abs(Number(tx.quantityChange)) * (Number(tx.unitCostSnapshot) || 0),
        0,
      );

      // Low stock ingredients
      const ingredients = await this.prisma.ingredient.findMany();
      const lowStockItems = ingredients.filter((ing) => Number(ing.currentStock) <= Number(ing.minimumStock));

      // Inventory Valuation
      const inventoryValuation = ingredients.reduce(
        (sum, ing) => sum + Number(ing.currentStock) * Number(ing.latestUnitCost),
        0,
      );

      return {
        todaySalesCount: todaySales.length,
        todayRevenue,
        todayProfit: todayRevenue - todayHpp,
        monthlyRevenue,
        monthlyProfit: monthlyRevenue - monthlyHpp,
        monthlyExpenseTotal,
        netMonthlyProfit: monthlyRevenue - monthlyHpp - monthlyExpenseTotal - monthlyWasteCost,
        lowStockCount: lowStockItems.length,
        inventoryValuation,
        lowStockItems: lowStockItems.map((i) => ({
          id: i.id,
          name: i.name,
          currentStock: Number(i.currentStock),
          minimumStock: Number(i.minimumStock),
          unit: i.unit,
        })),
      };
    } catch (error: any) {
      this.logger.error(`Gagal menghitung data dashboard: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getReports(startDate?: string, endDate?: string) {
    try {
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);

      const saleDateFilter = start || end ? {
        saleDate: {
          ...(start && { gte: start }),
          ...(end && { lte: end }),
        }
      } : {};

      const dateFilter = start || end ? {
        date: {
          ...(start && { gte: start }),
          ...(end && { lte: end }),
        }
      } : {};

      const wasteDateFilter = start || end ? {
        createdAt: {
          ...(start && { gte: start }),
          ...(end && { lte: end }),
        }
      } : {};

      // Fetch filtered data
      const sales = await this.prisma.sale.findMany({
        where: saleDateFilter,
        orderBy: { saleDate: 'desc' },
      });

      const expenses = await this.prisma.expense.findMany({
        where: dateFilter,
        orderBy: { date: 'desc' },
      });

      const consumptions = await this.prisma.personalConsumption.findMany({
        where: dateFilter,
        orderBy: { date: 'desc' },
      });

      const ingredients = await this.prisma.ingredient.findMany();

      const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalRevenue), 0);
      const totalHpp = sales.reduce((sum, s) => sum + Number(s.totalHpp), 0);
      const totalExpense = expenses.reduce((sum, e) => sum + Number(e.totalAmount), 0);
      const totalConsumptionEstCost = consumptions.reduce((sum, c) => sum + Number(c.estimatedCost), 0);

      // Waste Cost Calculation
      const wasteTransactions = await this.prisma.inventoryTransaction.findMany({
        where: {
          type: 'WASTE',
          ...wasteDateFilter
        },
      });
      const totalWasteCost = wasteTransactions.reduce(
        (sum, tx) => sum + Math.abs(Number(tx.quantityChange)) * (Number(tx.unitCostSnapshot) || 0),
        0,
      );

      const inventoryValuation = ingredients.reduce(
        (sum, ing) => sum + Number(ing.currentStock) * Number(ing.latestUnitCost),
        0,
      );

      const operationalExpense = 0;

      // Comparative Metrics Calculation
      let prevRevenue = 0;
      let prevHpp = 0;
      let prevExpense = 0;
      let prevWasteCost = 0;

      if (start && end) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const prevStart = new Date(start);
        prevStart.setDate(prevStart.getDate() - diffDays);
        const prevEnd = new Date(end);
        prevEnd.setDate(prevEnd.getDate() - diffDays);

        const prevSales = await this.prisma.sale.findMany({
          where: { saleDate: { gte: prevStart, lte: prevEnd } }
        });
        prevRevenue = prevSales.reduce((sum, s) => sum + Number(s.totalRevenue), 0);
        prevHpp = prevSales.reduce((sum, s) => sum + Number(s.totalHpp), 0);

        const prevExpenses = await this.prisma.expense.findMany({
          where: { date: { gte: prevStart, lte: prevEnd } }
        });
        prevExpense = prevExpenses.reduce((sum, e) => sum + Number(e.totalAmount), 0);

        const prevWastes = await this.prisma.inventoryTransaction.findMany({
          where: { type: 'WASTE', createdAt: { gte: prevStart, lte: prevEnd } }
        });
        prevWasteCost = prevWastes.reduce((sum, tx) => sum + Math.abs(Number(tx.quantityChange)) * (Number(tx.unitCostSnapshot) || 0), 0);
      }

      const currentProfit = totalRevenue - totalHpp;
      const prevProfit = prevRevenue - prevHpp;

      return {
        financials: {
          totalRevenue,
          totalHpp,
          grossProfit: currentProfit,
          totalExpense,
          totalWasteCost,
          operationalExpense,
          netProfit: totalRevenue - totalHpp - totalWasteCost - operationalExpense,
          cashFlow: {
            cashIn: totalRevenue,
            cashOutStock: totalExpense,
            cashOutOther: 0,
            cashBalance: totalRevenue - totalExpense,
          }
        },
        comparison: {
          prevRevenue,
          prevHpp,
          prevExpense,
          prevWasteCost,
          revenueChangePercent: prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0,
          profitChangePercent: prevProfit > 0 ? ((currentProfit - prevProfit) / prevProfit) * 100 : 0,
        },
        personalConsumption: {
          count: consumptions.length,
          estimatedCost: totalConsumptionEstCost,
        },
        inventory: {
          valuation: inventoryValuation,
          totalItems: ingredients.length,
          lowStockItems: ingredients.filter((i) => Number(i.currentStock) <= Number(i.minimumStock)).length,
        },
      };
    } catch (error: any) {
      this.logger.error(`Gagal membuat data laporan finansial: ${error.message}`, error.stack);
      throw error;
    }
  }
}
