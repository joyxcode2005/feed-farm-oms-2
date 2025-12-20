import { MaterialUnit, OrderStatus, PaymentMethod } from "@prisma/client";
import z from "zod";

// Admin login schema
export const adminLoginSchema = z.object({
  email: z.email(),
  password: z.string().min(6).max(20),
});

// Admin data update schema
export const adminUpdateSchema = z.object({
  email: z.email().optional(),
  name: z.string().min(3).max(20).optional(),
  phone: z.string().length(10).optional(),
});

// Admin create new admin schema
export const createNewAdminSchema = z.object({
  email: z.email(),
  name: z.string().min(3).max(20),
  phone: z.string().length(10),
  password: z.string().min(6).max(10),
});

export const createRawMaterialSchema = z.object({
  name: z.string().trim(),
  unit: z.nativeEnum(MaterialUnit),
});

export const rawMaterialStockInSchema = z.object({
  quantity: z.number().positive("Quantity must be greater then 0"),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
});

export const rawMaterialStockOutSchema = z.object({
  quantity: z.number().positive("Quantity must be greater than 0"),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
});

export const rawMaterialStockAdjustSchema = z.object({
  quantity: z.number().refine((v) => v !== 0, {
    message: "Adjustment quantity cannot be zero",
  }),
  reason: z.string().min(1, "Reason is required!!"),
});

export const productionSchema = z.object({
  feedCategoryId: z.string().uuid(),
  producedBags: z.number().positive(),
  productionDate: z.string(),
  notes: z.string().optional(),
  materialsUsed: z.array(
    z.object({
      rawMaterialId: z.string().uuid(),
      quantity: z.number().positive(),
    }),
  ),
});

export const finishedFeedSaleSchema = z.object({
  feedCategoryId: z.string().uuid(),
  orderId: z.string().uuid(),
  quantityBags: z.number().positive(),
  adminUserId: z.string().uuid(),
  notes: z.string().optional(),
});

export const finishedFeedAdjustSchema = z.object({
  feedCategoryId: z.string().uuid(),
  quantityBags: z.number().refine((v) => v !== 0, {
    message: "Adjustment quantity cannot be zero",
  }),
  reason: z.string().min(1, "Reason is required"),
});

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(8, "Phone is required"),
  address: z.string().optional(),
  type: z.enum(["SINGLE", "DISTRIBUTER"]).optional(),
  district: z.string(),
  createdByAdminId: z.string().uuid().optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(8).optional(),
  address: z.string().optional(),
  type: z.enum(["SINGLE", "DISTRIBUTER"]).optional(),
  district: z.string(),
});

export const createOrderSchema = z.object({
  customerId: z.string().uuid(),
  items: z
    .array(
      z.object({
        feedCategoryId: z.string().uuid(),
        quantityBags: z.number().positive(),
        pricePerBag: z.number().positive(),
      }),
    )
    .min(1),
  discountType: z.enum(["FLAT", "PERCENTAGE"]).optional(),
  discountValue: z.number().positive().optional(),
  deliveryDate: z.string(),
});

export const statusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELED"],
  CONFIRMED: ["DISPATCHED", "CANCELED"],
  DISPATCHED: ["DELIVERED"],
  DELIVERED: [],
  CANCELED: [],
};

export const deliveryDateSchema = z.object({
  deliveryDate: z.string().min(1),
});

export const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
  amountPaid: z.number().positive(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  note: z.string().optional(),
});
