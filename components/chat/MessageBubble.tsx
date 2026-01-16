"use client";
import React from "react";
import ReactMarkdown from "react-markdown";
import type { Message } from "@/types/chat";

interface Props {
  m: Message;
}
const formatSource = (source: any) => {
  if (source == null) return "";
  if (typeof source === "string") return source;
  if (typeof source === "object") {
    if (
      source.source !== undefined &&
      source.source !== null &&
      String(source.source).trim() !== ""
    ) {
      return String(source.source);
    }
    const str = String(source);
    return str !== "[object Object]" ? str : JSON.stringify(source);
  }
  return String(source);
};

export default function MessageBubble({ m }: Props) {
  // prepare human-readable display strings for sources before rendering
  const sourceDisplays: string[] =
    m.sources && m.sources.length > 0 ? m.sources.map(formatSource) : [];

  // Feedback UI state
  const [thumb, setThumb] = React.useState<"up" | "down">("up");
  const [showModal, setShowModal] = React.useState(false);
  const [comment, setComment] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Check for existing feedback on component mount
  React.useEffect(() => {
    const checkFeedbackStatus = async () => {
      if (m.role === "assistant" && m.id) {
        try {
          const response = await fetch(`/api/chat/messages/${m.id}/feedback`);
          if (response.ok) {
            const data = await response.json();
            if (data.hasFeedback) {
              setSubmitted(true);
              setThumb(data.feedback.thumb);
              if (data.feedback.comment) {
                setComment(data.feedback.comment);
              }
            }
          }
        } catch (error) {
          console.error("Failed to check feedback status:", error);
          // Don't show error to user, just don't pre-populate feedback
        }
      }
    };

    checkFeedbackStatus();
  }, [m.id, m.role]);

  const handleThumb = (type: "up" | "down") => {
    if (submitted || loading) return;
    setThumb(type);
    setShowModal(true);
    setError(""); // Clear any previous errors
  };

  const handleSubmitWithComment = async () => {
    await submitFeedback();
  };

  const submitFeedback = async () => {
    // Only allow feedback for AI responses with valid message ID
    if (m.role !== "assistant" || submitted || loading || !m.id) return;

    setLoading(true);
    setError("");

    try {
      const feedbackData = {
        thumb,
        comment: thumb === "down" ? comment.trim() : "",
        user_query: m.user_query || "",
        ai_response: m.content,
        conversation_id: m.conversation_id, // Add conversation_id to the request
      };

      const response = await fetch(`/api/chat/messages/${m.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackData),
      });

      if (response.status === 409) {
        // Feedback already exists
        setSubmitted(true);
        setError("Feedback already submitted for this message.");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Success
      setSubmitted(true);
      setShowModal(false);
      setComment("");
      setError("");
    } catch (error) {
      console.error("Feedback submission failed:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to submit feedback. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`inline-block max-w-full sm:max-w-[80%] px-4 py-3 rounded-lg shadow-sm text-sm leading-6 ${
        m.role === "user"
          ? "bg-gray-600 text-white rounded-br-none"
          : "bg-gray-200 text-gray-900 dark:bg-zinc-700 dark:text-white rounded-bl-none"
      }`}
    >
      <div className="mb-2">
        <ReactMarkdown>{m.content}</ReactMarkdown>
      </div>

      {/* Feedback buttons for AI responses only */}
      {m.role === "assistant" && !submitted && (
        <div className="flex items-center gap-2 mt-2">
          <button
            className={`px-2 py-1 rounded transition-colors ${
              thumb === "up"
                ? "bg-green-200 dark:bg-green-800"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            onClick={() => handleThumb("up")}
            disabled={loading}
            aria-label="Thumbs up"
          >
            👍
          </button>
          <button
            className={`px-2 py-1 rounded transition-colors ${
              thumb === "down"
                ? "bg-red-200 dark:bg-red-800"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            onClick={() => handleThumb("down")}
            disabled={loading}
            aria-label="Thumbs down"
          >
            👎
          </button>
        </div>
      )}

      {/* Feedback status messages */}
      {submitted && (
        <div className="mt-2 text-green-600 dark:text-green-400 text-xs">
          Thank you for your feedback!
        </div>
      )}

      {error && (
        <div className="mt-2 text-red-600 dark:text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Feedback Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
              {thumb === "up"
                ? "👍 Thanks for the positive feedback!"
                : "👎 Help us improve"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {thumb === "down"
                    ? "What could be better?"
                    : "Any additional comments?"}
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-black dark:text-white resize-none"
                  rows={3}
                  placeholder={
                    thumb === "down"
                      ? "Tell us what went wrong..."
                      : "Optional feedback..."
                  }
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitWithComment}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {sourceDisplays.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-300 dark:border-zinc-600">
          <p className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Sources ({sourceDisplays.length}):
          </p>
          <div className="space-y-2">
            {sourceDisplays.map((display, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-zinc-800 p-2 rounded border border-gray-200 dark:border-zinc-600"
              >
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 break-all">
                  {display}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
