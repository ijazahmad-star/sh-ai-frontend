import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/database/db";
import { users, conversations, messages } from "@/database/schema";
import { eq, desc, asc } from "drizzle-orm";

// GET all conversations for the logged-in user
export async function GET(req: NextRequest) {
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

    const userConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, user[0].id))
      .orderBy(desc(conversations.updatedAt));

    // Get first message for each conversation for preview
    const conversationsWithMessages = await Promise.all(
      userConversations.map(async (conversation) => {
        const firstMessage = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conversation.id))
          .orderBy(asc(messages.createdAt))
          .limit(1);

        return {
          ...conversation,
          messages: firstMessage,
        };
      }),
    );

    return NextResponse.json(conversationsWithMessages);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

// POST create new conversation
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

    const { title } = await req.json();

    const conversation = await db
      .insert(conversations)
      .values({
        title: title || "New Chat",
        userId: user[0].id,
      })
      .returning();

    return NextResponse.json(conversation[0]);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
