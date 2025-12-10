"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import { getAiResponse } from "@/lib/prompts";
import type { Message, Source, Conversation } from "@/types/chat";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export default function ChatInterface() {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [kbType, setKbType] = useState<"default" | "custom">("default");
  const [hasPersonalKB, setHasPersonalKB] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // const [initialLoading, setInitialLoading] = useState(true);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations on mount
  useEffect(() => {
    if (session?.user) {
      loadConversations();
      checkUserKB();
    }
  }, [session]);

  // Check if user has personal KB
  const checkUserKB = async () => {
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
  };

  const loadConversations = async () => {
    // setInitialLoading(true);
    try {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (e) {
      console.error("Failed to load conversations:", e);
    }
    // setInitialLoading(false);
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}`);
      if (res.ok) {
        const conversation = await res.json();
        setMessages(conversation.messages || []);
        setCurrentConversationId(conversationId);
      }
    } catch (e) {
      console.error("Failed to load conversation:", e);
    }
  };

  const createNewConversation = async () => {
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
  };

  const saveMessage = async (conversationId: string, role: string, content: string, sources: Source[] = []) => {
    try {
      await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          role,
          content,
          sources,
        }),
      });
    } catch (e) {
      console.error("Failed to save message:", e);
    }
  };

  const handleSubmit = async () => {
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

    saveMessage(conversationId, "user", userMessage.content);

    try {
      // Get AI response
      const response = await getAiResponse(
        userMessage.content,
        session.user.id,
        kbType
      );

      // AI message with sources
      const aiMessage: Message = {
        id: String(Date.now()) + "-a",
        role: "assistant",
        content: response?.response ?? "(no response)",
        sources: response?.sources?.map((s) => s.source) || [],
      };

      setMessages((m) => [...m, aiMessage]);
      setLoading(false);
      // const sources: string[] =
      //   response?.sources?.map((s: Source) => s.source) || [];
      // Save AI message along with sources
      saveMessage(conversationId, "assistant", aiMessage.content, aiMessage.sources);
      // saveMessage(conversationId, "assistant", aiMessage.content, aiMessage.sources?.map((s) => s.source) || []);

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
      setLoading(false);
    }
  };

  const deleteConversation = async (id: string) => {
    if (!confirm("Delete this conversation?")) return;

    try {
      const res = await fetch(`/api/chat/conversations/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (currentConversationId === id) {
          setCurrentConversationId(null);
          setMessages([]);
        }
        await loadConversations();
      }
    } catch (e) {
      console.error("Failed to delete conversation:", e);
    }
  };

  const updateConversationTitle = async (
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
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleSubmit();
  };

  // if (initialLoading) {
  //   return (
  //     <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm/90">
  //       <div className="text-gray-700 dark:text-gray-300 animate-pulse text-lg font-semibold">
  //         Loading chats...
  //       </div>
  //     </div>
  //   );
  // }
  return (
    <div className="flex h-screen bg-white dark:bg-zinc-900">
      {/* Sidebar with conversation history */}
      <div className="w-64 bg-gray-100 dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-700 overflow-y-auto">
        <div className="p-4">
          <button
            onClick={createNewConversation}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-semibold"
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
              className={`group relative mb-1 ${
                currentConversationId === conv.id
                  ? "bg-red-600 text-white"
                  : "hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-900 dark:text-gray-300"
              } rounded-md`}
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
                Del
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col border border-gray-50 bg-white dark:bg-zinc-900">
        <div className="h-full w-full flex flex-col">
          <header className="px-6 py-4 border-b border-gray-100 dark:border-zinc-700 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-800 dark:to-zinc-900">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-black dark:text-white">
                  Chat With AI
                </h2>
                <p className="text-sm text-red-600 dark:text-red-500 font-medium">
                  SH AI Assistance!
                </p>
              </div>
            </div>
          </header>

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
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-lg shadow-sm text-sm leading-6 ${
                    m.role === "user"
                      ? "bg-red-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-900 dark:bg-zinc-700 dark:text-white rounded-bl-none"
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
                              {String(source)}
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
          </div>

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
            {hasPersonalKB && (
              <select
                value={kbType}
                onChange={(e) =>
                  setKbType(e.target.value as "default" | "custom")
                }
                className="px-3 py-2 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={loading}
              >
                <option value="default">SH DB</option>
                <option value="custom">Custom DB</option>
              </select>
            )}

            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-semibold rounded-md disabled:opacity-60"
              disabled={loading || !query.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
