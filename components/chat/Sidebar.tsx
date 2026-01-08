"use client";
import React from "react";
import Link from "next/link";
import type { Conversation } from "@/types/chat";

interface Props {
  conversations: Conversation[];
  currentConversationId: string | null;
  createNewConversation: () => Promise<string | null>;
  loadConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  isMobile?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  conversations,
  currentConversationId,
  createNewConversation,
  loadConversation,
  deleteConversation,
  isMobile = false,
  onClose,
}: Props) {
  const handleNewConversation = async () => {
    await createNewConversation();
    if (onClose) onClose();
  };

  const handleLoadConversation = async (id: string) => {
    if(currentConversationId === id) return;
    await loadConversation(id);
    if (onClose) onClose();
  };
  return (
    <div className="p-4">
      <div className="mb-3">
        <button
          onClick={handleNewConversation}
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
            className={`group relative mb-1 ${
              currentConversationId === conv.id
                ? "bg-gray-500 text-white"
                : "bg-gray-300 hover:bg-gray-400 dark:hover:bg-zinc-800 text-gray-900 dark:text-gray-300"
            } rounded-xl`}
          >
            <button
              onClick={() => handleLoadConversation(conv.id)}
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
  );
}
