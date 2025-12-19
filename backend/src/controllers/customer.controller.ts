import prisma from "../config/prisma";

interface CreateCustomerInput {
  name: string;
  phone: string;
  address?: string;
  type?: "SINGLE" | "DISTRIBUTER";
  district: string;
  createdByAdminId?: string;
}

interface GetAllCustomersInput {
  type?: "SINGLE" | "DISTRIBUTER";
  district?: string;
}

export async function checkExistingCustomer(phone:string) {
  return prisma.customer.findFirst({
    where: {
      phone
    },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      district: true,
    }
  })
}

export async function createCustomerDB(input: CreateCustomerInput) {
  const { name, phone, address, type, district, createdByAdminId } = input;

  return prisma.customer.create({
    data: {
      name,
      phone,
      address,
      type,
      district,
      createdByAdminId,
    },
  });
}

export async function getCustomersByDistrict(district: string, type?: string) {
  const whereClause: any = {
    district: {
      equals: district,
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
      district: true,
      createdAt: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getAllCustomersDB(input: GetAllCustomersInput) {
  const { type, district } = input;

  const where: any = {};

  if (type) where.type = type;
  if (district) where.district = district;

  return prisma.customer.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      phone: true,
      type: true,
      district: true,
      createdAt: true,
    },
  });
}

interface GetCustomerByIdInput {
  customerId: string;
}

export async function getCustomerByIdDB(input: GetCustomerByIdInput) {
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
    },
  });
}

interface UpdateCustomerInput {
  customerId: string;
  name?: string;
  phone?: string;
  address?: string;
  type?: "SINGLE" | "DISTRIBUTER";
  district: string;
}

export async function updateCustomerDB(input: UpdateCustomerInput) {
  const { customerId, ...data } = input;

  return prisma.customer.update({
    where: { id: customerId },
    data,
  });
}

interface GetCustomerOrdersInput {
  customerId: string;
}

export async function getCustomerOrdersDB(input: GetCustomerOrdersInput) {
  const { customerId } = input;

  return prisma.order.findMany({
    where: { customerId },
    orderBy: {
      createdAt: "desc",
    },
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
          feedCategory: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
}

interface GetCustomerLedgerInput {
  customerId: string;
}

export async function getCustomerLedgerDB(input: GetCustomerLedgerInput) {
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
  });

  const payments = await prisma.payment.findMany({
    where: {
      order: {
        customerId,
      },
    },
    select: {
      id: true,
      amountPaid: true,
      paymentDate: true,
      paymentMethod: true,
      orderId: true,
    },
  });

  const totalOrders = orders.length;
  const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalDue = orders.reduce((sum, o) => sum + o.dueAmount, 0);

  return {
    summary: {
      totalOrders,
      totalPaid,
      totalDue,
    },
    orders,
    payments,
  };
}

interface GetCustomerSnapshotsInput {
  customerId: string;
  from?: Date;
  to?: Date;
}

export async function getCustomerSnapshotsDB(input: GetCustomerSnapshotsInput) {
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
    select: {
      date: true,
      totalOrders: true,
      totalPaid: true,
      totalDue: true,
      lastOrderAt: true,
    },
  });
}
