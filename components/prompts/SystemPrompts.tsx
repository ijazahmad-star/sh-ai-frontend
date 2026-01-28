"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Loader2, MoreHorizontal, Trash2 } from "lucide-react";

import {
  fetchAllSystemPrompts,
  deleteSystemPrompt,
  setActiveSystemPrompt,
} from "@/lib/prompts";
import type { Prompt } from "@/types/prompt";
import AddNewPrompt from "./AddNewPrompt";
import SystemPromptEditActions from "./SystemPromptActions";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";

export default function SystemPrompts() {
  const { data: session } = useSession();
  const [systemPrompts, setSystemPrompts] = useState<Prompt[]>([]);
  const [showComponent, setShowComponent] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);
  const [activatingPrompt, setActivatingPrompt] = useState<string | null>(null);

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

  const handleDelete = useCallback((name: string) => {
    setPromptToDelete(name);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!session?.user?.id || !promptToDelete) return;

    try {
      const status = await deleteSystemPrompt(promptToDelete, session.user.id);
      if (!status) return;
      setSystemPrompts((prev) => prev.filter((p) => p.name !== promptToDelete));
    } catch (error) {
      console.error("Error deleting prompt:", error);
    } finally {
      setShowDeleteModal(false);
      setPromptToDelete(null);
    }
  }, [session?.user?.id, promptToDelete]);

  const handleSetActive = useCallback(
    async (name: string) => {
      if (!session?.user?.id) return;

      setActivatingPrompt(name);
      try {
        const status = await setActiveSystemPrompt(name, session.user.id);
        if (!status) return;

        setSystemPrompts((prev) =>
          prev.map((p) =>
            p.name === name
              ? { ...p, is_active: true }
              : { ...p, is_active: false }
          )
        );
      } catch (error) {
        console.error("Error setting active prompt:", error);
      } finally {
        setActivatingPrompt(null);
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

  if (!session?.user?.id) {
    return (
      <div className="py-8 font-sans">
        <div className="container dark:text-white">
          <div className="text-center py-12">
            <p className="text-gray-500">Please sign in to manage prompts.</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="py-4 sm:py-8 font-sans">
      <div className="container mx-auto px-3 sm:px-4 dark:text-white">
        <header className="py-6 sm:py-8 px-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-black dark:text-white">
                System Prompts
              </h1>
              <p className="mt-2 text-sm sm:text-base text-red-600 dark:text-red-500 font-bold">
                SH AI Assistance!
              </p>
            </div>
            <Button
              className="btn-primary w-full sm:w-auto py-5.5 px-6 text-sm sm:text-base shadow-lg shadow-primary-500/20"
              onClick={() => setShowComponent(true)}
            >
              + New Prompt
            </Button>
          </div>
        </header>

        <main className="mt-6 sm:mt-8">
          <div className="card bg-white dark:bg-zinc-900 shadow-lg rounded-xl p-4 sm:p-6 overflow-visible">
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
                  <div className="text-center py-8 sm:py-12 dark:bg-zinc-900 shadow-lg">
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
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader >
                          <TableRow>
                            <TableHead className="text-black dark:text-white font-bold">Prompt Name</TableHead>
                            <TableHead className="text-black dark:text-white font-bold">Prompt Text</TableHead>
                            <TableHead className="text-black dark:text-white font-bold">Status</TableHead>
                            <TableHead className="text-black dark:text-white font-bold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {systemPrompts.map((sp, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium text-black dark:text-white">
                                {sp.name}
                              </TableCell>
                              <TableCell className="max-w-lg truncate text-black dark:text-white">
                                {sp.prompt}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                                    sp.is_active
                                      ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                  }`}
                                >
                                  {sp.is_active ? "Active" : "Inactive"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <SystemPromptEditActions
                                    systemPrompt={sp}
                                    userId={session.user.id}
                                    onUpdate={handleOnEditUpdate}
                                  />
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className="p-1 rounded bg-gray-100 hover:bg-zinc-200 dark:hover:bg-zinc-700">
                                        <MoreHorizontal className="w-4 h-4 cursor-pointer text-black dark:text-white" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="w-48"
                                    >
                                      <DropdownMenuItem
                                        disabled={
                                          sp.is_active ||
                                          activatingPrompt === sp.name
                                        }
                                        onClick={() => handleSetActive(sp.name)}
                                        className={`${
                                          sp.is_active
                                            ? "cursor-not-allowed opacity-50"
                                            : "cursor-pointer"
                                        }`}
                                      >
                                        {activatingPrompt === sp.name ? (
                                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                          <span className="mr-2">⚡</span>
                                        )}
                                        {sp.is_active ? "Active" : "Activate"}
                                      </DropdownMenuItem>

                                      <DropdownMenuItem
                                        onClick={() => handleDelete(sp.name)}
                                        className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
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
                              <div className="flex gap-2">
                                <SystemPromptEditActions
                                  systemPrompt={sp}
                                  userId={session.user.id}
                                  onUpdate={handleOnEditUpdate}
                                />
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="flex-1 px-3 py-2 rounded text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors flex items-center justify-center gap-2">
                                      <MoreHorizontal className="w-4 h-4 text-black dark:text-white"/>
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-48"
                                  >
                                    <DropdownMenuItem
                                      disabled={
                                        sp.is_active ||
                                        activatingPrompt === sp.name
                                      }
                                      onClick={() => handleSetActive(sp.name)}
                                      className={`${
                                        sp.is_active
                                          ? "cursor-not-allowed opacity-50"
                                          : "cursor-pointer"
                                      }`}
                                    >
                                      {activatingPrompt === sp.name ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2 text-black dark:text-white" />
                                      ) : (
                                        <span className="mr-2">⚡</span>
                                      )}
                                      {sp.is_active ? "Active" : "Activate"}
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      onClick={() => handleDelete(sp.name)}
                                      className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                                    >
                                      <span className="mr-2">🗑️</span>
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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

          {/* Delete Confirmation Modal */}
          <ConfirmModal
            open={showDeleteModal}
            title="Delete Prompt"
            description={
              <>
                Are you sure you want to delete the prompt{" "}
                <strong>"{promptToDelete}"</strong>? This action cannot be
                undone.
              </>
            }
            confirmLabel="Delete"
            cancelLabel="Cancel"
            onConfirm={confirmDelete}
            onCancel={() => {
              setShowDeleteModal(false);
              setPromptToDelete(null);
            }}
            maxWidthClass="max-w-md"
          />
        </main>
      </div>
    </div>
  );
}
