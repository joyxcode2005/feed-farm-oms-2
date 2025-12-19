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

// Route to creat an order in db
export async function createOrderDB(input: CreateOrderInput) {
  const { customerId, adminUserId, items, discountType, discountValue, deliveryDate } = input;

  return prisma.$transaction(async (tx) => {
    // 1. Validate customer
    const customer = await tx.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });

    if (!customer) {
      throw new Error("Customer not found!!");
    }

    // 2. Validate stock & calcuate totals
    let totalAmount = 0;

    for (const item of items) {
      const stock = await tx.finishedFeedStock.findUnique({
        where: { feedCategoryId: item.feedCategoryId },
      });

      if (!stock || stock.quantityAvailable < item.quantityBags) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      totalAmount += item.quantityBags * item.pricePerBag;
    }

    // 3. Apply discount
    let finalAmount = totalAmount;

    if (discountType === "FLAT" && discountValue) {
      finalAmount -= discountValue;
    }

    if (discountType === "PERCENTAGE" && discountValue) {
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

    // 6. Deduct stock + ledger
    for (const item of items) {
      await tx.finishedFeedStock.update({
        where: { feedCategoryId: item.feedCategoryId },
        data: {
          quantityAvailable: {
            decrement: item.quantityBags,
          },
        },
      });

      await tx.finishedFeedStockTransaction.create({
        data: {
          feedCategoryId: item.feedCategoryId,
          adminUserId,
          type: "SALE_OUT",
          quantityBags: item.quantityBags,
          orderId: order.id,
        },
      });
    }
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

interface UpdateOrderStatusInput {
  orderId: string;
  status: OrderStatus;
}

export async function updateOrderStatusDB(input: UpdateOrderStatusInput) {
  const { orderId, status } = input;

  return prisma.$transaction(async (tx) => {
    // 1. Fetch order with items
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    const currentStatus = order.orderStatus;

    // 2. Enforce state machine (DB safety)
    if (currentStatus === "DELIVERED" || currentStatus === "CANCELED") {
      throw new Error("FINAL_STATE");
    }

    if (status === "PENDING") {
      throw new Error("CANNOT_REVERT_TO_PENDING");
    }

    // 3. Handle cancellation stock rollback
    if (status === "CANCELED" && currentStatus !== "DISPATCHED") {
      // Restore stock
      for (const item of order.items) {
        await tx.finishedFeedStock.update({
          where: { feedCategoryId: item.feedCategoryId },
          data: {
            quantityAvailable: {
              increment: item.quantityBags,
            },
          },
        });

        await tx.finishedFeedStockTransaction.create({
          data: {
            feedCategoryId: item.feedCategoryId,
            adminUserId: order.adminUserId,
            type: "ADJUSTMENT",
            quantityBags: item.quantityBags,
            notes: "Order cancelled – stock restored",
            orderId: order.id,
          },
        });
      }
    }

    // 4. Update order status
    return tx.order.update({
      where: { id: orderId },
      data: {
        orderStatus: status,
      },
    });
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
