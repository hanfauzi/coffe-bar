import { Test, TestingModule } from '@nestjs/testing';
import { ReconciliationsService } from './reconciliations.service';
import { PrismaService } from '../prisma.service';

describe('ReconciliationsService - Phase 2 Integration Tests', () => {
  let service: ReconciliationsService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReconciliationsService, PrismaService],
    }).compile();

    service = module.get<ReconciliationsService>(ReconciliationsService);
    prisma = module.get<PrismaService>(PrismaService);

    await cleanUp();
  });

  afterAll(async () => {
    await cleanUp();
    await prisma.$disconnect();
  });

  async function cleanUp() {
    // Delete test reconciliations
    await prisma.cashReconciliation.deleteMany({
      where: { notes: { contains: 'TEST_RECON_SPEC' } },
    });

    // Delete adjustments
    await prisma.expense.deleteMany({
      where: { notes: { contains: 'TEST_RECON_SPEC' } },
    });
    await prisma.sale.deleteMany({
      where: { notes: { contains: 'TEST_RECON_SPEC' } },
    });
  }

  it('1. Buat rekonsiliasi kas dengan selisih 0', async () => {
    const recon = await service.create({
      date: new Date(),
      account: 'Cash',
      systemBalance: 500000,
      actualBalance: 500000,
      reason: 'Biaya admin',
      notes: 'TEST_RECON_SPEC 0 diff',
      makeAdjustment: false,
    });

    expect(recon).toBeDefined();
    expect(Number(recon.difference)).toBe(0);
    expect(recon.adjustTransactionId).toBeNull();
  });

  it('2. Buat rekonsiliasi kas defisit (kurang) dengan penyesuaian otomatis', async () => {
    const recon = await service.create({
      date: new Date(),
      account: 'Cash',
      systemBalance: 500000,
      actualBalance: 495000, // Defisit Rp 5.000
      reason: 'Pembulatan',
      notes: 'TEST_RECON_SPEC deficit',
      makeAdjustment: true,
    });

    expect(recon).toBeDefined();
    expect(Number(recon.difference)).toBe(-5000);
    expect(recon.adjustTransactionId).not.toBeNull();

    // Check that stock-free Expense was created
    const expense = await prisma.expense.findUnique({
      where: { id: recon.adjustTransactionId! },
    });
    expect(expense).toBeDefined();
    expect(Number(expense!.totalAmount)).toBe(5000);
    expect(expense!.notes).toContain('TEST_RECON_SPEC deficit');
  });

  it('3. Buat rekonsiliasi kas surplus (lebih) dengan penyesuaian otomatis', async () => {
    const recon = await service.create({
      date: new Date(),
      account: 'BCA',
      systemBalance: 1000000,
      actualBalance: 1010000, // Surplus Rp 10.000
      reason: 'Salah input',
      notes: 'TEST_RECON_SPEC surplus',
      makeAdjustment: true,
    });

    expect(recon).toBeDefined();
    expect(Number(recon.difference)).toBe(10000);
    expect(recon.adjustTransactionId).not.toBeNull();

    // Check that Sale was created
    const sale = await prisma.sale.findUnique({
      where: { id: recon.adjustTransactionId! },
    });
    expect(sale).toBeDefined();
    expect(Number(sale!.totalRevenue)).toBe(10000);
    expect(sale!.notes).toContain('TEST_RECON_SPEC surplus');
  });
});
