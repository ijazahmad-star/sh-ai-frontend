import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/database/db";
import { kbAccess } from "@/database/schema";
import { eq } from "drizzle-orm";

// PATCH update KB access for a user (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { hasAccessToDefaultKB } = await req.json();

    // Use Drizzle to update KB access
    const updatedKbAccess = await db
      .update(kbAccess)
      .set({ hasAccessToDefaultKB })
      .where(eq(kbAccess.userId, id))
      .returning();

    return NextResponse.json({ kbAccess: updatedKbAccess[0] });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
