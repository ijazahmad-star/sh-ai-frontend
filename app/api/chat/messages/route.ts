import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/database/db";
import { users, conversations, messages } from "@/database/schema";
import { eq, and } from "drizzle-orm";

// POST create new message
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Extract data from request
    const { conversation_id, role, content, sources } = await req.json();

    // 1. Verify variable exists to avoid ReferenceError
    if (!conversation_id) {
      return NextResponse.json(
        { error: "conversation_id is required" },
        { status: 400 },
      );
    }

    // 2. Verify user owns this conversation
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversation_id),
          eq(conversations.userId, user[0].id),
        ),
      )
      .limit(1);

    if (!conversation.length) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    // 3. Create the message
    const message = await db
      .insert(messages)
      .values({
        conversationId: conversation_id,
        userId: user[0].id,
        role,
        content,
        sources: sources || [], // Default to empty array for Json field
      })
      .returning();

    // 4. Update conversation's updatedAt
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversation_id));

    return NextResponse.json(message[0]);
  } catch (error) {
    // Log the error for debugging
    console.error("Database error details:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
