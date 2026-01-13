"use client";

import React, { useState, useCallback } from "react";
import ConfirmModal from "../ui/ConfirmModal";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

interface Document {
  id: string;
  filename: string;
  created_at?: string;
}

export default function KnowledgeBaseClient({
  initialDocuments,
  userId,
}: {
  initialDocuments: Document[];
  userId: string;
}) {
  const [documents, setDocuments] = useState<Document[]>(
    initialDocuments || []
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDocuments = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/get_user_documents/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !userId) return;

      const allowedTypes = ["application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        setUploadMessage({
          type: "error",
          text: "Only PDF files are allowed.",
        });
        setTimeout(() => setUploadMessage(null), 5000);
        e.target.value = "";
        return;
      }

      setIsUploading(true);
      setUploadMessage(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("user_id", userId);

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
      } catch (err) {
        setUploadMessage({ type: "error", text: "Network error." });
        e.target.value = "";
      } finally {
        setIsUploading(false);
        setTimeout(() => setUploadMessage(null), 5000);
      }
    },
    [userId, loadDocuments]
  );

  const handleDownload = useCallback(
    async (docId: string) => {
      if (!userId) return;
      try {
        const res = await fetch(
          `${API_BASE}/download_user_document/${docId}?user_id=${userId}`
        );
        const data = await res.json();
        if (data.download_url) window.open(data.download_url, "_blank");
      } catch (e) {
        // ignore
      }
    },
    [userId]
  );

  const handleDelete = useCallback(async (docId: string) => {
    // open confirmation modal
    setPendingDeleteId(docId);
  }, []);

  const confirmDelete = useCallback(async () => {
    const docId = pendingDeleteId;
    if (!docId || !userId) {
      setPendingDeleteId(null);
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(
        `${API_BASE}/delete_user_document/${docId}?user_id=${userId}`,
        { method: "DELETE" }
      );
      if (res.ok) setDocuments((docs) => docs.filter((d) => d.id !== docId));
    } catch (e) {
      // ignore
    } finally {
      setIsDeleting(false);
      setPendingDeleteId(null);
    }
  }, [pendingDeleteId, userId]);

  return (
    <div>
      {uploadMessage && (
        <div
          className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg ${
            uploadMessage.type === "success"
              ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200"
              : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200"
          }`}
        >
          <div className="flex items-start">
            <span className="text-sm sm:text-base">{uploadMessage.text}</span>
          </div>
        </div>
      )}

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
              id="file-upload-kb"
              type="file"
              className="hidden"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload-kb"
              className={`inline-flex items-center justify-center w-full sm:w-auto px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                isUploading
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

        <div className="mt-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">Note:</span> Only PDF files are
            supported.
          </p>
        </div>
      </div>

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
              htmlFor="file-upload-kb"
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
                    <span className="hidden sm:inline">Download</span>
                    <span className="sm:hidden">DL</span>
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors flex-1 sm:flex-none"
                    disabled={isDeleting && pendingDeleteId === doc.id}
                  >
                    <span className="hidden sm:inline">Delete</span>
                    <span className="sm:hidden">Del</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete confirmation modal */}
        <ConfirmModal
          open={!!pendingDeleteId}
          title="Delete document"
          description={
            "Are you sure you want to delete this document? This action cannot be undone."
          }
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={confirmDelete}
          loading={isDeleting}
        />
      </div>
    </div>
  );
}
