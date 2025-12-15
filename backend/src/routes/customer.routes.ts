import { Request, Response, Router } from "express";
import { getAllCustomers, getCustomersByState } from "../controllers/customer.controller";

const router = Router();

// Get customers by state/district
router.get("/", async (req: Request, res: Response) => {
  try {
    const { state, type } = req.query;

    // If state is provided, filter by state
    if (state && typeof state === "string") {
      const customers = await getCustomersByState(state, type as string);

      return res.status(200).json({
        success: true,
        message: `Customers fetched for ${state}`,
        customers,
      });
    }

    // Otherwise get all customers
    const customers = await getAllCustomers();

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

export default router;
