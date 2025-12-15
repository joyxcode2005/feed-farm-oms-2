import { MaterialUnit, StockTransactionType } from "@prisma/client";
import prisma from "../config/prisma";

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
