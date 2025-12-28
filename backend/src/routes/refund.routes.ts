import { RefundStatus } from "@prisma/client";
import { Request, Response, Router } from "express";
import { approveRefundDB, getRefundDB, rejectRefundDB } from "../controllers/refund.controller";

const router = Router();

// Route to get all refund request
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const refunds = await getRefundDB(status as RefundStatus);

    return res.status(200).json({
      success: true,
      data: refunds,
    });
  } catch (error) {
    console.error("Fetching refunds failed:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

// Route to approve a refund
router.put("/:id/approve", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminUserId = (req as any).adminId; // From auth middleware

    const updated = await approveRefundDB(id, adminUserId);

    return res.status(200).json({
      success: true,
      message: "Refund approved and ledger updated",
      data: updated,
    });
  } catch (error: any) {
    console.error("Refund approval failed:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
});

// Route to reject a refund
router.put("/:id/reject", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminUserId = (req as any).adminId;

    const updated = await rejectRefundDB(id, adminUserId);

    return res.status(200).json({
      success: true,
      message: "Refund request rejected",
      data: updated,
    });
  } catch (error) {
    console.error("Refund rejection failed:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export default router;
