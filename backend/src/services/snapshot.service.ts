import prisma from "../config/prisma";
import { startOfDay, endOfDay, subDays } from "date-fns";

export async function generateDailySnapshots() {
  const yesterday = subDays(new Date(), 1);
  const startDate = startOfDay(yesterday);
  const endDate = endOfDay(yesterday);

  console.log(`[Cron] Generating snapshots for: ${startDate.toDateString()}`);

  try {
    // 1. Process Raw Materials individually
    const rawMaterials = await prisma.rawMaterial.findMany();
    for (const material of rawMaterials) {
      // Each material gets its own short-lived transaction
      await prisma.$transaction(async (tx) => {
        const prevSnapshot = await tx.rawMaterialDailySnapshot.findFirst({
          where: { rawMaterialId: material.id, date: subDays(startDate, 1) },
        });
        
        const openingStock = prevSnapshot?.closingStockKg || 0;

        const txns = await tx.rawMaterialStockTransaction.findMany({
          where: {
            rawMaterialId: material.id,
            createdAt: { gte: startDate, lte: endDate },
          },
        });

        const totalIn = txns
          .filter(t => t.type === "IN")
          .reduce((acc, t) => acc + t.quantity, 0);
        const totalOut = txns
          .filter(t => t.type === "OUT")
          .reduce((acc, t) => acc + t.quantity, 0);
        
        const closingStock = openingStock + totalIn - totalOut;

        await tx.rawMaterialDailySnapshot.upsert({
          where: { rawMaterialId_date: { rawMaterialId: material.id, date: startDate } },
          update: { 
            openingStockKg: openingStock, 
            totalInKg: totalIn, 
            totalOutKg: totalOut, 
            closingStockKg: closingStock 
          },
          create: { 
            rawMaterialId: material.id, 
            date: startDate, 
            openingStockKg: openingStock, 
            totalInKg: totalIn, 
            totalOutKg: totalOut, 
            closingStockKg: closingStock 
          },
        });
      }, {
        maxWait: 5000, // Shorter wait since these are small operations
        timeout: 10000
      });
    }

    // 2. Process Finished Feed Categories individually
    const feedCategories = await prisma.feedCategory.findMany();
    for (const category of feedCategories) {
      await prisma.$transaction(async (tx) => {
        const prevSnapshot = await tx.finishedFeedDailySnapshot.findFirst({
          where: { feedCategoryId: category.id, date: subDays(startDate, 1) },
        });
        
        const openingBags = prevSnapshot?.closingBags || 0;

        const txns = await tx.finishedFeedStockTransaction.findMany({
          where: {
            feedCategoryId: category.id,
            createdAt: { gte: startDate, lte: endDate },
          },
        });

        const inBags = txns
          .filter(t => t.type === "PRODUCTION_IN")
          .reduce((acc, t) => acc + t.quantityBags, 0);
        const outBags = txns
          .filter(t => t.type === "SALE_OUT")
          .reduce((acc, t) => acc + t.quantityBags, 0);
        
        const closingBags = openingBags + inBags - outBags;

        await tx.finishedFeedDailySnapshot.upsert({
          where: { feedCategoryId_date: { feedCategoryId: category.id, date: startDate } },
          update: { openingBags, inBags, outBags, closingBags },
          create: { 
            feedCategoryId: category.id, 
            date: startDate, 
            openingBags, 
            inBags, 
            outBags, 
            closingBags 
          },
        });
      }, {
        maxWait: 5000,
        timeout: 10000
      });
    }

    console.log(`[Cron] Snapshots generated successfully for ${startDate.toDateString()}`);
  } catch (error) {
    console.error("[Cron] Failed to generate daily snapshots:", error);
    throw error; // Re-throw so the cron handler can log it
  }
}