"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;
      
      const result = await fetchAllSystemPrompts(session.user.id);
      if (result) {
        setSystemPrompts(result.prompts || []);
      }
    };
    fetchData();
  }, [session?.user?.id]);

  const handleDelete = async (name: string) => {
    if (!session?.user?.id) {
      console.error("User not authenticated");
      return;
    }
    
    const status = await deleteSystemPrompt(name, session.user.id);
    if (!status) {
      console.error("Failed to delete prompt:", name);
      return;
    }
    console.log("Delete prompt with name:", name);
    setSystemPrompts((prev) => prev.filter((p) => p.name !== name));
  };

  const handleSetActive = async (name: string) => {
    if (!session?.user?.id) {
      console.error("User not authenticated");
      return;
    }
    
    const status = await setActiveSystemPrompt(name, session.user.id);
    if (!status) {
      console.error("Failed to set active prompt:", name);
      return;
    }
    console.log("Set active prompt with name:", name);
    setSystemPrompts((prev) =>
      prev.map((p) =>
        p.name === name ? { ...p, is_active: true } : { ...p, is_active: false }
      )
    );
  };

  const handleOnEditUpdate = (updated: Prompt) => {
    setSystemPrompts((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  const handleOnAddNewPrompt = (newPrompt: Prompt) => {
    setSystemPrompts((prev) => [
      {
        id: newPrompt.id,
        name: newPrompt.name,
        prompt: newPrompt.prompt,
        is_active: newPrompt.is_active,
      },
      ...prev,
    ]);
  };

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
    <div className="min-h-screen py-8 bg-white dark:from-black dark:to-zinc-900 font-sans">
      <div className="container dark:text-white">
        <header className="hero py-8 p-4 ">
          <h1 className="text-xl sm:text-3xl font-extrabold text-black dark:text-white">
            System Prompts
          </h1>
          <p className="mt-3 text-base text-red-600 dark:text-red-500 max-w-2xl font-medium">
            SH AI Assistance!
          </p>
        </header>

        <main className="mt-8">
          <div className="card bg-white dark:bg-zinc-900 shadow-lg rounded-xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black dark:text-white">
                Prompts
              </h2>
              <div>
                <button
                  className="btn-primary hover:opacity-90"
                  onClick={() => setShowComponent(true)}
                >
                  New Prompt
                </button>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="text-sm text-left text-gray-600 dark:text-gray-300">
                    <th className="py-3 px-4">Prompt Name</th>
                    <th className="py-3 px-4 ">Prompt Text</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {systemPrompts.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-6 px-4 text-center text-gray-500"
                      >
                        No prompts found.
                      </td>
                    </tr>
                  )}
                  {systemPrompts.map((sp, index) => (
                    <tr key={index} className="align-top">
                      <td className="py-4 px-4 text-sm text-slate-700 dark:text-gray-200">
                        {sp.name}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-700 dark:text-gray-200 max-w-md truncate">
                        {sp.prompt}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <span
                          className={
                            "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full " +
                            (sp.is_active
                              ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300")
                          }
                        >
                          {sp.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm gap-2 flex">
                        <SystemPromptEditActions
                          systemPrompt={sp}
                          userId={session.user.id}
                          onUpdate={handleOnEditUpdate}
                        />
                        <button
                          className={`ml-2 px-3 py-1 rounded font-semibold
                            ${
                              sp.is_active
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                                : "bg-red-600 text-white hover:bg-red-700"
                            }`}
                          disabled={sp.is_active}
                          onClick={() => handleSetActive(sp.name)}
                        >
                          {sp.is_active ? "InUse" : "Activate"}
                        </button>
                        <button
                          className="btn bg-red-700 hover:bg-red-800 text-white ml-2 px-3 py-1 rounded font-semibold"
                          onClick={() => handleDelete(sp.name)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {showComponent && (
                <AddNewPrompt
                  showComponent={showComponent}
                  userId={session.user.id}
                  onClose={() => setShowComponent(false)}
                  onAdd={handleOnAddNewPrompt}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
