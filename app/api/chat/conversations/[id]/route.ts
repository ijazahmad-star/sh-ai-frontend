import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
const PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
// GET specific conversation with messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    const [conversation, pythonRes] = await Promise.all([
      prisma.conversation.findFirst({
        where: { id, user_id: user.id },
      }),
      fetch(`${PYTHON_BACKEND_URL}/conversations/${id}`, {
        next: { revalidate: 0 } // Ensure fresh data
      })
    ]);

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    
    if (!pythonRes.ok) {
      throw new Error(`Backend responded with status: ${pythonRes.status}`);
    }

    const pythonData = await pythonRes.json();

    // 3. Return the original conversation metadata combined with Python messages
    return NextResponse.json({
      ...conversation,
      messages: pythonData.messages || [],
    });

  } catch (error) {
    console.error("Error fetching conversation data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE conversation
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    // Verify ownership before deleting
    const [conversation, pythonRes] = await Promise.all([
      prisma.conversation.findFirst({
        where: {
          id,
          user_id: user.id,
        },
      }),
      fetch(`${PYTHON_BACKEND_URL}/conversations/${id}`, {
        method: 'DELETE',
      })
    ]);


    if (!conversation || !pythonRes) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    await prisma.conversation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

// PATCH update conversation title
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const { title } = await req.json();

    // Verify ownership before updating
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        user_id: user.id,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: { title },
    });

    return NextResponse.json(updatedConversation);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

