import { Request, Response, Router } from "express";
import { createPaymentSchema } from "../config/types";
import { createPaymentDB, getPaymentsByOrderDB, getPaymentsDB } from "../controllers/payments.controller";

const router = Router();

/**
 * Route to create payment
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = createPaymentSchema.safeParse(req.body);
    const adminUserId = (req as any).adminId;

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const result = await createPaymentDB({
        ...parsed.data,
        adminUserId,
      });

      return res.status(201).json({
        success: true,
        message: "Payment recorded successfully",
        data: result,
      });
    } catch (err: any) {
      if (err.message === "ORDER_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (err.message === "OVERPAYMENT") {
        return res.status(400).json({
          success: false,
          message: "Payment amount exceeds due amount",
        });
      }

      throw err;
    }
  } catch (error) {
    console.error("Payment creation failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

/**
 * Route to get payments by order
 */
router.get("/orders/:id/payments", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const payments = await getPaymentsByOrderDB({ orderId: id });

    return res.status(200).json({
      success: true,
      message: "Order payments fetched successfully",
      data: payments,
    });
  } catch (error) {
    console.error("Fetching order payments failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

/**
 * Route to get all payments
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;

    const payments = await getPaymentsDB({
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined
    });

    return res.status(200).json({
      success: true,
      message: "Payments fetched successfully",
      data: payments
    });
  } catch (error) {
    console.error("Fetching payments failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!"
    });
  }
});


export default router;
