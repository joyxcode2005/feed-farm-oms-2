import { AdminRole } from "@prisma/client";
import z from "zod";


export const adminLoginSchema = z.object({
  email: z.email(),
  password: z.string().min(6).max(20),
});
