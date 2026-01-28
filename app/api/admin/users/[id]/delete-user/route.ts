import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/database/db";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";

// DELETE a user (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;

    // Just delete the user - cascade should handle the rest
    const deletedUser = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    return NextResponse.json({ deletedUser: deletedUser[0] });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
