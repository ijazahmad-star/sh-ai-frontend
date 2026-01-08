"use client";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { getAiResponse } from "@/lib/prompts";
import type { Message, Conversation } from "@/types/chat";
import Sidebar from "@/components/chat/Sidebar";
import MessageBubble from "@/components/chat/MessageBubble";
import ChatInput from "@/components/chat/ChatInput";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export default function ChatInterface() {
  const { data: session } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCov, setLoadingCov] = useState(false);
  const [kbType, setKbType] = useState<"default" | "custom">("default");
  const [hasPersonalKB, setHasPersonalKB] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasAccessToDefaultKB, setHasAccessToDefaultKB] = useState(false);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkUserHasAccessToDefaultKB = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const res = await fetch(
        `${API_BASE}/check_user_has_access_to_default_kb/${session.user.id}`
      );
      if (res.ok) {
        const data = await res.json();
        setHasAccessToDefaultKB(data.has_access_to_default || false);
      }
    } catch (e) {
      console.error("Failed to check user has access to default KB:", e);
    }
  }, [session?.user?.id]);

  // Check if user has personal KB
  const checkUserKB = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/check_user_kb/${session.user.id}`);
      if (res.ok) {
        const data = await res.json();
        setHasPersonalKB(data.has_personal_kb || false);
        // If user doesn't have personal KB, force default
        if (!data.has_personal_kb) {
          setKbType("default");
        }
      }
    } catch (e) {
      console.error("Failed to check user KB:", e);
    }
  }, [session?.user?.id]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (e) {
      console.error("Failed to load conversations:", e);
    }
  }, []);

  const loadConversation = useCallback(async (conversationId: string) => {
    setLoadingCov(true);
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}`);
      if (res.ok) {
        const conversation = await res.json();
        setMessages(conversation.messages || []);
        setCurrentConversationId(conversationId);
      }
    } catch (e) {
      console.error("Failed to load conversation:", e);
    } finally {
      setLoadingCov(false);
    }
  }, []);

  const createNewConversation = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });

      if (res.ok) {
        const conversation = await res.json();
        setCurrentConversationId(conversation.id);
        setMessages([]);
        await loadConversations();
        return conversation.id;
      }
    } catch (e) {
      console.error("Failed to create conversation:", e);
    }
    return null;
  }, [loadConversations]);

  // const saveMessage = async (
  //   conversation_id: string,
  //   role: string,
  //   content: string,
  //   sources: Source[] = []
  // ) => {
  //   try {
  //     await fetch("/api/chat/messages", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         conversation_id,
  //         role,
  //         content,
  //         sources,
  //       }),
  //     });
  //   } catch (e) {
  //     console.error("Failed to save message:", e);
  //   }
  // };

  const handleSubmit = useCallback(async () => {
    if (query.trim() === "" || !session?.user?.id) return;

    let conversationId = currentConversationId;
    const isFirstMessage = messages.length === 0;
    // Create new conversation if none exists
    if (!conversationId) {
      conversationId = await createNewConversation();
      if (!conversationId) return;
    }

    const userMessage: Message = {
      id: String(Date.now()) + "-u",
      role: "user",
      content: query.trim(),
    };

    setMessages((m) => [...m, userMessage]);
    const userQuery = query.trim();
    setQuery("");
    setLoading(true);

    try {
      // Get AI response
      const response = await getAiResponse(
        userMessage.content,
        session.user.id,
        kbType,
        conversationId
      );

      // AI message with sources
      const aiMessage: Message = {
        id: String(Date.now()) + "-a",
        role: "assistant",
        content: response?.response ?? "(no response)",
        sources: response?.sources?.map((s) => s.source) || [],
      };

      setMessages((m) => [...m, aiMessage]);

      // Update conversation title if first message
      if (isFirstMessage) {
        await updateConversationTitle(conversationId, userQuery);
      }

      // Reload conversation list
      loadConversations();
    } catch (e) {
      const errMessage: Message = {
        id: String(Date.now()) + "-e",
        role: "assistant",
        content: "Error: could not get response",
      };
      setMessages((m) => [...m, errMessage]);
    } finally {
      setLoading(false);
    }
  }, [
    query,
    session?.user?.id,
    currentConversationId,
    messages.length,
    createNewConversation,
    kbType,
    loadConversations,
  ]);

  const deleteConversation = useCallback(
    async (id: string) => {
      if (!confirm("Delete this conversation?")) return;

      try {
        const apiRes = await fetch(`/api/chat/conversations/${id}`, {
          method: "DELETE",
        });

        if (!apiRes.ok) {
          throw new Error("Failed to delete conversation");
        }

        if (currentConversationId === id) {
          setCurrentConversationId(null);
          setMessages([]);
        }

        await loadConversations();
      } catch (error) {
        console.error("Failed to delete conversation:", error);
      }
    },
    [currentConversationId, loadConversations]
  );

  const updateConversationTitle = useCallback(
    async (conversationId: string, firstMessage: string) => {
      try {
        // Generate a smart title from first message (first 50 chars or first sentence)
        let title = firstMessage.trim();

        // Take first sentence if it ends with punctuation
        const firstSentence = title.match(/^[^.!?]+[.!?]/);
        if (firstSentence) {
          title = firstSentence[0].trim();
        }

        // Limit to 50 characters
        if (title.length > 50) {
          title = title.substring(0, 47) + "...";
        }

        // Update the conversation title
        const res = await fetch(`/api/chat/conversations/${conversationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });

        if (res.ok) {
          // Reload conversations to show new title
          loadConversations();
        }
      } catch (e) {
        console.error("Failed to update conversation title:", e);
      }
    },
    [loadConversations]
  );

  // useEffect hooks
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations on mount
  useEffect(() => {
    if (session?.user) {
      loadConversations();
      checkUserKB();
      checkUserHasAccessToDefaultKB();
    }
  }, [
    session?.user,
    loadConversations,
    checkUserKB,
    checkUserHasAccessToDefaultKB,
  ]);

  useEffect(() => {
    if (hasPersonalKB && hasAccessToDefaultKB) {
      setKbType("default");
    } else if (hasAccessToDefaultKB) {
      setKbType("default");
    } else if (hasPersonalKB) {
      setKbType("custom");
    }
  }, [hasPersonalKB, hasAccessToDefaultKB]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleSubmit();
  };

  if (
    !hasAccessToDefaultKB &&
    !hasPersonalKB &&
    session?.user.role !== "admin"
  ) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm/90">
        <div className="text-gray-700 dark:text-gray-300 text-lg font-semibold">
          You do not have access to the default KB. Please Create your{" "}
          <span className="font-bold text-blue-600 underline hover:bg-red-600">
            <Link href="/knowledge-base" className="">
              Custom KB
            </Link>
          </span>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="fixed inset-0 pt-18 flex bg-white dark:bg-zinc-900">
        {/* Sidebar with conversation history */}
        <div className="hidden sm:block w-[20%] bg-gray-200 dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-700 overflow-y-auto">
          <Sidebar
            conversations={conversations}
            currentConversationId={currentConversationId}
            createNewConversation={createNewConversation}
            loadConversation={loadConversation}
            deleteConversation={deleteConversation}
          />
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col border border-gray-50 bg-white dark:bg-zinc-900">
          <div className="h-full w-full flex flex-col">
            <header className="px-6 py-4 border-b border-gray-100 dark:border-zinc-700 bg-linear-to-b from-white to-zinc-50 dark:from-zinc-800 dark:to-zinc-900">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-black dark:text-white">
                    Chat With AI
                  </h2>
                  <p className="text-sm text-primary-500 dark:text-red-500 font-medium">
                    SH AI Assistance!
                  </p>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="sm:hidden top-4 left-4 z-30 p-2 rounded-lg bg-gray-600 text-white"
                >
                  Show History
                </button>
              </div>
            </header>
            {loadingCov && (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700 dark:border-gray-300"></div>
                  <div className="text-gray-700 dark:text-gray-300 text-lg font-semibold">
                    Loading conversations...
                  </div>
                </div>
              </div>
            )}

            {!loadingCov && (
              <div className="flex-1 p-6 overflow-y-auto">
                {messages.length === 0 && (
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                    No messages yet — ask something using the input below.
                  </div>
                )}

                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    } mb-4`}
                  >
                    <MessageBubble m={m} />
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="inline-block max-w-full sm:max-w-[60%] px-4 py-2 rounded-lg bg-gray-100 dark:bg-zinc-700 animate-pulse">
                      AI is typing...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            <ChatInput
              query={query}
              setQuery={setQuery}
              handleFormSubmit={handleFormSubmit}
              kbType={kbType}
              setKbType={setKbType}
              hasPersonalKB={hasPersonalKB}
              hasAccessToDefaultKB={hasAccessToDefaultKB}
              loading={loading}
            />
          </div>
        </div>

        {/* mobile view  */}

        <div
          className={`md:hidden ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 fixed md:relative w-11/12 sm:w-3/4 md:w-[20%] h-full transform transition-transform duration-200 ease-in-out bg-gray-200 dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-700 overflow-y-auto z-20`}
        >
          <Sidebar
            conversations={conversations}
            currentConversationId={currentConversationId}
            createNewConversation={createNewConversation}
            loadConversation={async (id: string) => {
              await loadConversation(id);
              setIsSidebarOpen(false);
            }}
            deleteConversation={deleteConversation}
            isMobile
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>
      </div>
    </>
  );
}
