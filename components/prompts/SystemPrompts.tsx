"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

import {
  fetchAllSystemPrompts,
  deleteSystemPrompt,
  setActiveSystemPrompt,
} from "@/lib/prompts";
import type { Prompt } from "@/types/prompt";
import SystemPromptEditActions from "./SystemPromptActions";
import AddNewPrompt from "./AddNewPrompt";

export default function SystemPrompts() {
  const { data: session } = useSession();
  const [systemPrompts, setSystemPrompts] = useState<Prompt[]>([]);
  const [showComponent, setShowComponent] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const result = await fetchAllSystemPrompts(session.user.id);
      if (result) {
        setSystemPrompts(result.prompts || []);
      }
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = useCallback(
    async (name: string) => {
      if (!session?.user?.id) {
        console.error("User not authenticated");
        return;
      }

      setLoading(true);
      try {
        const status = await deleteSystemPrompt(name, session.user.id);
        if (!status) {
          console.error("Failed to delete prompt:", name);
          return;
        }
        console.log("Delete prompt with name:", name);
        setSystemPrompts((prev) => prev.filter((p) => p.name !== name));
      } finally {
        setLoading(false);
      }
    },
    [session?.user?.id]
  );

  const handleSetActive = useCallback(
    async (name: string) => {
      if (!session?.user?.id) {
        console.error("User not authenticated");
        return;
      }

      setLoading(true);
      try {
        const status = await setActiveSystemPrompt(name, session.user.id);
        if (!status) {
          console.error("Failed to set active prompt:", name);
          return;
        }
        console.log("Set active prompt with name:", name);
        setSystemPrompts((prev) =>
          prev.map((p) =>
            p.name === name
              ? { ...p, is_active: true }
              : { ...p, is_active: false }
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [session?.user?.id]
  );

  const handleOnEditUpdate = useCallback((updated: Prompt) => {
    setSystemPrompts((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  }, []);

  const handleOnAddNewPrompt = useCallback((newPrompt: Prompt) => {
    setSystemPrompts((prev) => [...prev, newPrompt]);
  }, []);

  // Show loading state if not authenticated
  if (!session?.user?.id) {
    return (
      <div className="min-h-screen py-8 bg-white dark:from-black dark:to-zinc-900 font-sans">
        <div className="container dark:text-white">
          <div className="text-center py-12">
            <p className="text-gray-500">Please sign in to manage prompts.</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen py-4 sm:py-8 bg-white dark:from-black dark:to-zinc-900 font-sans">
      <div className="container mx-auto px-3 sm:px-4 dark:text-white">
        <header className="hero py-6 sm:py-8 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-black dark:text-white">
                System Prompts
              </h1>
              <p className="mt-2 text-sm sm:text-base text-red-600 dark:text-red-500 font-medium">
                SH AI Assistance!
              </p>
            </div>
            <button
              className="btn-primary w-full sm:w-auto py-2.5 px-4 text-sm sm:text-base"
              onClick={() => setShowComponent(true)}
            >
              + New Prompt
            </button>
          </div>
        </header>

        <main className="mt-6 sm:mt-8">
          <div className="card bg-white dark:bg-zinc-900 shadow-lg rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-semibold text-black dark:text-white">
                All Prompts ({systemPrompts.length})
              </h2>
              {systemPrompts.length > 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Tap on prompts to view details
                </div>
              )}
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 dark:border-red-500"></div>
                  <p className="mt-2 text-gray-500">Loading prompts...</p>
                </div>
              </div>
            ) : (
              <>
                {systemPrompts.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                      <svg
                        className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                      No prompts yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
                      Create your first system prompt to customize AI responses
                    </p>
                    <button
                      className="btn-primary py-2.5 px-6 text-sm sm:text-base"
                      onClick={() => setShowComponent(true)}
                    >
                      Create First Prompt
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full table-auto border-collapse">
                        <thead>
                          <tr className="text-sm text-left text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-zinc-700">
                            <th className="py-3 px-4 font-semibold">
                              Prompt Name
                            </th>
                            <th className="py-3 px-4 font-semibold">
                              Prompt Text
                            </th>
                            <th className="py-3 px-4 font-semibold">Status</th>
                            <th className="py-3 px-4 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                          {systemPrompts.map((sp, index) => (
                            <tr
                              key={index}
                              className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                            >
                              <td className="py-4 px-4 text-sm font-medium text-slate-800 dark:text-gray-200">
                                {sp.name}
                              </td>
                              <td className="py-4 px-4 text-sm text-slate-700 dark:text-gray-300 max-w-lg truncate">
                                {sp.prompt}
                              </td>
                              <td className="py-4 px-4 text-sm">
                                <span
                                  className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                                    sp.is_active
                                      ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                  }`}
                                >
                                  {sp.is_active ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <SystemPromptEditActions
                                    systemPrompt={sp}
                                    userId={session.user.id}
                                    onUpdate={handleOnEditUpdate}
                                  />
                                  <button
                                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                                      sp.is_active
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                                        : "bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                                    }`}
                                    disabled={sp.is_active}
                                    onClick={() => handleSetActive(sp.name)}
                                  >
                                    {sp.is_active ? "Active" : "Activate"}
                                  </button>
                                  <button
                                    className="px-3 py-1.5 rounded text-xs font-semibold bg-red-700 hover:bg-red-800 text-white dark:bg-red-800 dark:hover:bg-red-900 transition-colors"
                                    onClick={() => handleDelete(sp.name)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                      {systemPrompts.map((sp, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700"
                        >
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-slate-800 dark:text-gray-200 text-sm">
                                  {sp.name}
                                </h3>
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 mt-1 text-xs font-medium rounded-full ${
                                    sp.is_active
                                      ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                  }`}
                                >
                                  {sp.is_active ? "Active" : "Inactive"}
                                </span>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Prompt Text
                              </p>
                              <p className="text-sm text-slate-700 dark:text-gray-300 line-clamp-3">
                                {sp.prompt}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-gray-200 dark:border-zinc-700">
                              <div className="flex flex-wrap gap-2">
                                <SystemPromptEditActions
                                  systemPrompt={sp}
                                  userId={session.user.id}
                                  onUpdate={handleOnEditUpdate}
                                />
                                <button
                                  className={`flex-1 px-3 py-2 rounded text-xs font-semibold transition-colors ${
                                    sp.is_active
                                      ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                                      : "bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                                  }`}
                                  disabled={sp.is_active}
                                  onClick={() => handleSetActive(sp.name)}
                                >
                                  {sp.is_active ? "Active" : "Activate"}
                                </button>
                                <button
                                  className="flex-1 px-3 py-2 rounded text-xs font-semibold bg-red-700 hover:bg-red-800 text-white dark:bg-red-800 dark:hover:bg-red-900 transition-colors"
                                  onClick={() => handleDelete(sp.name)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Modal for AddNewPrompt - Mobile Responsive */}
          {showComponent && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <AddNewPrompt
                  showComponent={showComponent}
                  userId={session.user.id}
                  onClose={() => setShowComponent(false)}
                  onAdd={handleOnAddNewPrompt}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
