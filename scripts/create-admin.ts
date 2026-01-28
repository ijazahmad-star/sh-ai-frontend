import "dotenv/config";
import { db } from "../database/db.js";
import { users, kbAccess } from "../database/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function createAdminUser() {
  try {
    console.log("Creating admin user...");

    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, "admin@strategisthub.com"))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("⚠️  Admin user already exists");
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin@123456", 10);

    const [admin] = await db
      .insert(users)
      .values({
        email: "admin@strategisthub.com",
        password: hashedPassword,
        name: "Admin User",
        role: "admin",
      })
      .returning();

    // Create KB access for admin
    await db.insert(kbAccess).values({
      userId: admin.id,
      hasAccessToDefaultKB: true,
    });

    console.log("✅ Admin user created successfully!");
    console.log("Email: admin@strategisthub.com");
    console.log("Password: admin@123456");
    console.log("Role: admin");
  } catch (error: any) {
    console.error("❌ Error creating admin user:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

createAdminUser();
