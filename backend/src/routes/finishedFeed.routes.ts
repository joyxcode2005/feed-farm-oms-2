import { Request, Response, Router } from "express";
import {
  adjustFinishedFeedStockDB,
  createProductionBatchDB,
  deductFinishedFeedStockDB,
  getFinishedFeedCategoryWithStock,
  getFinishedFeedLedgerDB,
  getFinishedFeedSnapshotsDB,
} from "../controllers/finishedFeed.controller";
import {
  finishedFeedAdjustSchema,
  finishedFeedSaleSchema,
  productionSchema,
} from "../config/types";

const router = Router();

// Route to get all finished feed stock
router.get("/stock", async (req: Request, res: Response) => {
  try {
    // Fetch the feed catagory with stock
    const categories = await getFinishedFeedCategoryWithStock();

    // Structure the data from the prisma properly!!
    const data = categories.map((item) => ({
      feedCategroyId: item.id,
      animalType: item.animalType.name,
      feedName: item.name,
      unitSize: item.unitSizeKg,
      quantityAvailableBags: item.stock?.quantityAvailable ?? 0,
    }));

    return res.status(200).json({
      success: true,
      message: "Feed Catagory with stock fetched",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

// Route add finished feed production route
router.post("/production", async (req: Request, res: Response) => {
  try {
    // Validate input
    const parsed = productionSchema.safeParse(req.body);
    const adminUserId = (req as any).adminId;

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { feedCategoryId, producedBags, productionDate, materialsUsed, notes } = parsed.data;

    // Call DB controller
    const result = await createProductionBatchDB({
      feedCategoryId,
      producedBags,
      productionDate: new Date(productionDate),
      materialsUsed,
      adminUserId,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Production batch recorded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Finished feed production failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

// Route to deduct finished feed stock after sale
router.post("/sale", async (req: Request, res: Response) => {
  try {
    const parsed = finishedFeedSaleSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { feedCategoryId, orderId, quantityBags, adminUserId, notes } = parsed.data;

    try {
      const result = await deductFinishedFeedStockDB({
        feedCategoryId,
        orderId,
        quantityBags,
        adminUserId,
        notes,
      });

      return res.status(201).json({
        success: true,
        message: "Finished feed stock deducted successfully",
        data: result,
      });
    } catch (err: any) {
      if (err.message === "INSUFFICIENT_STOCK") {
        return res.status(400).json({
          success: false,
          message: "Insufficient finished feed stock",
        });
      }
      throw err;
    }
  } catch (error) {
    console.error("Finished feed sale failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

// Route to adjust finished feed stock
router.post("/adjust", async (req: Request, res: Response) => {
  try {
    const parsed = finishedFeedAdjustSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { feedCategoryId, quantityBags, adminUserId, reason } = parsed.data;

    const result = await adjustFinishedFeedStockDB({
      feedCategoryId,
      quantityBags,
      adminUserId,
      reason,
    });

    return res.status(201).json({
      success: true,
      message: "Finished feed stock adjusted successfully",
      data: result,
    });
  } catch (error: any) {
  if (error.message === "FEED_CATEGORY_NOT_FOUND") {
    return res.status(404).json({
      success: false,
      message: "Feed category does not exist"
    });
  }

  console.error("Finished feed adjustment failed:", error);

  return res.status(500).json({
    success: false,
    message: "Internal Server Error!!",
  });
}
});

// Route to get finished feed ledger
router.get("/:feedCategoryId/ledger", async (req: Request, res: Response) => {
  try {
    const { feedCategoryId } = req.params;
    const { from, to } = req.query;

    const ledger = await getFinishedFeedLedgerDB({
      feedCategoryId,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
    });

    return res.status(200).json({
      success: true,
      message: "Finished feed ledger fetched successfully",
      data: ledger,
    });
  } catch (error) {
    console.error("Finished feed ledger fetch failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

// Route to get finished feed daily snapshots
router.get("/:feedCategoryId/snapshots", async (req: Request, res: Response) => {
  try {
    const { feedCategoryId } = req.params;
    const { from, to } = req.query;

    const snapshots = await getFinishedFeedSnapshotsDB({
      feedCategoryId,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
    });

    return res.status(200).json({
      success: true,
      message: "Finished feed snapshots fetched successfully",
      data: snapshots,
    });
  } catch (error) {
    console.error("Finished feed snapshots fetch failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});



export default router;
