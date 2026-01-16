import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

async function createAdminUser() {
  try {
    // Create connection directly
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }

    console.log("Connecting to database...");
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    // Create admin user
    console.log("Creating admin user...");
    const hashedPassword = await bcrypt.hash("admin@123456", 10);

    const admin = await prisma.user.create({
      data: {
        email: "admin@example.com",
        password: hashedPassword,
        name: "Admin User",
        role: "admin",
        kb_access: {
          create: {
            hasAccessToDefaultKB: true,
          },
        },
      },
      include: {
        kb_access: true,
      },
    });

    console.log("✅ Admin user created successfully!");
    console.log("Email: admin@example.com");
    console.log("Password: admin@123456");
    console.log("Role: admin");

    await prisma.$disconnect();
  } catch (error: any) {
    if (error.code === "P2002") {
      console.log("⚠️  Admin user already exists");
    } else {
      console.error("❌ Error creating admin user:", error.message);
      console.error("Full error:", error);
    }
    process.exit(1);
  }
}

createAdminUser();
