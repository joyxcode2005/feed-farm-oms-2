import prisma from "../config/prisma";

export async function existingAdminUser(email: string) {
  return await prisma.adminUser.findFirst({
    where: {
      email,
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

export async function getAdminUserData(id: string) {
  return await prisma.adminUser.findFirst({
    where: {
      id,
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
