import prisma from "../config/prisma";

interface CreateCustomerInput {
  name: string;
  phone: string;
  address?: string;
  type?: "SINGLE" | "DISTRIBUTER";
  district: string;
  createdByAdminId?: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface GetAllCustomersInput {
  type?: "SINGLE" | "DISTRIBUTER";
  district?: string;
}

export async function checkExistingCustomer(phone: string) {
  return prisma.customer.findFirst({
    where: { phone },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      district: true,
    },
  });
}

export async function createCustomerDB(input: CreateCustomerInput) {
  const { name, phone, address, type, district, createdByAdminId, latitude, longitude } = input;
  return prisma.customer.create({
    data: { 
      name, 
      phone, 
      address, 
      type, 
      district, 
      createdByAdminId,
      latitude,
      longitude
    },
  });
}

export async function getCustomersByDistrict(district: string, type?: string) {
  const whereClause: any = {
    district: { equals: district, mode: "insensitive" },
  };
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
      district: true,
      createdAt: true,
      latitude: true,
      longitude: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function getAllCustomersDB(input: GetAllCustomersInput) {
  const { type, district } = input;
  const where: any = {};
  if (type) where.type = type;
  if (district) where.district = district;
  return prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      type: true,
      district: true,
      latitude: true,
      longitude: true,
      createdAt: true,
    },
  });
}

export async function getCustomerByIdDB(input: { customerId: string }) {
  const { customerId } = input;
  return prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      name: true,
      phone: true,
      address: true,
      type: true,
      district: true,
      createdAt: true,
      updatedAt: true,
      latitude: true,
      longitude: true,
    },
  });
}

export async function getCustomerOrdersByIdDB(input: { customerId: string }) {
  const { customerId } = input;
  return prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      district: true,
      createdAt: true,
      updatedAt: true,
      orders: true,
    },
  });
}

export async function updateCustomerDB(input: any) {
  const { customerId, ...data } = input;
  return prisma.customer.update({
    where: { id: customerId },
    data,
  });
}

export async function getCustomerOrdersDB(input: { customerId: string }) {
  const { customerId } = input;
  return prisma.order.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderStatus: true,
      totalAmount: true,
      finalAmount: true,
      paidAmount: true,
      dueAmount: true,
      createdAt: true,
      deliveryDate: true,
      items: {
        select: {
          id: true,
          quantityBags: true,
          pricePerBag: true,
          subtotal: true,
          feedCategory: { select: { name: true } },
        },
      },
    },
  });
}

export async function getCustomerLedgerDB(input: { customerId: string }) {
  const { customerId } = input;
  const orders = await prisma.order.findMany({
    where: { customerId },
    select: {
      id: true,
      totalAmount: true,
      finalAmount: true,
      paidAmount: true,
      dueAmount: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" }
  });
  const payments = await prisma.payment.findMany({
    where: { order: { customerId } },
    select: {
      id: true,
      amountPaid: true,
      paymentDate: true,
      paymentMethod: true,
      orderId: true,
    },
    orderBy: { paymentDate: "desc" }
  });
  
  const totalOrders = orders.length;
  const totalPurchased = orders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const totalDue = orders.reduce((sum, o) => sum + (o.dueAmount || 0), 0);

  return { 
    summary: { 
      totalOrders, 
      totalPurchased,
      totalPaid, 
      totalDue 
    }, 
    orders, 
    payments 
  };
}

export async function getCustomerSnapshotsDB(input: any) {
  const { customerId, from, to } = input;
  const where: any = { customerId };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = from;
    if (to) where.date.lte = to;
  }
  return prisma.customerSummarySnapshot.findMany({
    where,
    orderBy: { date: "asc" },
    select: { date: true, totalOrders: true, totalPaid: true, totalDue: true, lastOrderAt: true },
  });
}

// --- UPDATED FUNCTION ---
export async function getAllCustomersFinancialSummaryDB() {
  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      district: true,
      // Include these for the map:
      latitude: true,
      longitude: true,
      type: true,
      address: true,
      orders: {
        select: {
          finalAmount: true,
          paidAmount: true,
          dueAmount: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return customers.map((customer) => {
    const totals = customer.orders.reduce(
      (acc, order) => {
        acc.totalPurchased += order.finalAmount;
        acc.totalPaid += order.paidAmount;
        acc.totalOutstanding += order.dueAmount;
        acc.totalOrders += 1;
        return acc;
      },
      { totalPurchased: 0, totalPaid: 0, totalOutstanding: 0, totalOrders: 0 },
    );

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      district: customer.district,
      latitude: customer.latitude,
      longitude: customer.longitude,
      type: customer.type,
      address: customer.address,
      ...totals,
    };
  });
}