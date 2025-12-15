import prisma from "../config/prisma";

export async function getCustomersByState(state: string, type?: string) {
  const whereClause: any = {
    state: {
      equals: state,
      mode: "insensitive", // Case-insensitive search
    },
  };

  // Add type filter if provided
  if (type && (type === "SINGLE" || type === "DISTRIBUTER")) {
    whereClause.type = type;
  }

  return await prisma.customer.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      phone: true,
      address: true,
      type: true,
      state: true,
      latitude: true,
      longitude: true,
      createdAt: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getAllCustomers() {
  return await prisma.customer.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      address: true,
      type: true,
      state: true,
      latitude: true,
      longitude: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
