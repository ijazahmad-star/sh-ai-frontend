"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Navigation from "@/components/Navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

interface Document {
  id: string;
  filename: string;
  created_at?: string;
}

export default function KnowledgeBasePage() {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE}/get_user_documents/${session.user.id}`
      );
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id) loadDocuments();
  }, [session?.user?.id, loadDocuments]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user?.id) return;

    const allowedTypes = ["application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setUploadMessage({ type: "error", text: "Only PDF files are allowed." });
      setTimeout(() => setUploadMessage(null), 5000);
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", session.user.id);

      const res = await fetch(`${API_BASE}/upload_user_document`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setUploadMessage({
          type: "success",
          text: `File "${data.file}" uploaded!`,
        });
        loadDocuments();
      } else {
        const error = await res.json();
        setUploadMessage({
          type: "error",
          text: error.detail || "Upload failed.",
        });
      }
      e.target.value = "";
    } catch (_) {
      setUploadMessage({ type: "error", text: "Network error." });
      e.target.value = "";
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadMessage(null), 5000);
    }
  }, [session?.user?.id, loadDocuments]);

  const handleDownload = useCallback(async (docId: string) => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch(
        `${API_BASE}/download_user_document/${docId}?user_id=${session.user.id}`
      );
      const data = await res.json();
      if (data.download_url) window.open(data.download_url, "_blank");
    } catch (_) { }
  }, [session?.user?.id]);

  const handleDelete = useCallback(async (docId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    if (!session?.user?.id) return;
    try {
      await fetch(
        `${API_BASE}/delete_user_document/${docId}?user_id=${session.user.id}`,
        { method: "DELETE" }
      );
      setDocuments((docs) => docs.filter((d) => d.id !== docId));
    } catch (_) { }
  }, [session?.user?.id]);

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen py-8 bg-white dark:bg-black">
        <div className="container max-w-5xl mx-auto px-4">
          <p className="text-center text-gray-500 py-12">
            Please sign in to manage your Knowledge Base.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </div>
      <div className="container mx-auto px-3 sm:px-4 pt-16 sm:pt-20">
        <header className="py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-black dark:text-white">
                My Knowledge Base
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Upload and manage your PDF documents
              </p>
            </div>
          </div>
        </header>

        {/* Upload Status Messages */}
        {uploadMessage && (
          <div
            className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg ${uploadMessage.type === "success"
              ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200"
              : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200"
              }`}
          >
            <div className="flex items-start">
              {uploadMessage.type === "success" ? (
                <svg
                  className="w-5 h-5 mr-2 mt-0.5 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 mr-2 mt-0.5 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span className="text-sm sm:text-base">{uploadMessage.text}</span>
            </div>
          </div>
        )}

        {/* Upload Card */}
        <div className="bg-white dark:bg-zinc-900 shadow-lg rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-black dark:text-white">
                Upload Document
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Upload PDF files to your personal knowledge base
              </p>
            </div>
            <div className="relative">
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <label
                htmlFor="file-upload"
                className={`inline-flex items-center justify-center w-full sm:w-auto px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors ${isUploading
                  ? "bg-gray-400 cursor-not-allowed text-gray-700"
                  : "bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                  }`}
              >
                {isUploading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    Upload PDF
                  </>
                )}
              </label>
            </div>
          </div>

          {/* File requirements hint */}
          <div className="mt-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">Note:</span> Only PDF files are
              supported.
            </p>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white dark:bg-zinc-900 shadow-lg rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
            <h2 className="text-lg font-semibold text-black dark:text-white">
              Your Documents ({documents.length})
            </h2>
            {documents.length > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tap on a document to manage it
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Loading documents...
                </p>
              </div>
            </div>
          ) : documents.length === 0 ? (
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                No documents yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
                Upload your first PDF document to build your knowledge base
              </p>
              <label
                htmlFor="file-upload"
                className="inline-flex items-center justify-center px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm cursor-pointer"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload First Document
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-start gap-3 mb-3 sm:mb-0">
                    <div className="shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-red-600 dark:text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {doc.filename}
                      </h3>
                    </div>
                  </div>

                  <div className="flex gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleDownload(doc.id)}
                      className="inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors flex-1 sm:flex-none"
                    >
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      <span className="hidden sm:inline">Download</span>
                      <span className="sm:hidden">DL</span>
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors flex-1 sm:flex-none"
                    >
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <span className="hidden sm:inline">Delete</span>
                      <span className="sm:hidden">Del</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
