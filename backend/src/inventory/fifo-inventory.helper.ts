import { Prisma } from '@prisma/client';

export interface FIFOResult {
  totalCost: number;
  weightedUnitCost: number;
}

/**
 * Consumes stock using FIFO (First-In, First-Out) method.
 * Returns the total cost and the weighted average unit cost of the consumed stock.
 */
export async function consumeStockFIFO(
  tx: Prisma.TransactionClient,
  ingredientId: string,
  quantityToConsume: number
): Promise<FIFOResult> {
  const qtyToConsumeNum = Number(quantityToConsume);
  if (qtyToConsumeNum <= 0) {
    return { totalCost: 0, weightedUnitCost: 0 };
  }

  // Get all active batches for this ingredient ordered by oldest first
  const batches = await tx.ingredientBatch.findMany({
    where: {
      ingredientId,
      remainingStock: { gt: 0 },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  let remainingToConsume = qtyToConsumeNum;
  let totalCost = 0;

  for (const batch of batches) {
    const batchRemaining = Number(batch.remainingStock);
    if (batchRemaining <= 0) continue;

    if (batchRemaining >= remainingToConsume) {
      // This batch has enough stock to cover the rest of consumption
      const newRemaining = batchRemaining - remainingToConsume;
      await tx.ingredientBatch.update({
        where: { id: batch.id },
        data: { remainingStock: newRemaining },
      });

      totalCost += remainingToConsume * Number(batch.unitCost);
      remainingToConsume = 0;
      break;
    } else {
      // Consume the entire batch and move to the next
      await tx.ingredientBatch.update({
        where: { id: batch.id },
        data: { remainingStock: 0 },
      });

      totalCost += batchRemaining * Number(batch.unitCost);
      remainingToConsume -= batchRemaining;
    }
  }

  // Fallback: if we still have remaining quantity to consume (stock overdraft)
  if (remainingToConsume > 0) {
    const ingredient = await tx.ingredient.findUnique({
      where: { id: ingredientId },
    });
    const fallbackCost = ingredient ? Number(ingredient.latestUnitCost) : 0;
    totalCost += remainingToConsume * fallbackCost;
  }

  const weightedUnitCost = totalCost / qtyToConsumeNum;
  return { totalCost, weightedUnitCost };
}

/**
 * Adds a new batch of stock when ingredients are purchased.
 */
export async function addStockBatch(
  tx: Prisma.TransactionClient,
  ingredientId: string,
  quantity: number,
  unitCost: number,
  expenseItemId?: string
): Promise<void> {
  const qty = Number(quantity);
  const cost = Number(unitCost);
  if (qty <= 0) return;

  await tx.ingredientBatch.create({
    data: {
      ingredientId,
      originalStock: qty,
      remainingStock: qty,
      unitCost: cost,
      expenseItemId,
    },
  });
}

/**
 * Restores stock (e.g. from canceled order or deleted consumption) as a new batch at the original cost.
 */
export async function restoreStockFIFO(
  tx: Prisma.TransactionClient,
  ingredientId: string,
  quantityToRestore: number,
  unitCostSnapshot: number
): Promise<void> {
  const qty = Number(quantityToRestore);
  const cost = Number(unitCostSnapshot);
  if (qty <= 0) return;

  // We add the restored quantity as a new batch so it can be consumed FIFO.
  // Using the original unit cost ensures the pricing matches when it's sold again.
  await tx.ingredientBatch.create({
    data: {
      ingredientId,
      originalStock: qty,
      remainingStock: qty,
      unitCost: cost,
    },
  });
}
