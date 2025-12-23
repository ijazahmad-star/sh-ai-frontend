"use client";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import { getAiResponse } from "@/lib/prompts";
import type { Message, Source, Conversation } from "@/types/chat";

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
  }, [query, session?.user?.id, currentConversationId, messages.length, createNewConversation, kbType, loadConversations]);

  const deleteConversation = useCallback(async (id: string) => {
    if (!confirm("Delete this conversation?")) return;

    try {
      const apiRes = await fetch(`/api/chat/conversations/${id}`, {
        method: "DELETE",
      })

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
  }, [currentConversationId, loadConversations]);

  const updateConversationTitle = useCallback(async (
    conversationId: string,
    firstMessage: string
  ) => {
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
  }, [loadConversations]);

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
  }, [session?.user, loadConversations, checkUserKB, checkUserHasAccessToDefaultKB]);

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
          <div className="p-4">
            <button
              onClick={createNewConversation}
              className="w-full bg-[rgb(11,0,44)] hover:bg-purple-900 text-white px-4 py-2 rounded text-sm font-semibold"
            >
              + New Chat
            </button>
          </div>
          <div className="px-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 mb-2">
              Chat History
            </h3>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group relative mb-1 ${currentConversationId === conv.id
                  ? "bg-gray-500 text-white"
                  : "bg-gray-300 hover:bg-gray-400 dark:hover:bg-zinc-800 text-gray-900 dark:text-gray-300"
                  } rounded-xl`}
              >
                <button
                  onClick={() => loadConversation(conv.id)}
                  className="w-full text-left px-3 py-2 text-sm truncate pr-8"
                >
                  {conv.title}
                </button>
                <button
                  onClick={() => deleteConversation(conv.id)}
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                  title="Delete conversation"
                >
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
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
            {loadingCov && <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700 dark:border-gray-300"></div>
                <div className="text-gray-700 dark:text-gray-300 text-lg font-semibold">
                  Loading conversations...
                </div>
              </div>
            </div>
            }

            {!loadingCov && <div className="flex-1 p-6 overflow-y-auto">
              {messages.length === 0 && (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                  No messages yet — ask something using the input below.
                </div>
              )}

              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"
                    } mb-4`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-lg shadow-sm text-sm leading-6 ${m.role === "user"
                      ? "bg-gray-600 text-white rounded-br-none"
                      : "bg-gray-200 text-gray-900 dark:bg-zinc-700 dark:text-white rounded-bl-none"
                      }`}
                  >
                    {/* Main Response */}
                    <div className="mb-2">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>

                    {/* Sources Section */}
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-300 dark:border-zinc-600">
                        <p className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">
                          Sources ({m.sources.length}):
                        </p>
                        <div className="space-y-2">
                          {m.sources.map((source, sourceIdx) => (
                            <div
                              key={sourceIdx}
                              className="bg-white dark:bg-zinc-800 p-2 rounded border border-gray-200 dark:border-zinc-600"
                            >
                              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 break-all">
                                {String(source.source)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[60%] px-4 py-2 rounded-lg bg-gray-100 dark:bg-zinc-700 animate-pulse">
                    AI is typing...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>}

            <form
              onSubmit={handleFormSubmit}
              className="px-4 py-3 border-t border-gray-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center gap-3"
            >
              <input
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 px-3 py-2 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Type your question..."
              />

              {/* KB Type Dropdown */}
              {/* If user has BOTH → show full dropdown */}
              {hasPersonalKB && hasAccessToDefaultKB && (
                <select
                  value={kbType}
                  onChange={(e) =>
                    setKbType(e.target.value as "default" | "custom")
                  }
                  className="px-3 py-2 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-slate-900 dark:text-white"
                  disabled={loading}
                >
                  <option value="default">SH DB</option>
                  <option value="custom">Custom DB</option>
                </select>
              )}

              {/* If user has ONLY default KB */}
              {!hasPersonalKB && hasAccessToDefaultKB && (
                <select
                  value="default"
                  className="px-3 py-2 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                  disabled
                >
                  <option value="default">SH DB</option>
                </select>
              )}

              {/* If user has ONLY personal KB */}
              {hasPersonalKB && !hasAccessToDefaultKB && (
                <select
                  value="custom"
                  className="px-3 py-2 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                  disabled
                >
                  <option value="custom">Custom DB</option>
                </select>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !query.trim()}
              >
                <svg
                  className="w-4 h-4 transform rotate-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* mobile view  */}

        <div
          className={`md:hidden ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            } md:translate-x-0 fixed md:relative w-64 md:w-[20%] h-full transform transition-transform duration-200 ease-in-out bg-gray-200 dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-700 overflow-y-auto z-20`}
        >
          <div className="p-4 mt-10 md:mt-0">
            <button
              onClick={() => {
                createNewConversation();
                setIsSidebarOpen(false);
              }}
              className="w-full bg-[rgb(11,0,44)] hover:bg-purple-900 text-white px-4 py-3 rounded-lg text-sm font-semibold"
            >
              + New Chat
            </button>
          </div>
          <div className="px-2 pb-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 mb-2">
              Chat History
            </h3>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group relative mb-1 ${currentConversationId === conv.id
                  ? "bg-gray-500 text-white"
                  : "bg-gray-300 hover:bg-gray-400 dark:hover:bg-zinc-800 text-gray-900 dark:text-gray-300"
                  } rounded-xl`}
              >
                <button
                  onClick={() => {
                    loadConversation(conv.id);
                    setIsSidebarOpen(false);
                  }}
                  className="w-full text-left px-3 py-3 text-sm truncate pr-10"
                >
                  {conv.title}
                </button>
                <button
                  onClick={() => deleteConversation(conv.id)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1"
                  title="Delete conversation"
                >
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
