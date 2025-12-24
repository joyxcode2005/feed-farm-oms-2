import prisma from "../config/prisma";
import { PaymentMethod } from "@prisma/client";

interface CreatePaymentInput {
  orderId: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  adminUserId: string;
  note?: string;
}

export async function createPaymentDB(input: CreatePaymentInput) {
  const { orderId, amountPaid, paymentMethod, adminUserId, note } = input;

  // Added transaction options to handle serverless database connection times
  return prisma.$transaction(async (tx) => {
    // 1. Fetch order
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        paidAmount: true,
        dueAmount: true,
        finalAmount: true,
      },
    });

    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    // 2. Prevent overpayment
    if (amountPaid > order.dueAmount) {
      throw new Error("OVERPAYMENT");
    }

    // 3. Create payment record
    const payment = await tx.payment.create({
      data: {
        orderId,
        adminUserId,
        amountPaid,
        paymentMethod,
        note,
      },
    });

    // 4. Update order amounts
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        paidAmount: {
          increment: amountPaid,
        },
        dueAmount: {
          decrement: amountPaid,
        },
      },
    });

    return {
      payment,
      order: updatedOrder,
    };
  }, {
    maxWait: 10000, // Wait up to 10 seconds to acquire a connection from the pool
    timeout: 20000  // Allow 20 seconds for the transaction logic to complete
  });
}

interface GetPaymentsByOrderInput {
  orderId: string;
}

export async function getPaymentsByOrderDB(input: GetPaymentsByOrderInput) {
  const { orderId } = input;

  return prisma.payment.findMany({
    where: { orderId },
    orderBy: {
      paymentDate: "asc",
    },
    select: {
      id: true,
      amountPaid: true,
      paymentDate: true,
      paymentMethod: true,
      note: true,
      adminUser: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

interface GetPaymentsInput {
  from?: Date;
  to?: Date;
}

export async function getPaymentsDB(input: GetPaymentsInput) {
  const { from, to } = input;

  const where: any = {};

  if (from || to) {
    where.paymentDate = {};
    if (from) where.paymentDate.gte = from;
    if (to) where.paymentDate.lte = to;
  }

  return prisma.payment.findMany({
    where,
    orderBy: {
      paymentDate: "desc"
    },
    select: {
      id: true,
      amountPaid: true,
      paymentMethod: true,
      paymentDate: true,
      note: true,
      order: {
        select: {
          id: true,
          finalAmount: true,
          dueAmount: true,
          customer: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        }
      },
      adminUser: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
}