"use client";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Bot, User } from "lucide-react";
import { getAiResponse } from "@/lib/prompts";
import type { Message, Conversation } from "@/types/chat";
import Sidebar from "@/components/chat/Sidebar";
import ConfirmModal from "../ui/ConfirmModal";
import MessageBubble from "@/components/chat/MessageBubble";
import ChatInput from "@/components/chat/ChatInput";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export default function ChatInterface() {
  const { data: session } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const isGeneratingRef = useRef(false);
  const [loadingCov, setLoadingCov] = useState(false);
  const [kbType, setKbType] = useState<"default" | "custom">("default");
  const [hasPersonalKB, setHasPersonalKB] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasAccessToDefaultKB, setHasAccessToDefaultKB] = useState(false);
  const [pendingDeleteConversationId, setPendingDeleteConversationId] =
    useState<string | null>(null);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);

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

  const handleSubmit = useCallback(async () => {
    if (query.trim() === "" || !session?.user?.id) return;
    if (isGeneratingRef.current) return; // prevent overlapping submissions

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
    isGeneratingRef.current = true;
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

      // append AI message and clear loading state immediately
      setMessages((m) => [...m, aiMessage]);
      isGeneratingRef.current = false;
      setLoading(false);

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
      isGeneratingRef.current = false;
      setLoading(false);
    } finally {
      // ensure loading is cleared (if not already)
      isGeneratingRef.current = false;
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

  const deleteConversation = useCallback(async (id: string) => {
    // open confirmation modal instead of native confirm
    setPendingDeleteConversationId(id);
  }, []);

  const confirmDeleteConversation = useCallback(async () => {
    const id = pendingDeleteConversationId;
    if (!id) return;
    setIsDeletingConversation(true);
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
    } finally {
      setIsDeletingConversation(false);
      setPendingDeleteConversationId(null);
    }
  }, [pendingDeleteConversationId, currentConversationId, loadConversations]);

  const renameConversation = useCallback(
    async (id: string, newTitle: string) => {
      try {
        const res = await fetch(`/api/chat/conversations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle }),
        });

        if (res.ok) {
          await loadConversations();
        }
      } catch (e) {
        console.error("Failed to rename conversation:", e);
      }
    },
    [loadConversations]
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

  // Persistence: Load last conversation on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedId = localStorage.getItem("lastConversationId");
      if (savedId && session?.user && !currentConversationId) {
        loadConversation(savedId);
      }
    }
  }, [session?.user, loadConversation, currentConversationId]);

  // Persistence: Save current conversation ID when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (currentConversationId) {
        localStorage.setItem("lastConversationId", currentConversationId);
      } else {
        localStorage.removeItem("lastConversationId");
      }
    }
  }, [currentConversationId]);

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

  const noKbAccess =
    !hasAccessToDefaultKB && !hasPersonalKB && session?.user?.role !== "admin";
  return (
    <>
      <div className="fixed inset-0 pt-20 flex bg-white dark:bg-zinc-900">
        {/* Sidebar with conversation history */}
        <div
          className={`hidden sm:block transition-all duration-300 ease-in-out bg-[#f9f9f9] dark:bg-[#171717] border-r border-zinc-200 dark:border-zinc-800 overflow-hidden ${
            isSidebarOpen ? "w-[260px]" : "w-0 border-none"
          }`}
        >
          <div className="w-[260px] h-full">
            <Sidebar
              conversations={conversations}
              currentConversationId={currentConversationId}
              createNewConversation={createNewConversation}
              loadConversation={loadConversation}
              deleteConversation={deleteConversation}
              renameConversation={renameConversation}
              toggleSidebar={() => setIsSidebarOpen(false)}
            />
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0 border border-gray-50 bg-white dark:bg-zinc-900 relative">
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex absolute top-4 left-4 z-40 p-2.5 sm:p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:cursor-w-resize rounded-lg transition-colors text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              title="Open sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M21 3C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H21ZM20 19V5H4V19H20ZM9 7V17H7V7H9Z" />
              </svg>
            </button>
          )}
          <div className="h-full w-full flex flex-col">
            <header
              className={`px-6 py-4 border-b border-gray-100 dark:border-zinc-700 bg-linear-to-b from-white to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 transition-all ${
                !isSidebarOpen ? "pl-16 sm:pl-20" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-black dark:text-white">
                    Chat With AI
                  </h2>
                  <p className="text-sm text-primary-500 dark:text-red-500 font-medium">
                    SH AI Assistance!
                  </p>
                </div>
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
                  <div>
                    <div className="text-center text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-200 mb-8 mt-10">
                      Hey {session?.user?.name}! Ready to dive in?
                    </div>

                    {noKbAccess && (
                      <div className="max-w-[60%] mx-auto px-4 py-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 text-center">
                        <p className="text-sm mx-auto">
                          Please create your personal database or contact your
                          admin to access the SH database.{" "}
                          <Link
                            href="/knowledge-base"
                            className="font-medium underline text-blue-600"
                          >
                            Personal Database
                          </Link>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    } mb-4 gap-3`}
                  >
                    {m.role !== "user" && (
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <MessageBubble m={m} />
                    {m.role === "user" && (
                      <div className="w-8 h-8 bg-gray-200 dark:bg-zinc-700 rounded-full flex items-center justify-center shrink-0 mt-1">
                        <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </div>
                    )}
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
              disabled={noKbAccess}
            />
          </div>
        </div>

        {/* mobile view  */}

        {isSidebarOpen && (
          <div
            className="sm:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div
          className={`sm:hidden ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed inset-0 w-[260px] h-full transform transition-transform duration-200 ease-in-out bg-[#f9f9f9] dark:bg-[#171717] border-r border-zinc-200 dark:border-zinc-800 z-50`}
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
            renameConversation={renameConversation}
            isMobile
            onClose={() => setIsSidebarOpen(false)}
            toggleSidebar={() => setIsSidebarOpen(false)}
          />
        </div>
        {/* Delete conversation confirmation modal */}
        <ConfirmModal
          open={!!pendingDeleteConversationId}
          title="Delete conversation"
          description={
            "Are you sure you want to delete this conversation? This action cannot be undone."
          }
          onCancel={() => setPendingDeleteConversationId(null)}
          onConfirm={confirmDeleteConversation}
          loading={isDeletingConversation}
        />
      </div>
    </>
  );
}
