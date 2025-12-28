import { DiscountType, OrderStatus, PaymentMethod } from "@prisma/client";
import prisma from "../config/prisma";

interface CreateOrderInput {
  customerId: string;
  adminUserId: string;
  items: {
    feedCategoryId: string;
    quantityBags: number;
    pricePerBag: number;
  }[];
  discountType?: DiscountType;
  discountValue?: number;
  deliveryDate: Date;
}

interface GetOrdersInput {
  status?: OrderStatus;
  from?: Date;
  to?: Date;
}

interface GetOrderByIdInput {
  orderId: string;
}

interface UpdateOrderStatusInput {
  orderId: string;
  status: OrderStatus;
}

interface UpdateOrderDeliveryDateInput {
  orderId: string;
  deliveryDate: Date;
}

interface UpdateOrderStatusInput {
  orderId: string;
  status: OrderStatus;
  adminUserId: string; // Added to track who is canceling
}

/**
 * Aggregates order totals and status breakdown for dashboard summaries.
 */
export async function getOrderSummeryDB(from: Date, to: Date) {
  // 1. Total Sales: Sum of finalAmount of all non-cancelled orders
  const salesData = await prisma.order.aggregate({
    where: {
      createdAt: { gte: from, lte: to },
      NOT: { orderStatus: "CANCELED" },
    },
    _sum: { finalAmount: true },
    _count: { id: true },
  });

  // 2. Actual Revenue: Sum of all positive payments received
  const revenueDate = await prisma.payment.aggregate({
    where: {
      paymentDate: { gte: from, lte: to },
      amountPaid: { gt: 0 },
    },
    _sum: { amountPaid: true },
  });

  // 3. Status Breakdown
  const statusCounts = await prisma.order.groupBy({
    by: ["orderStatus"],
    where: { createdAt: { gte: from, lte: to } },
    _count: { id: true },
  });

  return {
    totalSales: salesData._sum.finalAmount || 0,
    totalRevenue: revenueDate._sum.amountPaid || 0,
    statusBreakdown: statusCounts,
  };
}

/**
 * Creates an order with bulk stock validation and increased transaction timeouts.
 */
export async function createOrderDB(input: CreateOrderInput) {
  const { customerId, adminUserId, items, discountType, discountValue, deliveryDate } = input;

  return prisma.$transaction(
    async (tx) => {
      // 1. Validate customer
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
        select: { id: true },
      });

      if (!customer) {
        throw new Error("CUSTOMER_NOT_FOUND");
      }

      // 2. Optimized Stock Validation: Fetch all required stocks in ONE query
      const categoryIds = items.map((item) => item.feedCategoryId);
      const availableStocks = await tx.finishedFeedStock.findMany({
        where: { feedCategoryId: { in: categoryIds } },
      });

      let totalAmount = 0;

      for (const item of items) {
        const stock = availableStocks.find((s) => s.feedCategoryId === item.feedCategoryId);

        if (!stock || stock.quantityAvailable < item.quantityBags) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        totalAmount += item.quantityBags * item.pricePerBag;
      }

      // 3. Apply discount
      let finalAmount = totalAmount;

      if (discountType === "FLAT" && discountValue) {
        finalAmount -= discountValue;
      } else if (discountType === "PERCENTAGE" && discountValue) {
        finalAmount -= (totalAmount * discountValue) / 100;
      }

      if (finalAmount < 0) finalAmount = 0;

      // 4. Create order
      const order = await tx.order.create({
        data: {
          customerId,
          adminUserId,
          totalAmount,
          discountType,
          discountValue,
          finalAmount,
          dueAmount: finalAmount,
          deliveryDate,
        },
      });

      // 5. Create order items
      await tx.orderItem.createMany({
        data: items.map((item) => ({
          orderId: order.id,
          feedCategoryId: item.feedCategoryId,
          quantityBags: item.quantityBags,
          pricePerBag: item.pricePerBag,
          subtotal: item.quantityBags * item.pricePerBag,
        })),
      });

      return order;
    },
    {
      maxWait: 5000, // Wait up to 5 seconds to acquire a connection
      timeout: 10000, // Allow up to 10 seconds for the transaction to complete
    },
  );
}

export async function getOrdersDB(input: GetOrdersInput) {
  const { status, from, to } = input;

  const where: any = {};

  if (status) {
    where.orderStatus = status;
  }

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  return prisma.order.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      orderStatus: true,
      totalAmount: true,
      finalAmount: true,
      paidAmount: true,
      dueAmount: true,
      deliveryDate: true,
      createdAt: true,
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      items: {
        select: {
          id: true,
          quantityBags: true,
          subtotal: true,
          feedCategory: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
}

export async function getOrderByIdDB(input: GetOrderByIdInput) {
  const { orderId } = input;

  return prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderStatus: true,
      totalAmount: true,
      discountType: true,
      discountValue: true,
      finalAmount: true,
      paidAmount: true,
      dueAmount: true,
      deliveryDate: true,
      createdAt: true,
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          address: true,
        },
      },
      items: {
        select: {
          id: true,
          quantityBags: true,
          pricePerBag: true,
          subtotal: true,
          feedCategory: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      payments: {
        select: {
          id: true,
          amountPaid: true,
          paymentDate: true,
          paymentMethod: true,
          note: true,
        },
        orderBy: {
          paymentDate: "asc",
        },
      },
    },
  });
}

/**
 * Updates order status with full financial reconciliation for cancellations
 * using the existing database schema.
 */
/**
 * UPDATED: Updates order status with the new Refund Workflow.
 */
export async function updateOrderStatusDB(input: UpdateOrderStatusInput) {
  const { orderId, status, adminUserId } = input;

  return prisma.$transaction(
    async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) throw new Error("ORDER_NOT_FOUND");

      const currentStatus = order.orderStatus;
      if (currentStatus === "DELIVERED" || currentStatus === "CANCELED") {
        throw new Error("FINAL_STATE");
      }

      // --- NEW CANCELLATION LOGIC ---
      if (status === "CANCELED") {
        // 1. If customer has paid money, generate a PENDING refund request
        if (order.paidAmount > 0) {
          await tx.refund.create({
            data: {
              orderId: order.id,
              customerId: order.customerId,
              amount: order.paidAmount,
              status: "PENDING",
              reason: `Order #${orderId.slice(0, 8)} canceled`,
            },
          });
        }

        // 2. Reset order financials (Debt is cleared, paidAmount remains for record until refunded)
        await tx.order.update({
          where: { id: orderId },
          data: {
            orderStatus: "CANCELED",
            dueAmount: 0,
          },
        });

        // 3. Restore Stock if it was already out of the warehouse
        if (currentStatus === "DISPATCHED") {
          for (const item of order.items) {
            await tx.finishedFeedStock.update({
              where: { feedCategoryId: item.feedCategoryId },
              data: { quantityAvailable: { increment: item.quantityBags } },
            });

            await tx.finishedFeedStockTransaction.create({
              data: {
                feedCategoryId: item.feedCategoryId,
                adminUserId,
                type: "ADJUSTMENT",
                quantityBags: item.quantityBags,
                orderId: order.id,
                notes: "Stock restored (Order Canceled)",
              },
            });
          }
        }
        return { id: orderId, status: "CANCELED" };
      }

      // Standard transition (Pending -> Confirmed -> Dispatched, etc.)
      return tx.order.update({
        where: { id: orderId },
        data: { orderStatus: status },
      });
    },
    {
      maxWait: 5000,
      timeout: 10000,
    },
  );
}

export async function updateOrderDeliveryDateDB(input: UpdateOrderDeliveryDateInput) {
  const { orderId, deliveryDate } = input;

  return prisma.order.update({
    where: { id: orderId },
    data: { deliveryDate },
  });
}

/**
 * IMPROVED: Aggregates totals for the dashboard.
 * Distinguishes between Sales (Order value) and Revenue (Actual cash).
 */
