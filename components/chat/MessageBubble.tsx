"use client";
import React from "react";
import ReactMarkdown from "react-markdown";
import type { Message } from "@/types/chat";

interface Props {
  m: Message;
}
const formatSource = (source: any) => {
  if (source == null) return "";
  if (typeof source === "string") return source;
  if (typeof source === "object") {
    if (
      source.source !== undefined &&
      source.source !== null &&
      String(source.source).trim() !== ""
    ) {
      return String(source.source);
    }
    const str = String(source);
    return str !== "[object Object]" ? str : JSON.stringify(source);
  }
  return String(source);
};

export default function MessageBubble({ m }: Props) {
  // prepare human-readable display strings for sources before rendering

  const sourceDisplays: string[] =
    m.sources && m.sources.length > 0 ? m.sources.map(formatSource) : [];

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

      {sourceDisplays.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-300 dark:border-zinc-600">
          <p className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Sources ({sourceDisplays.length}):
          </p>
          <div className="space-y-2">
            {sourceDisplays.map((display, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-zinc-800 p-2 rounded border border-gray-200 dark:border-zinc-600"
              >
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 break-all">
                  {display}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
