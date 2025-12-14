import { AdminRole } from "@prisma/client";
import prisma from "../config/prisma";

export async function findAdminUser(identifier: string) {
  return prisma.adminUser.findFirst({
    where: {
      OR: [{ email: identifier }, { name: identifier }, { phone: identifier }, { id: identifier }],
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      passwordHash: true,
      role: true,
    },
  });
}

export async function updateAdminUserData(
  adminId: string,
  name?: string,
  email?: string,
  phone?: string,
) {
  return await prisma.adminUser.update({
    where: {
      id: adminId,
    },
    data: {
      name,
      email,
      phone,
    },
    select: {
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  });
}

export async function getAllAdminUsers() {
  return await prisma.adminUser.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  });
}

export async function createNewAdminUser(
  name: string,
  email: string,
  phone: string,
  password: string,
  role: AdminRole,
) {
  return prisma.adminUser.create({
    data: {
      name,
      email,
      phone,
      passwordHash: password,
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  });
}
