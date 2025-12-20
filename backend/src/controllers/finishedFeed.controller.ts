import prisma from "../config/prisma";

/**
 * NEW: Aggregates production and sales data for finished feed dashboard.
 * Provides high-level totals for a specific date range.
 */
export async function getFinishedFeedSummaryDB(from: Date, to: Date) {
  const transactions = await prisma.finishedFeedStockTransaction.groupBy({
    by: ['type'],
    where: {
      createdAt: { gte: from, lte: to }
    },
    _sum: {
      quantityBags: true
    }
  });

  // Transform the grouped data into a readable summary object
  const summary = {
    totalProduced: transactions.find(t => t.type === "PRODUCTION_IN")?._sum.quantityBags || 0,
    totalSold: transactions.find(t => t.type === "SALE_OUT")?._sum.quantityBags || 0,
    totalAdjustments: transactions.find(t => t.type === "ADJUSTMENT")?._sum.quantityBags || 0,
  };

  return summary;
}

export const getFinishedFeedCategoryWithStock = () =>
  prisma.feedCategory.findMany({
    select: {
      id: true,
      name: true,
      unitSizeKg: true,
      animalType: {
        select: {
          name: true,
        },
      },
      stock: {
        select: {
          quantityAvailable: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

interface CreateProductionBatchInput {
  feedCategoryId: string;
  producedBags: number;
  productionDate: Date;
  adminUserId: string;
  notes?: string;
  materialsUsed: {
    rawMaterialId: string;
    quantity: number;
  }[];
}

export async function createProductionBatchDB(input: CreateProductionBatchInput) {
  const { feedCategoryId, producedBags, productionDate, adminUserId, notes, materialsUsed } = input;

  return prisma.$transaction(async (tx) => {
    // 1. Create production batch
    const batch = await tx.productionBatch.create({
      data: {
        feedCategoryId,
        adminUserId,
        batchNumber: `PB-${Date.now()}`,
        producedBags,
        productionDate,
      },
    });

    // 2. Consume raw materials
    for (const material of materialsUsed) {
      await tx.rawMaterialStockTransaction.create({
        data: {
          rawMaterialId: material.rawMaterialId,
          adminUserId,
          type: "OUT",
          quantity: material.quantity,
          referenceType: "PRODUCTION",
          referenceId: batch.id,
        },
      });

      await tx.productionBatchMaterial.create({
        data: {
          batchId: batch.id,
          rawMaterialId: material.rawMaterialId,
          quantityKg: material.quantity,
        },
      });
    }

    // 3. Update finished feed stock
    const stock = await tx.finishedFeedStock.upsert({
      where: { feedCategoryId },
      update: {
        quantityAvailable: { increment: producedBags },
      },
      create: {
        feedCategoryId,
        quantityAvailable: producedBags,
      },
    });

    // 4. Finished feed ledger
    const ledger = await tx.finishedFeedStockTransaction.create({
      data: {
        feedCategoryId,
        adminUserId,
        type: "PRODUCTION_IN",
        quantityBags: producedBags,
        productionBatchId: batch.id,
        notes,
      },
    });

    return {
      batch,
      stock,
      ledger,
    };
  });
}

interface FinishedFeedSaleInput {
  feedCategoryId: string;
  orderId: string;
  quantityBags: number;
  adminUserId: string;
  notes?: string;
}

export async function deductFinishedFeedStockDB(input: FinishedFeedSaleInput) {
  const { feedCategoryId, orderId, quantityBags, adminUserId, notes } = input;

  return prisma.$transaction(async (tx) => {
    // 1. Ensure stock row exists
    const stock = await tx.finishedFeedStock.findUnique({
      where: { feedCategoryId },
    });

    if (!stock || stock.quantityAvailable < quantityBags) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    // 2. Deduct stock
    const updatedStock = await tx.finishedFeedStock.update({
      where: { feedCategoryId },
      data: {
        quantityAvailable: {
          decrement: quantityBags,
        },
      },
    });

    // 3. Ledger entry
    const ledger = await tx.finishedFeedStockTransaction.create({
      data: {
        feedCategoryId,
        adminUserId,
        type: "SALE_OUT",
        quantityBags,
        orderId,
        notes,
      },
    });

    return {
      updatedStock,
      ledger,
    };
  });
}

interface FinishedFeedAdjustmentInput {
  feedCategoryId: string;
  quantityBags: number; // can be +ve or -ve, but not 0
  adminUserId: string;
  reason: string;
}

export async function adjustFinishedFeedStockDB(input: FinishedFeedAdjustmentInput) {
  const { feedCategoryId, quantityBags, adminUserId, reason } = input;

  return prisma.$transaction(async (tx) => {
    // 0. Ensure feed category exists
    const category = await tx.feedCategory.findUnique({
      where: { id: feedCategoryId },
      select: { id: true }
    });

    if (!category) {
      throw new Error("FEED_CATEGORY_NOT_FOUND");
    }

    // 1. Ensure stock row exists (safe now)
    const stock = await tx.finishedFeedStock.upsert({
      where: { feedCategoryId },
      update: {
        quantityAvailable: {
          increment: quantityBags,
        },
      },
      create: {
        feedCategoryId,
        quantityAvailable: quantityBags,
      },
    });

    // 2. Ledger entry
    const ledger = await tx.finishedFeedStockTransaction.create({
      data: {
        feedCategoryId,
        adminUserId,
        type: "ADJUSTMENT",
        quantityBags: Math.abs(quantityBags),
        notes: reason,
      },
    });

    return { stock, ledger };
  });
}


interface GetFinishedFeedLedgerInput {
  feedCategoryId: string;
  from?: Date;
  to?: Date;
}

export async function getFinishedFeedLedgerDB(input: GetFinishedFeedLedgerInput) {
  const { feedCategoryId, from, to } = input;

  const where: any = { feedCategoryId };

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  return prisma.finishedFeedStockTransaction.findMany({
    where,
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      type: true,
      quantityBags: true,
      quantityKg: true,
      orderId: true,
      productionBatchId: true,
      notes: true,
      createdAt: true,
      adminUser: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

interface GetFinishedFeedSnapshotsInput {
  feedCategoryId: string;
  from?: Date;
  to?: Date;
}

export async function getFinishedFeedSnapshotsDB(input: GetFinishedFeedSnapshotsInput) {
  const { feedCategoryId, from, to } = input;

  const where: any = { feedCategoryId };

  if (from || to) {
    where.date = {};
    if (from) where.date.gte = from;
    if (to) where.date.lte = to;
  }

  return prisma.finishedFeedDailySnapshot.findMany({
    where,
    orderBy: { date: "asc" },
    select: {
      date: true,
      openingBags: true,
      inBags: true,
      outBags: true,
      closingBags: true,
    },
  });
}