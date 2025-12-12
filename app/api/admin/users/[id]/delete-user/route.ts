import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE a user (admin only)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const session = await getServerSession(authOptions);
  
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  
    try {
      const { id } = await params;
  
      // Delete the KBAccess entry first (if it exists)
      await prisma.kBAccess.deleteMany({
        where: { userId: id },
      });
  
      // Delete the user
      const deletedUser = await prisma.user.delete({
        where: { id },
      });
  
      return NextResponse.json({ deletedUser });
    } catch (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  }