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
      const body = await addSystemPrompt(name.trim(), promptText.trim(), userId);
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
    }
  };

  return (
    <div>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md bg-white/30 bg-opacity-50 rounded-xl p-3">
          <div className="bg-white p-6 rounded shadow-lg w-1/2">
            <h2 className="text-xl mb-4">Add New Prompt</h2>

            <input
              className="w-full p-2 border border-gray-300 rounded mb-3"
              placeholder="Prompt name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <textarea
              className="w-full h-36 p-2 border border-gray-300 rounded mb-4"
              placeholder="Enter the prompt text here..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
            />

            <div className="flex justify-end">
              <button className="btn-secondary mr-2" onClick={handleClose}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
