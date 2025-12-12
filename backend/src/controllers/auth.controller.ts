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
