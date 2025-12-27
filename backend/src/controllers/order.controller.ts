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

/**
 * Aggregates order totals and status breakdown for dashboard summaries.
 */
export async function getOrderSummaryDB(from: Date, to: Date) {
  const totals = await prisma.order.aggregate({
    where: {
      createdAt: { gte: from, lte: to }
    },
    _sum: {
      finalAmount: true,
      paidAmount: true,
      dueAmount: true,
    },
    _count: {
      id: true,
    }
  });

  const statusCounts = await prisma.order.groupBy({
    by: ['orderStatus'],
    where: {
      createdAt: { gte: from, lte: to }
    },
    _count: {
      id: true,
    }
  });

  return {
    totals: totals._sum,
    totalOrders: totals._count.id,
    statusBreakdown: statusCounts
  };
}

/**
 * Creates an order with bulk stock validation and increased transaction timeouts.
 */
export async function createOrderDB(input: CreateOrderInput) {
  const { customerId, adminUserId, items, discountType, discountValue, deliveryDate } = input;

  return prisma.$transaction(async (tx) => {
    // 1. Validate customer
    const customer = await tx.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });

    if (!customer) {
      throw new Error("CUSTOMER_NOT_FOUND");
    }

    // 2. Optimized Stock Validation: Fetch all required stocks in ONE query
    const categoryIds = items.map(item => item.feedCategoryId);
    const availableStocks = await tx.finishedFeedStock.findMany({
      where: { feedCategoryId: { in: categoryIds } }
    });

    let totalAmount = 0;

    for (const item of items) {
      const stock = availableStocks.find(s => s.feedCategoryId === item.feedCategoryId);

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
  }, {
    maxWait: 5000, // Wait up to 5 seconds to acquire a connection
    timeout: 10000 // Allow up to 10 seconds for the transaction to complete
  });
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
export async function updateOrderStatusDB(input: UpdateOrderStatusInput) {
  const { orderId, status } = input;

  return prisma.$transaction(async (tx) => {
    // 1. Fetch order with items and current status
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    const currentStatus = order.orderStatus;

    // 2. Block invalid final states
    if (currentStatus === "DELIVERED" || currentStatus === "CANCELED") {
      throw new Error("FINAL_STATE");
    }

    // 3. HANDLE CANCELLATION LOGIC
    if (status === "CANCELED") {
      const advanceAmount = order.paidAmount;
      const orderDueAmount = order.dueAmount;

      // A. Update the order financials: reset debt and payments
      await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: "CANCELED",
          dueAmount: 0,
          paidAmount: 0, 
        },
      });

      // B. Record a Refund if there was an advance payment
      if (advanceAmount > 0) {
        await tx.payment.create({
          data: {
            orderId: order.id,
            adminUserId: order.adminUserId,
            amountPaid: -advanceAmount, // Negative entry to balance the ledger
            paymentMethod: "OTHER",
            note: `Refund: Order #${orderId.slice(0, 8)} canceled`,
          },
        });
      }

      // C. Update Customer Snapshot (decrementing existing schema fields)
      const latestSnapshot = await tx.customerSummarySnapshot.findFirst({
        where: { customerId: order.customerId },
        orderBy: { date: "desc" },
      });

      if (latestSnapshot) {
        await tx.customerSummarySnapshot.update({
          where: { id: latestSnapshot.id },
          data: {
            totalDue: { decrement: orderDueAmount },
            totalPaid: { decrement: advanceAmount },
            totalOrders: { decrement: 1 }, // Remove from total count
          },
        });
      }

      // D. Restore Stock (if previously dispatched)
      if (currentStatus === "DISPATCHED") {
        for (const item of order.items) {
          await tx.finishedFeedStock.update({
            where: { feedCategoryId: item.feedCategoryId },
            data: { quantityAvailable: { increment: item.quantityBags } },
          });

          await tx.finishedFeedStockTransaction.create({
            data: {
              feedCategoryId: item.feedCategoryId,
              adminUserId: order.adminUserId,
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

    // 4. Standard Status Update Logic
    return tx.order.update({
      where: { id: orderId },
      data: { orderStatus: status },
    });
  }, {
    maxWait: 5000,
    timeout: 10000 
  });
}

interface UpdateOrderDeliveryDateInput {
  orderId: string;
  deliveryDate: Date;
}

export async function updateOrderDeliveryDateDB(input: UpdateOrderDeliveryDateInput) {
  const { orderId, deliveryDate } = input;

  return prisma.order.update({
    where: { id: orderId },
    data: { deliveryDate },
  });
}