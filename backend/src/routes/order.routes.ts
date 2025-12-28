import { Request, Response, Router } from "express";
import {
  createOrderSchema,
  deliveryDateSchema,
  statusSchema,
  validTransitions,
} from "../config/types";
import {
  createOrderDB,
  getOrderByIdDB,
  getOrdersDB,
  getOrderSummeryDB,
  updateOrderDeliveryDateDB,
  updateOrderStatusDB,
} from "../controllers/order.controller";
import { OrderStatus } from "@prisma/client";

const router = Router();

/**
 * NEW: Route to get order summary for dashboard
 * This must come before "/:id"
 */
router.get("/summary", async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: "Date range (from, to) is required",
      });
    }

    const summary = await getOrderSummeryDB(new Date(from as string), new Date(to as string));

    return res.status(200).json(summary);
  } catch (error) {
    console.error("Fetching order summary failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

/**
 * Route to create order
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = createOrderSchema.safeParse(req.body);
    const adminUserId = (req as any).adminId;

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const order = await createOrderDB({
        ...parsed.data,
        adminUserId,
        deliveryDate: new Date(parsed.data.deliveryDate),
      });

      return res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: order,
      });
    } catch (err: any) {
      if (err.message === "CUSTOMER_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      if (err.message === "INSUFFICIENT_STOCK") {
        return res.status(400).json({
          success: false,
          message: "Insufficient finished feed stock",
        });
      }

      throw err;
    }
  } catch (error) {
    console.error("Order creation failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

/**
 * Route to get all orders
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, from, to } = req.query;

    const orders = await getOrdersDB({
      status: status ? (status as OrderStatus) : undefined,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
    });

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: orders,
    });
  } catch (error) {
    console.error("Fetching orders failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

/**
 * Route to get order by id
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await getOrderByIdDB({ orderId: id });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      data: order,
    });
  } catch (error) {
    console.error("Fetching order failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

/**
 * Route to update order status
 */
router.put("/:id/status", async (req: Request, res: Response) => {
  try {
    const parsed = statusSchema.safeParse(req.body);
  const { adminUserId } = (req as any).adminId;
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { id } = req.params;
    const newStatus = parsed.data.status;

    const existingOrder = await getOrderByIdDB({ orderId: id });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const allowed = validTransitions[existingOrder.orderStatus];

    if (!allowed.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${existingOrder.orderStatus} to ${newStatus}`,
      });
    }

    const updated = await updateOrderStatusDB({
      orderId: id,
      status: newStatus,
      adminUserId,
    });

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Updating order status failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

/**
 * Route to update delivery date
 */
router.put("/:id/delivery-date", async (req: Request, res: Response) => {
  try {
    const parsed = deliveryDateSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery date",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { id } = req.params;

    const existingOrder = await getOrderByIdDB({ orderId: id });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const updated = await updateOrderDeliveryDateDB({
      orderId: id,
      deliveryDate: new Date(parsed.data.deliveryDate),
    });

    return res.status(200).json({
      success: true,
      message: "Order delivery date updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Updating delivery date failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

export default router;
