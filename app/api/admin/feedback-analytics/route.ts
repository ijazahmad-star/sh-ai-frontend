import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
        { status: 400 }
      );
    }
    const feedback = await prisma.feedback.create({
      data: {
        ai_response,
        user_query,
        conversation_id,
        user_id,
        conv_msg_id: `admin-${Date.now()}`, // Default ID for admin-submitted feedback
        thumb,
        comment,
      },
    });
    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 }
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
        { status: 400 }
      );
    }

    const feedbacks = await prisma.feedback.findMany({
      where: { user_id: userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ feedbacks });
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedbacks" },
      { status: 500 }
    );
  }
}
