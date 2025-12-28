import "dotenv/config";
import {
  AdminRole,
  CustomerType,
  MaterialUnit,
  StockTransactionType,
  FinishedStockTxnType,
  OrderStatus,
  PaymentMethod,
  RefundStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { startOfDay, endOfDay, eachDayOfInterval } from "date-fns";
import prisma from "./prisma";

async function main() {
  console.log("Starting Robust Master Seed (Nov 2024 - Dec 2025)...");

  // 1. Setup Admins
  const hashedPassword = await bcrypt.hash("joy@123", 10);
  const superAdmin = await prisma.adminUser.upsert({
    where: { email: "joysengupta252005@gmail.com" },
    update: { passwordHash: hashedPassword },
    create: {
      name: "Joy Sengupta",
      email: "joysengupta252005@gmail.com",
      phone: "8777699459",
      passwordHash: hashedPassword,
      role: AdminRole.SUPER_ADMIN,
    },
  });

  const staffAdmin = await prisma.adminUser.upsert({
    where: { email: "staff@farm.com" },
    update: { passwordHash: hashedPassword },
    create: {
      name: "Staff Admin",
      email: "staff@farm.com",
      phone: "9000000002",
      passwordHash: hashedPassword,
      role: AdminRole.ADMIN,
    },
  });

  // 2. Setup Animal Types
  const cattle = await prisma.animalType.upsert({
    where: { name: "Cattle" },
    update: {},
    create: { name: "Cattle" },
  });

  const pig = await prisma.animalType.upsert({
    where: { name: "Pig" },
    update: {},
    create: { name: "Pig" },
  });

  // 3. Setup Feed Categories
  const nutrifeed = await prisma.feedCategory.upsert({
    where: { animalTypeId_name: { animalTypeId: cattle.id, name: "Nutrifeed" } },
    update: { defaultPrice: 1225 },
    create: {
      name: "Nutrifeed",
      animalTypeId: cattle.id,
      unitSizeKg: 50,
      defaultPrice: 1225,
      stock: { create: { quantityAvailable: 0 } },
    },
  });

  const pigFeed = await prisma.feedCategory.upsert({
    where: { animalTypeId_name: { animalTypeId: pig.id, name: "Pig Finisher" } },
    update: { defaultPrice: 1450 },
    create: {
      name: "Pig Finisher",
      animalTypeId: pig.id,
      unitSizeKg: 50,
      defaultPrice: 1450,
      stock: { create: { quantityAvailable: 0 } },
    },
  });

  // 4. Setup Raw Materials
  const maize = await prisma.rawMaterial.upsert({
    where: { name: "Maize" },
    update: {},
    create: { name: "Maize", unit: MaterialUnit.KG },
  });

  const soy = await prisma.rawMaterial.upsert({
    where: { name: "Soybean Meal" },
    update: {},
    create: { name: "Soybean Meal", unit: MaterialUnit.KG },
  });

  // 5. Setup Customers
  const districts = ["Kolkata", "Hooghly", "Nadia", "Bankura"];
  const customers = [];
  for (let i = 0; i < 4; i++) {
    const c = await prisma.customer.upsert({
      where: { phone: `983100000${i}` },
      update: {},
      create: {
        name: `Customer ${i + 1}`,
        phone: `983100000${i}`,
        district: districts[i],
        type: i % 2 === 0 ? CustomerType.DISTRIBUTER : CustomerType.SINGLE,
        createdByAdminId: superAdmin.id,
      },
    });
    customers.push(c);
  }

  // 6. Day-by-Day Transaction Simulation
  console.log("Clearing old transaction data...");
  await prisma.dailyReport.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.productionBatchMaterial.deleteMany({});
  await prisma.productionBatch.deleteMany({});
  await prisma.finishedFeedStockTransaction.deleteMany({});
  await prisma.rawMaterialStockTransaction.deleteMany({});
  await prisma.expense.deleteMany({});

  const days = eachDayOfInterval({ start: new Date(2024, 10, 1), end: new Date() });

  for (const day of days) {
    const start = startOfDay(day);
    const end = endOfDay(day);
    const dayOfMonth = day.getDate();

    if (dayOfMonth === 5) {
      await prisma.expense.create({
        data: { category: "Procurement", amount: 50000, expenseDate: start },
      });
      await prisma.rawMaterialStockTransaction.createMany({
        data: [
          {
            rawMaterialId: maize.id,
            adminUserId: staffAdmin.id,
            type: StockTransactionType.IN,
            quantity: 4000,
            createdAt: start,
          },
          {
            rawMaterialId: soy.id,
            adminUserId: staffAdmin.id,
            type: StockTransactionType.IN,
            quantity: 2000,
            createdAt: start,
          },
        ],
      });
    }

    if (dayOfMonth === 10) {
      const catId = day.getMonth() % 2 === 0 ? nutrifeed.id : pigFeed.id;
      const batch = await prisma.productionBatch.create({
        data: {
          feedCategoryId: catId,
          adminUserId: staffAdmin.id,
          batchNumber: `B-${day.getTime()}`,
          producedBags: 100,
          producedKg: 5000,
          productionDate: start,
        },
      });
      await prisma.finishedFeedStockTransaction.create({
        data: {
          feedCategoryId: catId,
          adminUserId: staffAdmin.id,
          type: FinishedStockTxnType.PRODUCTION_IN,
          quantityBags: 100,
          productionBatchId: batch.id,
          createdAt: start,
        },
      });
    }

    if (dayOfMonth >= 15 && dayOfMonth <= 20) {
      const cust = customers[dayOfMonth % 4];
      const catId = dayOfMonth % 2 === 0 ? nutrifeed.id : pigFeed.id;
      const price = catId === nutrifeed.id ? 1225 : 1450;
      const qty = 5;
      const total = price * qty;

      // FIX: Explicitly set type to OrderStatus
      let status: OrderStatus = OrderStatus.DELIVERED;
      let paid = total;

      if (dayOfMonth === 20) {
        paid = total / 2;
      }
      if (dayOfMonth === 19) {
        status = OrderStatus.PENDING;
        paid = 0;
      }

      await prisma.order.create({
        data: {
          customerId: cust.id,
          adminUserId: staffAdmin.id,
          totalAmount: total,
          finalAmount: total,
          paidAmount: paid,
          dueAmount: total - paid,
          orderStatus: status,
          createdAt: start,
          items: {
            create: {
              feedCategoryId: catId,
              quantityBags: qty,
              pricePerBag: price,
              subtotal: total,
            },
          },
          payments:
            paid > 0
              ? {
                  create: {
                    amountPaid: paid,
                    paymentMethod: PaymentMethod.CASH,
                    paymentDate: start,
                  },
                }
              : undefined,
        },
      });
    }

    const [salesAgg, revenueAgg, expenseAgg, prodAgg] = await Promise.all([
      prisma.order.aggregate({
        where: { createdAt: { gte: start, lte: end }, NOT: { orderStatus: "CANCELED" } },
        _sum: { finalAmount: true },
        _count: { id: true },
      }),
      prisma.payment.aggregate({
        where: { paymentDate: { gte: start, lte: end } },
        _sum: { amountPaid: true },
      }),
      prisma.expense.aggregate({
        where: { expenseDate: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      prisma.productionBatch.aggregate({
        where: { productionDate: { gte: start, lte: end } },
        _sum: { producedKg: true },
        _count: { id: true },
      }),
    ]);

    await prisma.dailyReport.create({
      data: {
        date: start,
        totalSales: salesAgg._sum.finalAmount || 0,
        totalRevenue: revenueAgg._sum.amountPaid || 0,
        totalExpenses: expenseAgg._sum.amount || 0,
        totalOrders: salesAgg._count.id || 0,
        totalProductionKg: prodAgg._sum.producedKg || 0,
        totalBatches: prodAgg._count.id || 0,
      },
    });
  }

  console.log("Success: Master seed completed.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
