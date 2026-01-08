"use client";
import React from "react";
import ReactMarkdown from "react-markdown";
import type { Message } from "@/types/chat";

interface Props {
  m: Message;
}

export default function MessageBubble({ m }: Props) {
  return (
    <div
      className={`inline-block max-w-full sm:max-w-[80%] px-4 py-3 rounded-lg shadow-sm text-sm leading-6 ${
        m.role === "user"
          ? "bg-gray-600 text-white rounded-br-none"
          : "bg-gray-200 text-gray-900 dark:bg-zinc-700 dark:text-white rounded-bl-none"
      }`}
    >
      <div className="mb-2">
        <ReactMarkdown>{m.content}</ReactMarkdown>
      </div>

      {m.sources && m.sources.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-300 dark:border-zinc-600">
          <p className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Sources ({m.sources.length}):
          </p>
          <div className="space-y-2">
            {m.sources.map((source, idx) => (
              <div
                key={idx}
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
  );
}
