/**
 * Fetchs all refund requests with customer and order details
 */

import { RefundStatus } from "@prisma/client";
import prisma from "../config/prisma";

export async function getRefundDB(status?: RefundStatus) {
  return prisma.refund.findMany({
    where: status ? { status } : {},
    include: {
      customer: {
        select: {
          name: true,
          phone: true,
        },
      },
      order: {
        select: {
          id: true,
          finalAmount: true,
          paidAmount: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Approves a refund request and updates financial records.
 */

export async function approveRefundDB(refundId: string, adminUserId: string) {
  return prisma.$transaction(async (tx) => {
    const refund = await tx.refund.findUnique({
      where: {
        id: refundId,
      },
      include: {
        order: true,
      },
    });

    if (!refund || refund.status !== "PENDING") {
      throw new Error("REFUND_NOT_FOUND_OR_PROCESSED");
    }

    // 1. Create a negative payment entry to balance the cash ledger
    await tx.payment.create({
      data: {
        orderId: refund.orderId,
        adminUserId,
        amountPaid: -refund.amount, // Negative value for refund
        paymentMethod: "OTHER",
        note: `Approved Refund: ${refund.reason || "Order Cancellation"}`,
      },
    });

    // 2. Update the Order's paid amount to reflect the money left the buisness
    await tx.order.update({
      where: {
        id: refund.orderId,
      },
      data: {
        paidAmount: {
          decrement: refund.amount,
        },
      },
    });

    // 3. Mark the refund as APPROVED
    return tx.refund.update({
      where: {
        id: refundId,
      },
      data: {
        status: "APPROVED",
        adminUserId,
      },
    });
  });
}

/**
 * Rejects a refund request.
 */
export async function rejectRefundDB(refundId: string, adminUserId: string) {
  return prisma.refund.update({
    where: { id: refundId, status: "PENDING" },
    data: {
      status: "REJECTED",
      adminUserId,
    },
  });
}
