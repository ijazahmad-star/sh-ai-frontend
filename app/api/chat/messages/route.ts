import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


// POST create new message
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Extract data from request
    const { conversation_id, role, content, sources } = await req.json();

    // 1. Verify variable exists to avoid ReferenceError
    if (!conversation_id) {
      return NextResponse.json({ error: "conversation_id is required" }, { status: 400 });
    }

    // 2. Verify user owns this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversation_id,
        user_id: user.id,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // 3. Create the message
    const message = await prisma.message.create({
      data: {
        conversation_id, // Variable name matches destructuring above
        user_id: user.id,
        role,
        content,
        sources: sources || [], // Default to empty array for Json field
      },
    });

    // 4. Update conversation's updatedAt
    await prisma.conversation.update({
      where: { 
        id: conversation_id // FIXED: was conversationId, now matches conversation_id
      },
      data: { 
        updatedAt: new Date() 
      },
    });

    return NextResponse.json(message);

  } catch (error) {
    // Log the error for debugging
    console.error("Database error details:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown error" }, 
      { status: 500 }
    );
  }
}

