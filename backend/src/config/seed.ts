import "dotenv/config";
import prisma from "./prisma"; 
import {
  AdminRole,
  CustomerType,
  MaterialUnit,
  StockTransactionType,
  FinishedStockTxnType,
  OrderStatus,
  PaymentMethod,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  isSunday,
  format,
  getDate,
} from "date-fns";

// --- Helpers for Natural Randomness ---

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomFloat = (min: number, max: number) =>
  Math.random() * (max - min) + min;

const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Returns true based on a percentage probability (0 to 1)
const chance = (probability: number) => Math.random() < probability;

async function main() {
  console.log("🌱 Starting Natural Seed Simulation (2025 - Present)...");

  // 1. CLEANUP (This clears the database)
  console.log("🧹 Clearing previous data...");
  const deleteOrder = [
    prisma.dailyReport.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.finishedFeedStockTransaction.deleteMany(),
    prisma.refund.deleteMany(),
    prisma.order.deleteMany(),
    prisma.productionBatchMaterial.deleteMany(),
    prisma.productionBatch.deleteMany(),
    prisma.rawMaterialStockTransaction.deleteMany(),
    prisma.expense.deleteMany(),
    prisma.finishedFeedStock.deleteMany(), 
    // We generally keep Admins, Customers, Materials, and Categories to avoid unique constraint errors on re-runs
    // But since we are using upsert below, it is safe.
  ];
  
  // Execute deletions
  for (const action of deleteOrder) {
    await action;
  }

  // 2. SETUP ADMINS
  const hashedPassword = await bcrypt.hash("ayush@123", 10);
  
  const superAdmin = await prisma.adminUser.upsert({
    where: { email: "joysengupta252005@gmail.com" },
    update: { passwordHash: hashedPassword },
    create: {
      name: "Ayush Kirtania",
      email: "ayushkirtania@gmail.com",
      phone: "9836763794",
      passwordHash: hashedPassword,
      role: AdminRole.SUPER_ADMIN,
    },
  });

  const staffAdmin = await prisma.adminUser.upsert({
    where: { email: "staff@farm.com" },
    update: { passwordHash: hashedPassword },
    create: {
      name: "Ramesh Staff",
      email: "staff@farm.com",
      phone: "9000000002",
      passwordHash: hashedPassword,
      role: AdminRole.ADMIN,
    },
  });

  // 3. SETUP PRODUCTS & ANIMALS
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

  // Create/Upsert Feeds
  const nutrifeed = await prisma.feedCategory.upsert({
    where: { animalTypeId_name: { animalTypeId: cattle.id, name: "Nutrifeed Premium" } },
    update: { defaultPrice: 1250 },
    create: {
      name: "Nutrifeed Premium",
      animalTypeId: cattle.id,
      unitSizeKg: 50,
      defaultPrice: 1250,
      stock: { create: { quantityAvailable: 0 } },
    },
  });

  const pigGrower = await prisma.feedCategory.upsert({
    where: { animalTypeId_name: { animalTypeId: pig.id, name: "Pig Grower" } },
    update: { defaultPrice: 1380 },
    create: {
      name: "Pig Grower",
      animalTypeId: pig.id,
      unitSizeKg: 50,
      defaultPrice: 1380,
      stock: { create: { quantityAvailable: 0 } },
    },
  });

  const pigFinisher = await prisma.feedCategory.upsert({
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

  const feeds = [nutrifeed, pigGrower, pigFinisher];

  // 4. SETUP RAW MATERIALS
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
  
  const supplements = await prisma.rawMaterial.upsert({
    where: { name: "Vitamin Mix" },
    update: {},
    create: { name: "Vitamin Mix", unit: MaterialUnit.KG },
  });

  // 5. SETUP CUSTOMERS
  const districts = ["Kolkata", "Hooghly", "Nadia", "Bankura", "North 24 Pgs", "Howrah"];
  const districtCoords: Record<string, { lat: number; lng: number }> = {
    Kolkata: { lat: 22.5726, lng: 88.3639 },
    Hooghly: { lat: 22.9011, lng: 88.3915 },
    Nadia: { lat: 23.471, lng: 88.5565 },
    Bankura: { lat: 23.2324, lng: 87.0632 },
    "North 24 Pgs": { lat: 22.722, lng: 88.479 },
    Howrah: { lat: 22.5958, lng: 88.2636 },
  };

  const customers = [];
  const customerNames = [
    "Rajesh Ghosh", "Amitava Das", "Suresh Poultry", "Maa Tara Farm", 
    "Biswas Traders", "Haldar Feeds", "New Mondal Enterprise", "Ali Brothers",
    "Gouranga Dairy", "Kalyani Agro"
  ];

  for (let i = 0; i < customerNames.length; i++) {
    const districtName = pickRandom(districts);
    const coords = districtCoords[districtName];
    const isWhale = i % 3 === 0; 

    const c = await prisma.customer.upsert({
      where: { phone: `98310000${10 + i}` },
      update: {},
      create: {
        name: customerNames[i],
        phone: `98310000${10 + i}`,
        district: districtName,
        address: `${pickRandom(['Vill', 'PO', 'PS'])} - ${districtName} Road`,
        type: isWhale ? CustomerType.DISTRIBUTER : CustomerType.SINGLE,
        latitude: coords.lat + (Math.random() - 0.5) * 0.05,
        longitude: coords.lng + (Math.random() - 0.5) * 0.05,
        createdByAdminId: superAdmin.id,
      },
    });
    customers.push(c);
  }

  // 6. SIMULATION ENGINE (2025 to TODAY)
  const today = new Date();
  const days = eachDayOfInterval({ start: new Date(2025, 0, 1), end: today });

  console.log(`📅 Simulating ${days.length} days...`);

  // State Tracking
  let rawMaterialStockLevel = 0; 
  let finishedGoodsStockLevel = 0;

  for (const day of days) {
    const start = startOfDay(day);
    const end = endOfDay(day);
    const dateNum = getDate(day);
    const monthNum = day.getMonth(); 
    
    // Growth: 5% per month
    const growthFactor = 1 + (monthNum * 0.05);
    const isWeekend = isSunday(day);
    const activityMultiplier = isWeekend ? 0.2 : 1.0; 

    // --- A. EXPENSES ---
    
    // Rent on 1st
    if (dateNum === 1) {
      await prisma.expense.create({
        data: { category: "Rent & Utilities", amount: 12000, expenseDate: start },
      });
    }

    // Salaries on 7th
    if (dateNum === 7) {
      await prisma.expense.create({
        data: { category: "Staff Salaries", amount: 45000, expenseDate: start },
      });
    }

    // Random operational costs
    if (chance(0.4 * activityMultiplier)) {
      const type = pickRandom(["Fuel", "Machine Maintenance", "Loading/Unloading", "Office Tea/Snacks"]);
      const amt = type === "Fuel" ? randomInt(500, 2000) : randomInt(50, 500);
      await prisma.expense.create({
        data: { category: type, amount: amt, expenseDate: start },
      });
    }

    // --- B. PROCUREMENT ---
    if (rawMaterialStockLevel < 5000 || (chance(0.05) && !isWeekend)) {
        const maizeQty = randomInt(2000, 5000);
        const soyQty = randomInt(1000, 3000);
        
        await prisma.rawMaterialStockTransaction.createMany({
            data: [
                { rawMaterialId: maize.id, adminUserId: staffAdmin.id, type: StockTransactionType.IN, quantity: maizeQty, createdAt: start },
                { rawMaterialId: soy.id, adminUserId: staffAdmin.id, type: StockTransactionType.IN, quantity: soyQty, createdAt: start },
            ]
        });
        
        await prisma.expense.create({
            data: { category: "Raw Material Purchase", amount: (maizeQty * 20) + (soyQty * 40), expenseDate: start }
        });

        rawMaterialStockLevel += (maizeQty + soyQty);
    }

    // --- C. PRODUCTION ---
    if (rawMaterialStockLevel > 2000 && chance(0.4 * activityMultiplier)) {
        const batchCat = pickRandom(feeds);
        const bagsProduced = randomInt(50, 200) * Math.ceil(growthFactor);
        const kgProduced = bagsProduced * 50;

        const batch = await prisma.productionBatch.create({
            data: {
                feedCategoryId: batchCat.id,
                adminUserId: staffAdmin.id,
                batchNumber: `BATCH-${format(day, "yyyyMMdd")}-${randomInt(10, 99)}`,
                producedBags: bagsProduced,
                producedKg: kgProduced,
                productionDate: start,
            }
        });

        await prisma.finishedFeedStockTransaction.create({
            data: {
                feedCategoryId: batchCat.id,
                adminUserId: staffAdmin.id,
                type: FinishedStockTxnType.PRODUCTION_IN,
                quantityBags: bagsProduced,
                productionBatchId: batch.id,
                createdAt: start
            }
        });

        rawMaterialStockLevel -= (kgProduced * 0.9);
        finishedGoodsStockLevel += bagsProduced;
    }

    // --- D. SALES ---
    const numOrders = Math.floor(randomInt(0, 5) * growthFactor * activityMultiplier);

    if (numOrders > 0) {
        for (let k = 0; k < numOrders; k++) {
            const customer = pickRandom(customers);
            const feed = pickRandom(feeds);
            
            const baseQty = customer.type === CustomerType.DISTRIBUTER ? randomInt(20, 100) : randomInt(2, 10);
            const qty = baseQty;
            const price = feed.defaultPrice;
            const subtotal = price * qty;
            const total = subtotal;

            let paid = 0;
            const paymentLuck = Math.random();
            let status: OrderStatus = OrderStatus.DELIVERED; 

            if (paymentLuck > 0.4) {
                // Full Payment
                paid = total;
            } else if (paymentLuck > 0.1) {
                // Partial Payment (Round figures)
                const rawPartial = total * randomFloat(0.3, 0.8);
                paid = Math.floor(rawPartial / 500) * 500; 
                if (paid === 0) paid = 500; 
            } else {
                // Credit (Pending payment, but goods delivered)
                paid = 0;
            }

            // Create Order
            await prisma.order.create({
                data: {
                    customerId: customer.id,
                    adminUserId: staffAdmin.id,
                    totalAmount: total,
                    finalAmount: total,
                    paidAmount: paid,
                    dueAmount: total - paid,
                    orderStatus: status,
                    createdAt: start,
                    items: {
                        create: {
                            feedCategoryId: feed.id,
                            quantityBags: qty,
                            pricePerBag: price,
                            subtotal: subtotal,
                        }
                    },
                    payments: paid > 0 ? {
                        create: {
                            amountPaid: paid,
                            paymentMethod: pickRandom([PaymentMethod.CASH, PaymentMethod.UPI, PaymentMethod.BANK]), 
                            paymentDate: start,
                            note: paid < total ? "Part payment received" : undefined 
                        }
                    } : undefined
                }
            });

            finishedGoodsStockLevel -= qty;
        }
    }

    // --- E. DAILY REPORT ---
    const [salesAgg, revenueAgg, expenseAgg, prodAgg] = await Promise.all([
        prisma.order.aggregate({
          where: { createdAt: { gte: start, lte: end }, NOT: { orderStatus: OrderStatus.CANCELED } },
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
      
      if (dateNum === 1) console.log(`   > Processed ${format(day, 'MMMM yyyy')}...`);
  }

  console.log("✅ Simulation Complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });