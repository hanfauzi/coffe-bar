import { PrismaService } from '../prisma.service';
export declare class ReportsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getDashboard(): Promise<{
        todaySalesCount: number;
        todayRevenue: number;
        todayProfit: number;
        monthlyRevenue: number;
        monthlyProfit: number;
        monthlyExpenseTotal: number;
        netMonthlyProfit: number;
        lowStockCount: number;
        inventoryValuation: number;
        lowStockItems: {
            id: string;
            name: string;
            currentStock: number;
            minimumStock: number;
            unit: string;
        }[];
    }>;
    getReports(startDate?: string, endDate?: string): Promise<{
        financials: {
            totalRevenue: number;
            totalHpp: number;
            grossProfit: number;
            totalExpense: number;
            totalWasteCost: number;
            operationalExpense: number;
            netProfit: number;
            cashFlow: {
                cashIn: number;
                cashOutStock: number;
                cashOutOther: number;
                cashBalance: number;
            };
        };
        comparison: {
            prevRevenue: number;
            prevHpp: number;
            prevExpense: number;
            prevWasteCost: number;
            revenueChangePercent: number;
            profitChangePercent: number;
        };
        personalConsumption: {
            count: number;
            estimatedCost: number;
        };
        inventory: {
            valuation: number;
            totalItems: number;
            lowStockItems: number;
        };
    }>;
}
