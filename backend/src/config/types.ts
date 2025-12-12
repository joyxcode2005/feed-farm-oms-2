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
