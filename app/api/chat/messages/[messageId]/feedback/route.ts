import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST create feedback for a message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
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

    const { messageId } = await params;
    const { thumb, comment, user_query, ai_response, conversation_id } =
      await req.json();

    // Check if feedback already exists for this message
    const existingFeedback = await prisma.feedback.findFirst({
      where: {
        user_id: user.id,
        conv_msg_id: messageId,
      },
    });

    if (existingFeedback) {
      return NextResponse.json(
        { error: "Feedback already submitted for this message" },
        { status: 409 }
      );
    }

    // Check if messageId is a valid UUID format
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        messageId
      );

    let conversationId: string;

    if (isUUID) {
      // Find the conversation that contains this message (traditional UUID message ID)
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: { conversation: true },
      });

      if (!message) {
        return NextResponse.json(
          { error: "Message not found" },
          { status: 404 }
        );
      }

      // Verify user owns this conversation
      if (message.conversation.user_id !== user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      conversationId = message.conversation_id;
    } else {
      // For non-UUID messageId (like LangChain run IDs), we need conversation_id from request body
      if (!conversation_id) {
        return NextResponse.json(
          {
            error:
              "conversation_id is required when using non-UUID message identifiers",
          },
          { status: 400 }
        );
      }
      conversationId = conversation_id;

      // Verify user owns this conversation
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      if (conversation.user_id !== user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    // Create the feedback
    const feedback = await prisma.feedback.create({
      data: {
        user_id: user.id,
        conversation_id: conversationId,
        conv_msg_id: messageId,
        ai_response: ai_response || "",
        user_query: user_query || "",
        thumb: thumb || "up",
        comment: comment || null,
      },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Error creating feedback:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET check if feedback exists for a message
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
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

    const { messageId } = await params;

    // Check if feedback exists for this message
    const feedback = await prisma.feedback.findFirst({
      where: {
        user_id: user.id,
        conv_msg_id: messageId,
      },
      select: {
        id: true,
        thumb: true,
        comment: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      hasFeedback: !!feedback,
      feedback: feedback,
    });
  } catch (error) {
    console.error("Error checking feedback:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
