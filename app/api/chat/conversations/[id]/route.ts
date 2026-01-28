import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/database/db";
import { users, conversations } from "@/database/schema";
import { eq, and } from "drizzle-orm";
const PYTHON_BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
// GET specific conversation with messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

    const [conversation, pythonRes] = await Promise.all([
      db
        .select()
        .from(conversations)
        .where(
          and(eq(conversations.id, id), eq(conversations.userId, user[0].id)),
        )
        .limit(1),
      fetch(`${PYTHON_BACKEND_URL}/conversations/${id}`, {
        next: { revalidate: 0 }, // Ensure fresh data
      }),
    ]);

    if (!conversation.length) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    if (!pythonRes.ok) {
      throw new Error(`Backend responded with status: ${pythonRes.status}`);
    }

    const pythonData = await pythonRes.json();

    // 3. Return the original conversation metadata combined with Python messages
    return NextResponse.json({
      ...conversation[0],
      messages: pythonData.messages || [],
    });
  } catch (error) {
    console.error("Error fetching conversation data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// DELETE conversation
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

    // Verify ownership before deleting
    const [conversationResult, pythonRes] = await Promise.all([
      db
        .select()
        .from(conversations)
        .where(
          and(eq(conversations.id, id), eq(conversations.userId, user[0].id)),
        )
        .limit(1),
      fetch(`${PYTHON_BACKEND_URL}/conversations/${id}`, {
        method: "DELETE",
      }),
    ]);

    if (!conversationResult.length || !pythonRes) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    await db.delete(conversations).where(eq(conversations.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

// PATCH update conversation title
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const { title } = await req.json();

    // Verify ownership before updating
    const conversationResult = await db
      .select()
      .from(conversations)
      .where(
        and(eq(conversations.id, id), eq(conversations.userId, user[0].id)),
      )
      .limit(1);

    if (!conversationResult.length) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    const updatedConversation = await db
      .update(conversations)
      .set({ title })
      .where(eq(conversations.id, id))
      .returning();

    return NextResponse.json(updatedConversation[0]);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
