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
        className="btn-primary mr-2 hover:opacity-70"
        onClick={handleEdit}
      >
        Edit
      </button>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md bg-white/30 bg-opacity-50 rounded-xl p-3">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-1/2">
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
              Edit Prompt: {systemPrompt.name}
            </h2>
            <textarea
              className="w-full h-40 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
            />
            <div className="mt-4 flex justify-end">
              <button
                className="btn-secondary mr-2"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveEditChange}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
