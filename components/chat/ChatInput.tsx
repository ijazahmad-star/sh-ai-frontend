"use client";
import React from "react";

interface Props {
  query: string;
  setQuery: (s: string) => void;
  handleFormSubmit: (
    e: React.FormEvent<HTMLFormElement>
  ) => Promise<void> | void;
  kbType: "default" | "custom";
  setKbType: (k: "default" | "custom") => void;
  hasPersonalKB: boolean;
  hasAccessToDefaultKB: boolean;
  loading: boolean;
  disabled?: boolean;
}

export default function ChatInput({
  query,
  setQuery,
  handleFormSubmit,
  kbType,
  setKbType,
  hasPersonalKB,
  hasAccessToDefaultKB,
  loading,
  disabled,
}: Props) {
  return (
    <form
      onSubmit={handleFormSubmit}
      className="px-4 py-3 border-t border-gray-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center gap-3"
    >
      {hasPersonalKB && hasAccessToDefaultKB && (
        <select
          value={kbType}
          onChange={(e) => setKbType(e.target.value as "default" | "custom")}
          className="px-3 py-2 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-slate-900 dark:text-white"
          disabled={loading || disabled}
        >
          <option value="default">SH DB</option>
          <option value="custom">Custom DB</option>
        </select>
      )}

      {!hasPersonalKB && hasAccessToDefaultKB && (
        <select
          value="default"
          className="px-3 py-2 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
          disabled
        >
          <option value="default">SH DB</option>
        </select>
      )}

      {hasPersonalKB && !hasAccessToDefaultKB && (
        <select
          value="custom"
          className="px-3 py-2 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
          disabled
        >
          <option value="custom">Custom DB</option>
        </select>
      )}

      <input
        id="query"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={disabled}
        className="flex-1 px-3 py-2 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        placeholder="Type your question..."
      />

      <button
        type="submit"
        className="btn-primary"
        disabled={disabled || loading || !query.trim()}
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
  );
}
