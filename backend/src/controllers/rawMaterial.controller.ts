import { MaterialUnit, StockTransactionType } from "@prisma/client";
import prisma from "../config/prisma";

/**
 * NEW: Aggregates total raw material movements across all materials.
 * Provides a global summary for purchases and consumption in a date range.
 */
export async function getRawMaterialsSummaryDB(from: Date, to: Date) {
  const transactions = await prisma.rawMaterialStockTransaction.groupBy({
    by: ['type'],
    where: {
      createdAt: { gte: from, lte: to }
    },
    _sum: {
      quantity: true
    }
  });

  const summary = {
    totalIn: transactions.find(t => t.type === "IN")?._sum.quantity || 0,
    totalOut: transactions.find(t => t.type === "OUT")?._sum.quantity || 0,
    totalAdjustments: transactions.find(t => t.type === "ADJUSTMENT")?._sum.quantity || 0,
  };

  return summary;
}

/**
 * Fetches daily stock snapshots for a specific raw material over a set period.
 */
export async function getRawMaterialSummaryDashboard(rawMaterialId: string, days: number = 7) {
  return prisma.rawMaterialDailySnapshot.findMany({
    where: { rawMaterialId },
    orderBy: { date: "desc" },
    take: days,
    select: {
      date: true,
      openingStockKg: true,
      totalInKg: true,
      totalOutKg: true,
      closingStockKg: true,
    },
  });
}

export async function checkExistingRawMaterial(name: string) {
  return prisma.rawMaterial.findFirst({
    where: {
      name,
    },
  });
}

export async function existingRawMaterial(rawMaterialId: string) {
  return prisma.rawMaterial.findUnique({
    where: { id: rawMaterialId },
    select: {
      id: true,
      name: true,
      unit: true,
    },
  });
}

export async function createRawMaterial(name: string, unit: MaterialUnit) {
  return prisma.rawMaterial.create({
    data: {
      name,
      unit,
    },
  });
}

export async function getAllRawMaterials() {
  return prisma.rawMaterial.findMany({
    select: {
      id: true,
      name: true,
      unit: true,
      stockTxns: {
        select: {
          type: true,
          quantity: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

export function createRawMaterialStockTxn(
  rawMaterialId: string,
  adminUserId: string,
  quantity: number,
  type: StockTransactionType,
  referenceType?: string,
  referenceId?: string,
  notes?: string,
) {
  return prisma.rawMaterialStockTransaction.create({
    data: {
      rawMaterialId,
      adminUserId,
      type,
      quantity,
      referenceType,
      referenceId,
      notes,
    },
  });
}

export function getAllRawMaterialTxns(rawMaterialId: string) {
  return prisma.rawMaterialStockTransaction.findMany({
    where: {
      rawMaterialId,
    },
    select: {
      type: true,
      quantity: true,
    },
  });
}

export function getRawMaterialLedger(whereClause: any) {
  return prisma.rawMaterialStockTransaction.findMany({
    where: whereClause,
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      type: true,
      quantity: true,
      referenceType: true,
      referenceId: true,
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

export function getRawMaterialSnapshots(whereClause: any) {
  return prisma.rawMaterialDailySnapshot.findMany({
    where: whereClause,
    orderBy: { date: "asc" },
    select: {
      date: true,
      openingStockKg: true,
      totalInKg: true,
      totalOutKg: true,
      closingStockKg: true,
    },
  });
}