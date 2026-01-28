import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/database/db";
import { users, feedbacks, messages, conversations } from "@/database/schema";
import { eq, and } from "drizzle-orm";

// POST create feedback for a message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> },
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

    const { messageId } = await params;
    const { thumb, comment, user_query, ai_response, conversation_id } =
      await req.json();

    // Check if feedback already exists for this message
    const existingFeedback = await db
      .select()
      .from(feedbacks)
      .where(
        and(
          eq(feedbacks.userId, user[0].id),
          eq(feedbacks.convMsgId, messageId),
        ),
      )
      .limit(1);

    if (existingFeedback.length) {
      return NextResponse.json(
        { error: "Feedback already submitted for this message" },
        { status: 409 },
      );
    }

    // Check if messageId is a valid UUID format
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        messageId,
      );

    let conversationId: string;

    if (isUUID) {
      // Find the conversation that contains this message (traditional UUID message ID)
      const message = await db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);

      if (!message.length) {
        return NextResponse.json(
          { error: "Message not found" },
          { status: 404 },
        );
      }

      // Verify user owns this message
      if (message[0].userId !== user[0].id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      conversationId = message[0].conversationId;
    } else {
      // For non-UUID messageId (like LangChain run IDs), we need conversation_id from request body
      if (!conversation_id) {
        return NextResponse.json(
          {
            error:
              "conversation_id is required when using non-UUID message identifiers",
          },
          { status: 400 },
        );
      }
      conversationId = conversation_id;

      // Verify user owns this conversation
      const conversation = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);

      if (!conversation.length) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 },
        );
      }

      if (conversation[0].userId !== user[0].id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    // Create the feedback
    const feedback = await db
      .insert(feedbacks)
      .values({
        userId: user[0].id,
        conversationId: conversationId,
        convMsgId: messageId,
        aiResponse: ai_response || "",
        userQuery: user_query || "",
        thumb: thumb || "up",
        comment: comment || null,
      })
      .returning();

    return NextResponse.json(feedback[0]);
  } catch (error) {
    console.error("Error creating feedback:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// GET check if user has submitted feedback for a specific message
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> },
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

    const { messageId } = await params;

    // Check if feedback exists for this message by this user
    const existingFeedback = await db
      .select()
      .from(feedbacks)
      .where(
        and(
          eq(feedbacks.userId, user[0].id),
          eq(feedbacks.convMsgId, messageId),
        ),
      )
      .limit(1);

    if (existingFeedback.length) {
      return NextResponse.json({
        hasFeedback: true,
        feedback: existingFeedback[0],
      });
    }

    return NextResponse.json({ hasFeedback: false });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
