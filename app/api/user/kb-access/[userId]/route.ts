import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId } = await params;

    // Users can only check their own KB access
    if (session.user.id !== userId && session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const kbAccess = await prisma.kBAccess.findUnique({
      where: { userId },
    });

    // Check if user has personal KB
    const hasPersonalKB = await checkUserPersonalKB(userId);

    return NextResponse.json({
      hasAccessToDefaultKB: kbAccess?.hasAccessToDefaultKB || false,
      has_personal_kb: hasPersonalKB,
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

async function checkUserPersonalKB(userId: string): Promise<boolean> {
  // This calls your backend API to check if user has personal KB
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
  try {
    const res = await fetch(`${API_BASE}/check_user_kb/${userId}`);
    if (res.ok) {
      const data = await res.json();
      return data.has_personal_kb || false;
    }
  } catch (e) {
    console.error("Failed to check personal KB:", e);
  }
  return false;
}
