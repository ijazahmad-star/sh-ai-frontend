"use client";

import { useEffect, useState } from "react";
import { addSystemPrompt } from "@/lib/prompts";
import type { Prompt } from "@/types/prompt";

export default function AddNewPrompt({
  showComponent,
  userId,
  onAdd,
  onClose,
}: {
  showComponent: boolean;
  userId: string;
  onAdd?: (p: Prompt) => void;
  onClose?: () => void;
}) {
  const [showModal, setShowModal] = useState(showComponent);
  const [name, setName] = useState("");
  const [promptText, setPromptText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setShowModal(showComponent);
  }, [showComponent]);

  const handleClose = () => {
    setShowModal(false);
    if (onClose) onClose();
  };

  const handleSave = async () => {
    if (!name.trim() || !promptText.trim()) {
      alert("Please provide both a name and prompt text.");
      return;
    }

    try {
      setLoading(true);
      const body = await addSystemPrompt(
        name.trim(),
        promptText.trim(),
        userId
      );
      if (!body) {
        alert("Failed to add prompt");
        return;
      }

      const created: Prompt = {
        id: body.id,
        name: body.name,
        prompt: body.prompt,
        is_active: body.is_active,
      };
      if (onAdd) onAdd(created);
      // reset fields
      setName("");
      setPromptText("");
      handleClose();
    } catch (error) {
      console.error("Error adding prompt:", error);
      alert("Error adding prompt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-zinc-800">
            <h2 className="text-2xl font-bold mb-6 text-black dark:text-white">
              Add New Prompt
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prompt Name
                </label>
                <input
                  className="w-full p-2.5 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                  placeholder="e.g. Sales Assistant"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prompt Instruction
                </label>
                <textarea
                  className="w-full h-48 p-2.5 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600 outline-none transition-all resize-none"
                  placeholder="Enter the system instruction here..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                className={`px-4 py-2 rounded-lg font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className={`btn-primary px-6 py-2 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  "Save Prompt"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
