import "dotenv/config";
import { AdminRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

// Utility logger
const log = {
  info: (msg: string) => console.log(`INFO  | ${msg}`),
  success: (msg: string) => console.log(`SUCCESS | ${msg}`),
  error: (msg: string) => console.error(`ERROR | ${msg}`),
};

interface SeedAdminInput {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  phone: string;
}

async function seedAdminInDB(input: SeedAdminInput) {
  log.info("Starting admin seed process...");

  const { name, email, password, role, phone } = input;
  log.info(`Preparing admin user: ${email}`);

  try {
    // 1. Hash password
    log.info("Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);
    log.success("Password hashed successfully.");

    // 2. Upsert admin user
    log.info("Running Prisma upsert query for admin...");
    const admin = await prisma.adminUser.upsert({
      where: { email },
      update: {},
      create: {
        name,
        email,
        passwordHash: hashedPassword,
        role,
        phone,
      },
    });

    if (!admin) {
      log.error("Admin not created. Upsert returned null.");
      return;
    }

    log.success(`Admin successfully seeded: ${admin.email}`);
  } catch (error: any) {
    log.error("Failed to seed admin due to an internal error.");
    console.error(error);
    throw error;
  }
}

async function main() {
  log.info("Initializing admin seeding script...");

  const adminData: SeedAdminInput = {
    name: "Joy Sengupta",
    email: "joysengupta252005@gmail.com",
    password: "joy@123",
    phone: "8777699459",
    role: "SUPER_ADMIN",
  };

  try {
    await seedAdminInDB(adminData);
    log.success("Admin seed completed.");
  } catch (err) {
    log.error("Seed execution failed.");
    console.error(err);
    process.exit(1);
  } finally {
    log.info("Disconnecting Prisma Client...");
    await prisma.$disconnect();
    log.info("Prisma Client disconnected.");
  }
}

main();
