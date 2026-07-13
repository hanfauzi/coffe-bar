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
var ReportsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let ReportsService = ReportsService_1 = class ReportsService {
    prisma;
    logger = new common_1.Logger(ReportsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboard() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
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
            const monthlyExpenses = await this.prisma.expense.findMany({
                where: {
                    date: {
                        gte: startOfMonth,
                    },
                },
            });
            const monthlyExpenseTotal = monthlyExpenses.reduce((sum, exp) => sum + Number(exp.totalAmount), 0);
            const monthlyWasteTransactions = await this.prisma.inventoryTransaction.findMany({
                where: {
                    type: 'WASTE',
                    createdAt: {
                        gte: startOfMonth,
                    },
                },
            });
            const monthlyWasteCost = monthlyWasteTransactions.reduce((sum, tx) => sum + Math.abs(Number(tx.quantityChange)) * (Number(tx.unitCostSnapshot) || 0), 0);
            const ingredients = await this.prisma.ingredient.findMany();
            const lowStockItems = ingredients.filter((ing) => Number(ing.currentStock) <= Number(ing.minimumStock));
            const inventoryValuation = ingredients.reduce((sum, ing) => sum + Number(ing.currentStock) * Number(ing.latestUnitCost), 0);
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
        }
        catch (error) {
            this.logger.error(`Gagal menghitung data dashboard: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getReports(startDate, endDate) {
        try {
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            if (start)
                start.setHours(0, 0, 0, 0);
            if (end)
                end.setHours(23, 59, 59, 999);
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
            const wasteTransactions = await this.prisma.inventoryTransaction.findMany({
                where: {
                    type: 'WASTE',
                    ...wasteDateFilter
                },
            });
            const totalWasteCost = wasteTransactions.reduce((sum, tx) => sum + Math.abs(Number(tx.quantityChange)) * (Number(tx.unitCostSnapshot) || 0), 0);
            const inventoryValuation = ingredients.reduce((sum, ing) => sum + Number(ing.currentStock) * Number(ing.latestUnitCost), 0);
            const operationalExpense = 0;
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
        }
        catch (error) {
            this.logger.error(`Gagal membuat data laporan finansial: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = ReportsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map