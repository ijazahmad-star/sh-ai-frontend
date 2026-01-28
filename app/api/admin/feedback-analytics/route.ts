import { NextResponse } from "next/server";
import { db } from "@/database/db";
import { feedbacks } from "@/database/schema";
import { eq, desc } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    // Debug log
    console.log("Received feedback data:", data);
    const {
      ai_response,
      user_query,
      conversation_id,
      user_id,
      thumb,
      comment,
    } = data;
    const missing = [];
    if (!ai_response) missing.push("ai_response");
    if (!user_query) missing.push("user_query");
    if (!conversation_id) missing.push("conversation_id");
    if (!user_id) missing.push("user_id");
    if (!thumb) missing.push("thumb");
    if (missing.length > 0) {
      console.log("Missing fields:", missing);
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 },
      );
    }
    const feedback = await db
      .insert(feedbacks)
      .values({
        aiResponse: ai_response,
        userQuery: user_query,
        conversationId: conversation_id,
        userId: user_id,
        convMsgId: `admin-${Date.now()}`, // Default ID for admin-submitted feedback
        thumb,
        comment,
      })
      .returning();
    return NextResponse.json({ success: true, feedback: feedback[0] });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const userFeedbacks = await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.userId, userId))
      .orderBy(desc(feedbacks.createdAt));

    return NextResponse.json({ feedbacks: userFeedbacks });
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedbacks" },
      { status: 500 },
    );
  }
}
