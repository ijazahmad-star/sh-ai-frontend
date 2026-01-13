"use client";

import { useState } from "react";
import { updateSystemPrompt } from "@/lib/prompts";
import type { Prompt } from "@/types/prompt";

export default function SystemPromptEditActions({
  systemPrompt,
  userId,
  onUpdate,
}: {
  systemPrompt: Prompt;
  userId: string;
  onUpdate?: (updated: Prompt) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(systemPrompt.prompt);

  const handleEdit = () => {
    setShowModal(true);
  };

  const handleSaveEditChange = async () => {
    try {
      const ok = await updateSystemPrompt(
        systemPrompt.name,
        editedPrompt,
        userId
      );
      if (!ok) {
        console.error("Failed to update prompt:", systemPrompt.name);
        return;
      }
      const updated: Prompt = { ...systemPrompt, prompt: editedPrompt };
      try {
        if (onUpdate) onUpdate(updated);
      } catch (e) {
        console.error("Error in onUpdate callback:", e);
      }
      console.log("Updated prompt with name:", systemPrompt.name);
    } catch (error) {
      console.error("Error updating prompt:", error);
    }
    setShowModal(false);
  };

  return (
    <>
      <button
        className="px-3 py-1.5 rounded text-xs font-semibold bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
        onClick={handleEdit}
      >
        Edit
      </button>
      {showModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-4 text-black dark:text-white">
              Edit Prompt: {systemPrompt.name}
            </h2>
            <textarea
              className="w-full h-64 p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600 outline-none transition-all resize-none"
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              placeholder="Enter system instruction..."
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary px-6 py-2 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
                onClick={handleSaveEditChange}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
