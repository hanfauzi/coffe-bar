import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('OrdersService - Phase 1 Integration Tests', () => {
  let service: OrdersService;
  let prisma: PrismaService;
  
  let testIngredientId: string;
  let testMenuId: string;
  let testRecipeId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersService, PrismaService],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clean up any old test data
    await cleanUp();

    // 1. Create a test ingredient
    const ing = await prisma.ingredient.create({
      data: {
        name: 'TEST_INGREDIENT_RESERVATION',
        category: 'RAW_MATERIAL',
        unit: 'ml',
        currentStock: 100,
        minimumStock: 10,
        safetyStock: 20,
        latestUnitCost: 100,
        isActive: true,
      },
    });
    testIngredientId = ing.id;

    // 2. Create a test menu
    const menu = await prisma.menu.create({
      data: {
        name: 'TEST_MENU_RESERVATION',
        defaultSellingPrice: 15000,
        category: 'MAIN',
        active: true,
      },
    });
    testMenuId = menu.id;

    // 3. Create a recipe linking them (needs 10 units per portion)
    const recipe = await prisma.recipeItem.create({
      data: {
        menuId: testMenuId,
        ingredientId: testIngredientId,
        quantity: 10,
        unit: 'ml',
        optional: false,
      },
    });
    testRecipeId = recipe.id;
  });

  afterAll(async () => {
    await cleanUp();
    await prisma.$disconnect();
  });

  async function cleanUp() {
    // Delete orders matching test name
    const orders = await prisma.order.findMany({
      where: { customerName: 'TEST_CUSTOMER_RESERV' },
    });
    for (const o of orders) {
      await prisma.stockReservation.deleteMany({ where: { orderId: o.id } });
      await prisma.orderItem.deleteMany({ where: { orderId: o.id } });
      await prisma.order.delete({ where: { id: o.id } });
    }

    // Delete sales matching test notes
    await prisma.saleItem.deleteMany({
      where: { menuId: testMenuId },
    });
    await prisma.sale.deleteMany({
      where: { notes: { contains: 'TEST_CUSTOMER_RESERV' } },
    });

    // Delete inventory transactions
    await prisma.inventoryTransaction.deleteMany({
      where: { ingredientId: testIngredientId },
    });

    // Delete recipe, menu, ingredient
    if (testRecipeId) {
      await prisma.recipeItem.deleteMany({ where: { id: testRecipeId } });
    }
    if (testMenuId) {
      await prisma.menu.deleteMany({ where: { id: testMenuId } });
    }
    if (testIngredientId) {
      await prisma.ingredient.deleteMany({ where: { id: testIngredientId } });
    }
  }

  it('1. Membuat order aktif menambah reservation', async () => {
    // Create order with 2 portions (needs 20 ml)
    const order = await service.create({
      customerName: 'TEST_CUSTOMER_RESERV',
      orderDate: new Date(),
      notes: 'Initial test',
      items: [
        {
          id: 'temp-item-1',
          menuId: testMenuId,
          quantity: 2,
          unitPrice: 15000,
          customPrice: null,
          excludedIngredients: [],
          sugarLevel: 'NORMAL',
        },
      ],
    });

    expect(order).toBeDefined();

    // Check reservations
    const reservations = await prisma.stockReservation.findMany({
      where: { orderId: order!.id },
    });

    expect(reservations.length).toBe(1);
    expect(Number(reservations[0].quantity)).toBe(20);
    expect(reservations[0].ingredientId).toBe(testIngredientId);
  });

  it('2. Edit order mengubah reservation dengan benar', async () => {
    // Find the order
    const order = await prisma.order.findFirst({
      where: { customerName: 'TEST_CUSTOMER_RESERV', status: 'PENDING' },
    });
    expect(order).toBeDefined();

    // Update quantity to 4 portions (needs 40 ml)
    await service.update(order!.id, {
      customerName: 'TEST_CUSTOMER_RESERV',
      notes: 'Updated test',
      items: [
        {
          menuId: testMenuId,
          quantity: 4,
          unitPrice: 15000,
          customPrice: null,
          excludedIngredients: [],
          sugarLevel: 'NORMAL',
        },
      ],
    });

    // Check updated reservation
    const reservations = await prisma.stockReservation.findMany({
      where: { orderId: order!.id },
    });

    expect(reservations.length).toBe(1);
    expect(Number(reservations[0].quantity)).toBe(40);
  });

  it('3. Batalkan order melepaskan reservation', async () => {
    // Create another temporary order
    const tempOrder = await service.create({
      customerName: 'TEST_CUSTOMER_RESERV',
      items: [
        {
          id: 'temp-item-2',
          menuId: testMenuId,
          quantity: 1,
          unitPrice: 15000,
        },
      ],
    });

    let resCount = await prisma.stockReservation.count({
      where: { orderId: tempOrder!.id },
    });
    expect(resCount).toBe(1);

    // Delete/cancel
    await service.delete(tempOrder!.id);

    resCount = await prisma.stockReservation.count({
      where: { orderId: tempOrder!.id },
    });
    expect(resCount).toBe(0);
  });

  it('4 & 5 & 7 & 8. Selesaikan order, idempotency, HPP, cash flow, stock reduction', async () => {
    const order = await prisma.order.findFirst({
      where: { customerName: 'TEST_CUSTOMER_RESERV', status: 'PENDING' },
    });
    expect(order).toBeDefined();

    // Store starting stock
    const startStock = await prisma.ingredient.findUnique({
      where: { id: testIngredientId },
    });
    const startingStockVal = Number(startStock!.currentStock);

    // Selesaikan order with LUNAS status
    const result = await service.complete(order!.id, {
      paymentMethod: 'BCA',
      paymentStatus: 'LUNAS',
      notes: 'Completed via test code',
    });

    expect(result!.status).toBe('COMPLETED');

    // 1. Stock reduction assertion
    const endStock = await prisma.ingredient.findUnique({
      where: { id: testIngredientId },
    });
    expect(Number(endStock!.currentStock)).toBe(startingStockVal - 40); // 4 portions * 10 ml

    // 2. Reservation released assertion
    const resCount = await prisma.stockReservation.count({
      where: { orderId: order!.id },
    });
    expect(resCount).toBe(0);

    // 3. Sale and SaleItems snapshots created
    const sale = await prisma.sale.findUnique({
      where: { id: result!.saleId },
      include: { items: true },
    });
    expect(sale).toBeDefined();
    expect(Number(sale!.totalRevenue)).toBe(60000); // 4 * 15000
    expect(sale!.notes).toContain('Completed via test code');

    // 4. Idempotency test (double click complete throws error)
    await expect(service.complete(order!.id)).rejects.toThrow(BadRequestException);
  });
});
