import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma.service';

describe('ReportsService - Phase 3 Integration Tests', () => {
  let service: ReportsService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsService, PrismaService],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('1. Mendapatkan data dashboard', async () => {
    const dash = await service.getDashboard();
    expect(dash).toBeDefined();
    expect(dash.todaySalesCount).toBeDefined();
    expect(dash.inventoryValuation).toBeDefined();
  });

  it('2. Mendapatkan data laporan finansial tanpa filter', async () => {
    const reports = await service.getReports();
    expect(reports).toBeDefined();
    expect(reports.financials).toBeDefined();
    expect(reports.financials.totalRevenue).toBeDefined();
    expect(reports.personalConsumption).toBeDefined();
    expect(reports.inventory).toBeDefined();
  });

  it('3. Mendapatkan data laporan finansial dengan filter tanggal dan perbandingan', async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const prevWeekStr = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0];

    const reports = await service.getReports(prevWeekStr, todayStr);
    expect(reports).toBeDefined();
    expect(reports.financials).toBeDefined();
    expect(reports.comparison).toBeDefined();
    expect(reports.comparison.revenueChangePercent).toBeDefined();
    expect(reports.comparison.profitChangePercent).toBeDefined();
  });
});
