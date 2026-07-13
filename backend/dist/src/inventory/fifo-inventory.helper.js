"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumeStockFIFO = consumeStockFIFO;
exports.addStockBatch = addStockBatch;
exports.restoreStockFIFO = restoreStockFIFO;
async function consumeStockFIFO(tx, ingredientId, quantityToConsume) {
    const qtyToConsumeNum = Number(quantityToConsume);
    if (qtyToConsumeNum <= 0) {
        return { totalCost: 0, weightedUnitCost: 0 };
    }
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
        if (batchRemaining <= 0)
            continue;
        if (batchRemaining >= remainingToConsume) {
            const newRemaining = batchRemaining - remainingToConsume;
            await tx.ingredientBatch.update({
                where: { id: batch.id },
                data: { remainingStock: newRemaining },
            });
            totalCost += remainingToConsume * Number(batch.unitCost);
            remainingToConsume = 0;
            break;
        }
        else {
            await tx.ingredientBatch.update({
                where: { id: batch.id },
                data: { remainingStock: 0 },
            });
            totalCost += batchRemaining * Number(batch.unitCost);
            remainingToConsume -= batchRemaining;
        }
    }
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
async function addStockBatch(tx, ingredientId, quantity, unitCost, expenseItemId) {
    const qty = Number(quantity);
    const cost = Number(unitCost);
    if (qty <= 0)
        return;
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
async function restoreStockFIFO(tx, ingredientId, quantityToRestore, unitCostSnapshot) {
    const qty = Number(quantityToRestore);
    const cost = Number(unitCostSnapshot);
    if (qty <= 0)
        return;
    await tx.ingredientBatch.create({
        data: {
            ingredientId,
            originalStock: qty,
            remainingStock: qty,
            unitCost: cost,
        },
    });
}
//# sourceMappingURL=fifo-inventory.helper.js.map