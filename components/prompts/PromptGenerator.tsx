"use client";

import { useState, memo } from "react";
import { useSession } from "next-auth/react";
import {
  generatePrompt,
  addSystemPrompt,
  setActiveSystemPrompt,
} from "@/lib/prompts";
import type { Prompt } from "@/types/prompt";
import { Wand2, Save, Play, RotateCcw, Loader2, Copy } from "lucide-react";

interface PromptGeneratorProps {
  onPromptAdded?: (newPrompt: Prompt) => void;
}

const PromptGenerator = memo(function PromptGenerator({
  onPromptAdded,
}: PromptGeneratorProps) {
  const { data: session } = useSession();

  // Initialize state
  const [requirements, setRequirements] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [promptName, setPromptName] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [activateAfterSave, setActivateAfterSave] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!requirements.trim()) {
      setError("Please enter your requirements first.");
      return;
    }

    if (!session?.user?.id) {
      setError("You must be signed in to generate prompts.");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const result = await generatePrompt(requirements.trim(), session.user.id);
      if (result && result.generated_prompt) {
        setGeneratedPrompt(result.generated_prompt);
      } else {
        setError("Failed to generate prompt. Please try again.");
      }
    } catch (err) {
      console.error("Error generating prompt:", err);
      setError(
        "An error occurred while generating the prompt. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!promptName.trim()) {
      setError("Please enter a name for the prompt.");
      return;
    }

    if (!session?.user?.id) {
      setError("You must be signed in to save prompts.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const result = await addSystemPrompt(
        promptName.trim(),
        generatedPrompt,
        session.user.id
      );
      if (result) {
        setShowSaveModal(false);
        setPromptName("");
        if (onPromptAdded) {
          onPromptAdded(result);
        }
        // Reset form
        setRequirements("");
        setGeneratedPrompt("");
      } else {
        setError("Failed to save prompt. Please try again.");
      }
    } catch (err) {
      console.error("Error saving prompt:", err);
      setError("An error occurred while saving the prompt. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!promptName.trim()) {
      setError("Please enter a name for the prompt first.");
      return;
    }

    if (!session?.user?.id) {
      setError("You must be signed in to activate prompts.");
      return;
    }

    setIsActivating(true);
    setError("");

    try {
      // First save the prompt
      const savedPrompt = await addSystemPrompt(
        promptName.trim(),
        generatedPrompt,
        session.user.id
      );
      if (!savedPrompt) {
        setError("Failed to save prompt before activating.");
        setIsActivating(false);
        return;
      }

      // Then activate it
      const activated = await setActiveSystemPrompt(
        promptName.trim(),
        session.user.id
      );
      if (activated) {
        setShowSaveModal(false);
        setPromptName("");
        if (onPromptAdded) {
          onPromptAdded(savedPrompt);
        }
        // Reset form
        setRequirements("");
        setGeneratedPrompt("");
      } else {
        setError(
          "Prompt saved but failed to activate. You can activate it later from the System Prompts page."
        );
      }
    } catch (err) {
      console.error("Error activating prompt:", err);
      setError(
        "An error occurred while activating the prompt. Please try again."
      );
    } finally {
      setIsActivating(false);
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const handleSaveAndActivate = () => {
    setShowSaveModal(true);
  };
  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(generatedPrompt)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      })
      .catch((err) => console.error("Failed to copy:", err));
  };

  return (
    <div className="max-w-auto mx-auto space-y-6">
      {/* Requirements Input */}
      <div className="card bg-white dark:bg-zinc-900 shadow-lg rounded-xl p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-2">
            AI Prompt Generator
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Describe what you want your AI assistant to do, and we'll generate a
            comprehensive system prompt for you.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="requirements"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Your Requirements *
            </label>
            <textarea
              id="requirements"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Example: Create an AI assistant that helps with wrtiting professional prompts..."
              className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-zinc-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
              disabled={isGenerating}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !requirements.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate Prompt
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Prompt Display */}
      {generatedPrompt && (
        <div className="card bg-white dark:bg-zinc-900 shadow-lg rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              Generated System Prompt
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Review the generated prompt below. You can save it for later use
              or activate it immediately.
            </p>
          </div>

          <div className="relative bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 mb-6">
            <button
              onClick={copyToClipboard}
              className="absolute top-2 right-2 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-md transition-colors z-10 flex items-center gap-1.5 font-medium"
              title="Copy prompt to clipboard"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? "Copied" : "Copy prompt"}
            </button>
            <textarea
              className="w-full h-40 text-sm text-gray-800 dark:text-gray-200 font-mono bg-transparent resize-none focus:outline-none leading-relaxed pr-28"
              value={generatedPrompt}
              onChange={(e) => setGeneratedPrompt(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  Regenerate
                </>
              )}
            </button>

            <button
              onClick={handleSaveAndActivate}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Prompt
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
              Save Generated Prompt
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="promptName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Prompt Name *
                </label>
                <input
                  id="promptName"
                  type="text"
                  value={promptName}
                  onChange={(e) => setPromptName(e.target.value)}
                  placeholder="Enter a name for your prompt"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-zinc-800 text-black dark:text-white"
                  disabled={isSaving || isActivating}
                />
              </div>

              <div className="flex items-center">
                <input
                  id="activateCheckbox"
                  type="checkbox"
                  checked={activateAfterSave}
                  onChange={(e) => setActivateAfterSave(e.target.checked)}
                  className="w-4 h-4 text-red-600 bg-white border-gray-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-zinc-800 dark:border-zinc-600"
                  disabled={isSaving || isActivating}
                />
                <label
                  htmlFor="activateCheckbox"
                  className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  Activate this prompt after saving
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                  disabled={isSaving || isActivating}
                >
                  Cancel
                </button>

                <button
                  onClick={activateAfterSave ? handleActivate : handleSave}
                  disabled={isSaving || isActivating || !promptName.trim()}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving || isActivating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {activateAfterSave
                        ? "Saving & Activating..."
                        : "Saving..."}
                    </>
                  ) : (
                    <>{activateAfterSave ? "Save & Activate" : "Save"}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default PromptGenerator;
