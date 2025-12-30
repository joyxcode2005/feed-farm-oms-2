import { Request, Response, Router } from "express";
import {
  checkExistingCustomer,
  createCustomerDB,
  getAllCustomersDB,
  getCustomerByIdDB,
  getCustomerLedgerDB,
  getCustomerOrdersByIdDB,
  getCustomerOrdersDB,
  getCustomersByDistrict,
  getCustomerSnapshotsDB,
  updateCustomerDB,
  getAllCustomersFinancialSummaryDB,
} from "../controllers/customer.controller";
import { createCustomerSchema, updateCustomerSchema } from "../config/types";
// FIX 1: Correct import name
import { adminUserMiddleware } from "../middlewares/auth.middleware"; 

const router = Router();

/**
 * Route to create a new customer
 */
// FIX 2: Use correct middleware name
router.post("/", adminUserMiddleware, async (req: Request, res: Response) => {
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
      const customerData = {
        ...parsed.data,
        // FIX 3: Correctly access adminId from middleware
        createdByAdminId: (req as any).adminId, 
      };

      const customer = await createCustomerDB(customerData);

      return res.status(201).json({
        success: true,
        message: "Customer created successfully",
        data: customer,
      });
    } catch (err: any) {
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

/**
 * Route to check/get existing customer based on phone number
 */
router.get("/phone", async (req: Request, res: Response) => {
  try {
    const { phone } = req.query;

    if (!phone || typeof phone !== "string") {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const existingCustomer = await checkExistingCustomer(phone);

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer found",
      data: existingCustomer,
    });
  } catch (error) {
    console.error("Check customer failed:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

/**
 * New Route: Get financial summary for all customers
 */
router.get("/financial-summary", async (req: Request, res: Response) => {
  try {
    const summary = await getAllCustomersFinancialSummaryDB();
    return res.status(200).json({ success: true, data: summary });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

/**
 * Route to get all customers with filters
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { district, type } = req.query;

    if (district && typeof district === "string") {
      const customers = await getCustomersByDistrict(district, type as string);
      return res.status(200).json({
        success: true,
        message: `Customers fetched for ${district}`,
        data: customers,
      });
    }

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
    console.error("Error fetching customers:", error);
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
 * Route to get total due for a specific customer
 */
router.get("/:id/total-due", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await getCustomerOrdersByIdDB({ customerId: id });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const totalDue = customer.orders.reduce((sum, order) => sum + order.dueAmount, 0);

    if (totalDue === 0) {
      return res.status(200).json({
        success: true,
        message: "Customer has no due amount to pay",
        customerTotalDue: 0.0,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer due amount fetched successfully",
      customerTotalDue: totalDue,
    });
  } catch (error) {
    console.error("Fetching customer due failed:", error);
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
      if (err.code === "P2002")
        return res.status(409).json({ success: false, message: "Customer with this phone already exists" });
      if (err.code === "P2025")
        return res.status(404).json({ success: false, message: "Customer not found" });
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
    const orders = await getCustomerOrdersDB({ customerId: req.params.id });
    return res
      .status(200)
      .json({ success: true, message: "Customer orders fetched successfully", data: orders });
  } catch (error) {
    console.error("Fetching customer orders failed:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error!!" });
  }
});

/**
 * Route to get customer ledger
 */
router.get("/:id/ledger", async (req: Request, res: Response) => {
  try {
    const ledger = await getCustomerLedgerDB({ customerId: req.params.id });
    return res
      .status(200)
      .json({ success: true, message: "Customer ledger fetched successfully", data: ledger });
  } catch (error) {
    console.error("Fetching customer ledger failed:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error!!" });
  }
});

/**
 * Route to get customer daily snapshots
 */
router.get("/:id/snapshots", async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    const snapshots = await getCustomerSnapshotsDB({
      customerId: req.params.id,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
    });
    return res
      .status(200)
      .json({ success: true, message: "Customer snapshots fetched successfully", data: snapshots });
  } catch (error) {
    console.error("Fetching customer snapshots failed:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error!!" });
  }
});

export default router;