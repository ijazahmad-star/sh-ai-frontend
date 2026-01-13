"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { Conversation } from "@/types/chat";

interface Props {
  conversations: Conversation[];
  currentConversationId: string | null;
  createNewConversation: () => Promise<string | null>;
  loadConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, newTitle: string) => Promise<void>;
  isMobile?: boolean;
  onClose?: () => void;
  toggleSidebar?: () => void;
}

export default function Sidebar({
  conversations,
  currentConversationId,
  createNewConversation,
  loadConversation,
  deleteConversation,
  renameConversation,
  isMobile = false,
  onClose,
  toggleSidebar,
}: Props) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNewConversation = async () => {
    await createNewConversation();
    if (onClose) onClose();
  };

  const handleLoadConversation = async (id: string) => {
    if (currentConversationId === id) return;
    await loadConversation(id);
    if (onClose) onClose();
  };

  const startEditing = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditingTitle(conv.title);
    setOpenMenuId(null);
  };

  const handleRename = async (id: string) => {
    if (
      editingTitle.trim() &&
      editingTitle !== conversations.find((c) => c.id === id)?.title
    ) {
      await renameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      handleRename(id);
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f9f9f9] dark:bg-[#171717] text-zinc-600 dark:text-zinc-300 relative group/sidebar">
      <div className="p-3 sticky top-0 bg-[#f9f9f9] dark:bg-[#171717] z-10 flex items-center gap-2">
        <button
          onClick={handleNewConversation}
          className="flex-1 bg-white dark:bg-[#171717] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-white px-3 py-3 rounded-lg text-sm font-medium flex items-center justify-between group transition-colors border border-zinc-200 dark:border-zinc-800"
        >
          <div className="flex items-center gap-2">
            <div className="p-1 bg-zinc-900 dark:bg-white rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3 h-3 text-white dark:text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <span>New chat</span>
          </div>
        </button>

        <button
          onClick={toggleSidebar}
          className="p-3 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 dark:text-zinc-400 hover:cursor-w-resize"
          title="Close sidebar"
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
      </div>

      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
        <div className="mb-2 px-3">
          <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-4">
            Chat History
          </h3>
        </div>

        <div className="space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group relative rounded-lg transition-colors ${
                openMenuId === conv.id ? "z-30" : "z-0"
              } ${
                currentConversationId === conv.id
                  ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}
            >
              {editingId === conv.id ? (
                <input
                  autoFocus
                  className="w-full bg-white dark:bg-zinc-900 border border-blue-500 rounded px-3 py-2 text-sm focus:outline-hidden"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={() => handleRename(conv.id)}
                  onKeyDown={(e) => handleKeyDown(e, conv.id)}
                />
              ) : (
                <>
                  <button
                    onClick={() => handleLoadConversation(conv.id)}
                    className="w-full text-left px-3 py-2 text-sm truncate pr-10"
                  >
                    {conv.title}
                  </button>

                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === conv.id ? null : conv.id);
                      }}
                      className={`${
                        openMenuId === conv.id
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      } p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all rounded`}
                      aria-label="Open conversation menu"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </button>

                    {openMenuId === conv.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 top-8 w-32 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-20 py-1"
                      >
                        <button
                          onClick={() => startEditing(conv)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Rename
                        </button>
                        <button
                          onClick={() => {
                            deleteConversation(conv.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 text-red-500 flex items-center gap-2"
                        >
                          <svg
                            className="w-3.5 h-3.5"
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
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Mobile-only New Chat button placed at bottom of sidebar content */}
        <div className="p-3 sm:hidden">
          <button
            onClick={async () => {
              await handleNewConversation();
              if (onClose) onClose();
            }}
            className="w-full bg-white dark:bg-[#171717] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-white px-3 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-zinc-200 dark:border-zinc-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>New chat</span>
          </button>
        </div>
      </div>
    </div>
  );
}
