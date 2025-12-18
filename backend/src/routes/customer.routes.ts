import { Request, Response, Router } from "express";
import {
  createCustomerDB,
  getAllCustomersDB,
  getCustomerByIdDB,
  getCustomerLedgerDB,
  getCustomerOrdersDB,
  getCustomersByDistrict,
  getCustomerSnapshotsDB,
  updateCustomerDB,
} from "../controllers/customer.controller";
import { createCustomerSchema, updateCustomerSchema } from "../config/types";

const router = Router();

/**
 * Route to create a new customer
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = createCustomerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const customer = await createCustomerDB(parsed.data);

      return res.status(201).json({
        success: true,
        message: "Customer created successfully",
        data: customer,
      });
    } catch (err: any) {
      // Unique phone constraint
      if (err.code === "P2002") {
        return res.status(409).json({
          success: false,
          message: "Customer with this phone already exists",
        });
      }
      throw err;
    }
  } catch (error) {
    console.error("Customer creation failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

// Get customers by district/district
router.get("/", async (req: Request, res: Response) => {
  try {
    const { district, type } = req.query;

    // If district is provided, filter by district
    if (district && typeof district === "string") {
      const customers = await getCustomersByDistrict(district, type as string);

      return res.status(200).json({
        success: true,
        message: `Customers fetched for ${district}`,
        customers,
      });
    }

    // Otherwise get all customers
    const customers = await getAllCustomersDB({});

    return res.status(200).json({
      success: true,
      message: "All customers fetched",
      customers,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

/**
 * Route to get all customers
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { type, district } = req.query;

    const customers = await getAllCustomersDB({
      type: type as any,
      district: district as string | undefined,
    });

    return res.status(200).json({
      success: true,
      message: "Customers fetched successfully",
      data: customers,
    });
  } catch (error) {
    console.error("Fetching customers failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

/**
 * Route to get customer by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await getCustomerByIdDB({ customerId: id });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer fetched successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Fetching customer failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

/**
 * Route to update customer
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const parsed = updateCustomerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const customer = await updateCustomerDB({
        customerId: req.params.id,
        ...parsed.data,
      });

      return res.status(200).json({
        success: true,
        message: "Customer updated successfully",
        data: customer,
      });
    } catch (err: any) {
      if (err.code === "P2002") {
        return res.status(409).json({
          success: false,
          message: "Customer with this phone already exists",
        });
      }

      if (err.code === "P2025") {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      throw err;
    }
  } catch (error) {
    console.error("Customer update failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

/**
 * Route to get all orders for a customer
 */
router.get("/:id/orders", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const orders = await getCustomerOrdersDB({ customerId: id });

    return res.status(200).json({
      success: true,
      message: "Customer orders fetched successfully",
      data: orders,
    });
  } catch (error) {
    console.error("Fetching customer orders failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

/**
 * Route to get customer ledger
 */
router.get("/:id/ledger", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const ledger = await getCustomerLedgerDB({ customerId: id });

    return res.status(200).json({
      success: true,
      message: "Customer ledger fetched successfully",
      data: ledger,
    });
  } catch (error) {
    console.error("Fetching customer ledger failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

/**
 * Route to get customer daily snapshots
 */
router.get("/:id/snapshots", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { from, to } = req.query;

    const snapshots = await getCustomerSnapshotsDB({
      customerId: id,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
    });

    return res.status(200).json({
      success: true,
      message: "Customer snapshots fetched successfully",
      data: snapshots,
    });
  } catch (error) {
    console.error("Fetching customer snapshots failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

export default router;
