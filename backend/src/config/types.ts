import { AdminRole } from "@prisma/client";
import z from "zod";


export const adminLoginSchema = z.object({
  name: z.string().min(3).max(20),
  email: z.email(),
  phone: z.string().length(10),
  role: z.nativeEnum(AdminRole),
  password: z.string().min(6).max(20),
});
