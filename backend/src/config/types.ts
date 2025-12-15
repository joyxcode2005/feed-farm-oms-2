import { MaterialUnit } from "@prisma/client";
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
