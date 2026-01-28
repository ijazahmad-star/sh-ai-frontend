"use client";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Plus, ChevronDown } from "lucide-react";
import { models } from "@/lib/constants/models";

interface Props {
  query: string;
  setQuery: (s: string) => void;
  handleFormSubmit: (
    e: React.FormEvent<HTMLFormElement>,
  ) => Promise<void> | void;
  kbType: "default" | "custom";
  setKbType: (k: "default" | "custom") => void;
  hasPersonalKB: boolean;
  hasAccessToDefaultKB: boolean;
  loading: boolean;
  disabled?: boolean;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
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
  selectedModel,
  setSelectedModel,
}: Props) {
  const [showDb, setShowDb] = useState(false);
  return (
    <form
      onSubmit={handleFormSubmit}
      className="px-4 py-3 border-t border-gray-100 dark:border-zinc-700 bg-white dark:bg-zinc-800"
    >
      <div className="relative flex items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setShowDb((v) => !v)}
          disabled={disabled || loading}
          className="absolute left-2 h-8 w-8 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          <Plus className="w-6 h-6" />
        </Button>

        <Input
          id="query"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDb(false);
          }}
          disabled={disabled || loading}
          className="w-full pl-12 pr-32 py-5 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Type your question..."
        />

        {/* Model Selection Dropdown */}
        <div className="absolute right-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="text-black dark:text-white">
              <Button
                type="button"
                variant="outline"
                disabled={disabled || loading}
                className="h-10 w-28 px-2 rounded-full text-sm justify-between"
              >
                <span className="truncate">{selectedModel}</span>
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              {models.map((model) => (
                <DropdownMenuItem
                  key={model}
                  onClick={() => setSelectedModel(model)}
                  className={selectedModel === model ? "bg-accent" : ""}
                >
                  {model}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* <Button
          type="submit"
          disabled={disabled || loading || !query.trim()}
          className="absolute right-2 h-8 w-8 p-0"
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
        </Button> */}

        {showDb && (
          <div className="absolute text-black dark:text-white bottom-14 left-0 z-50">
            {hasPersonalKB && hasAccessToDefaultKB && (
              <div className="w-48 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md shadow-lg">
                <div
                  onClick={() => {
                    setKbType("default");
                    setShowDb(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 first:rounded-t-md ${
                    kbType === "default" ? "bg-accent" : ""
                  }`}
                >
                  SH DB
                </div>
                <div
                  onClick={() => {
                    setKbType("custom");
                    setShowDb(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 last:rounded-b-md ${
                    kbType === "custom" ? "bg-accent" : ""
                  }`}
                >
                  Custom DB
                </div>
              </div>
            )}

            {!hasPersonalKB && hasAccessToDefaultKB && (
              <div className="w-48 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md shadow-lg">
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 cursor-default">
                  SH DB
                </div>
              </div>
            )}

            {hasPersonalKB && !hasAccessToDefaultKB && (
              <div className="w-48 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md shadow-lg">
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 cursor-default">
                  Custom DB
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
