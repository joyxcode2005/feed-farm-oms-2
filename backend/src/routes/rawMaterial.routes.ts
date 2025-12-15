import { raw, Request, Response, Router } from "express";
import {
  createRawMaterialSchema,
  rawMaterialStockAdjustSchema,
  rawMaterialStockInSchema,
  rawMaterialStockOutSchema,
} from "../config/types";
import {
  checkExistingRawMaterial,
  createRawMaterial,
  createRawMaterialStockTxn,
  existingRawMaterial,
  getAllRawMaterials,
  getAllRawMaterialTxns,
  getRawMaterialLedger,
  getRawMaterialSnapshots,
} from "../controllers/rawMaterial.controller";

const router = Router();

// Route to create a new raw material entry
router.post("/", async (req: Request, res: Response) => {
  try {
    // Parse the body data correctly
    const { success, error, data } = createRawMaterialSchema.safeParse(req.body);

    if (!success)
      return res.status(401).json({
        success: false,
        message: "Invalid Input!!",
        error: error.flatten().fieldErrors,
      });

    // Destructure the data from the parse body
    const { name, unit } = data;

    // Check if the data is present or not
    if (!name || !unit)
      return res.status(400).json({ message: "Raw material name or unit is required" });

    // Check existing raw materials
    const existing = await checkExistingRawMaterial(name);

    if (existing)
      return res.status(409).json({
        success: false,
        message: "Raw material already exists!!",
      });

    // Create new raw material entry
    const newRawMaterial = await createRawMaterial(name, unit);

    if (!newRawMaterial)
      return res.status(402).json({
        success: false,
        message: "Failed to crate raw new raw material entry!!",
      });

    return res.status(201).json({
      success: true,
      message: "New raw material entry created successfully!!",
      newRawMaterial,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

//  Route to get the list of all the raw materials
router.get("/", async (req: Request, res: Response) => {
  try {
    // Get all the raw materials
    const materials = await getAllRawMaterials();

    // Calculate the current stock for each raw material
    const data = materials.map((material) => {
      let currentStock = 0;

      for (const txn of material.stockTxns) {
        if (txn.type === "OUT") {
          currentStock -= txn.quantity;
        } else {
          currentStock += txn.quantity;
        }
      }

      return {
        id: material.id,
        name: material.name,
        unit: material.unit,
        currentStock,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Raw material retrived successfully!!",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

// Route to add raw material stock (IN)
router.post("/:id/stock/in", async (req: Request, res: Response) => {
  try {
    // Parse the body data properly
    const { success, error, data } = rawMaterialStockInSchema.safeParse(req.body);
    const adminUserId = (req as any).adminId;

    if (!success)
      return res.status(402).json({
        success: false,
        message: "Invalid Input!!",
        error: error.flatten().fieldErrors,
      });

    // Destructure the data from the parsed data
    const { quantity, referenceId, referenceType, notes } = data;

    if (!quantity)
      return res.status(402).json({
        success: false,
        message: "Quantity is required!!",
      });

    // Get the raw material id from the query params
    const rawMaterialId = req.params.id;

    // Create a new raw material stock in txn...
    const txn = await createRawMaterialStockTxn(
      rawMaterialId,
      adminUserId,
      quantity,
      "IN",
      referenceId,
      referenceType,
      notes,
    );

    return res.status(201).json({
      success: true,
      message: "Raw material stock added successfully!!",
      data: txn,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

// Route to add a raw material stock (OUT)
router.post("/:id/stock/out", async (req: Request, res: Response) => {
  try {
    // Parse the request body safely!!
    const { success, error, data } = rawMaterialStockOutSchema.safeParse(req.body);
    const adminUserId = (req as any).adminId;

    if (!success)
      return res.status(400).json({
        success: false,
        message: "Invalid Input!!",
        errors: error.flatten().fieldErrors,
      });

    // Destructure the body
    const { quantity, referenceType, referenceId, notes } = data;

    // Get the raw material id form the query params
    const rawMaterialId = req.params.id;

    const material = await existingRawMaterial(rawMaterialId);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Raw material not found or Out of stock!!",
      });
    }

    // Calculate current stock
    const txns = await getAllRawMaterialTxns(rawMaterialId);

    const currentStock = txns.reduce((sum, txn) => {
      if (txn.type === "OUT") return sum - txn.quantity;
      return sum + txn.quantity;
    }, 0);

    if (currentStock < quantity)
      return res.status(400).json({
        success: false,
        message: "Insufficient raw material stock",
      });

    // Create a raw material out txn
    const txn = await createRawMaterialStockTxn(
      rawMaterialId,
      adminUserId,
      quantity,
      "OUT",
      referenceId,
      referenceType,
      notes,
    );

    if (!txn)
      return res.status(400).json({
        success: false,
        message: "Failed to add the transaction!! try again!!!",
      });

    return res.status(201).json({
      success: true,
      message: "Out transaction for the raw material added successfully!!",
      txn,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!!",
    });
  }
});

// Route to add a raw material stock (ADJUSTMENT)
router.post("/:id/stock/adjust", async (req: Request, res: Response) => {
  try {
    // Safely parse the request body
    const { success, error, data } = rawMaterialStockAdjustSchema.safeParse(req.body);
    // Get admin user id from middleware
    const adminUserId = (req as any).adminId;

    if (!success)
      return res.status(400).json({
        success: false,
        message: "Validation error!!",
        errors: error.flatten().fieldErrors,
      });

    // Destructure the request body
    const { quantity, reason } = data;

    // Gete the raw materials id from request params
    const rawMaterialId = req.params.id;

    // Check if raw material already exists
    const material = await existingRawMaterial(rawMaterialId);

    if (!material)
      return res.status(404).json({
        success: false,
        message: "Raw material not found!!",
      });

    // Create a raw material txn for adjustments
    const txn = await createRawMaterialStockTxn(
      rawMaterialId,
      adminUserId,
      quantity,
      "ADJUSTMENT",
      reason,
    );

    if (!txn)
      return res.status(402).json({
        success: false,
        message: "Failed to adjust stock of raw material!!",
      });

    return res.status(201).json({
      success: true,
      message: "Raw material stock adjusted successfully!!",
      data: txn,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

// Route to get ledger for a raw material
router.get("/:id/ledger", async (req: Request, res: Response) => {
  // Get the raw material id and from - to dates from query params
  const rawMaterialId = req.params.id;
  const { from, to } = req.query;

  try {
    //Get existing raw material
    const material = await existingRawMaterial(rawMaterialId);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Raw material not found",
      });
    }

    const whereClause: any = { rawMaterialId };

    if (from || to) {
      whereClause.createdAt = {};
      if (from) whereClause.createdAt.gte = new Date(from as string);
      if (to) whereClause.createdAt.lte = new Date(to as string);
    }

    // Get ledger for raw material
    const ledger = await getRawMaterialLedger(whereClause);

    return res.status(200).json({
      success: true,
      data: {
        rawMaterial: material,
        ledger,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error!!",
    });
  }
});

// Route to get the daily snapshots of raw material
router.get("/:id/snapshots", async (req: Request, res: Response) => {
  const rawMaterialId = req.params.id;
  const { from, to } = req.query;

  try {
    // Get existing raw material
    const material = await existingRawMaterial(rawMaterialId);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Raw material not found",
      });
    }

    // Set up the where clause, if from and to is mentioned then add them to the where clause as from and to are optional!!
    const whereClause: any = { rawMaterialId };

    if (from || to) {
      whereClause.date = {};
      if (from) whereClause.date.gte = new Date(from as string);
      if (to) whereClause.date.lte = new Date(to as string);
    }

    // Get the snapshot for the raw material
    const snapshots = await getRawMaterialSnapshots(whereClause);

    if (!snapshots)
      return res.status(401).json({
        success: false,
        message: "Failed to get raw material snapshots!!",
      });

    return res.status(201).json({
      success: true,
      message: "Raw material snapshot fetched!!",
      data: {
        rawMaterial: material,
        snapshots,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

export default router;
