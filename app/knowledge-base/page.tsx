"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Navigation from "@/components/Navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

interface Document {
  id: string;
  filename: string;
  created_at?: string;
}

export default function KnowledgeBasePage() {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) loadDocuments();
  }, [session?.user?.id]);

  const loadDocuments = async () => {
    if (!session?.user?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/get_user_documents/${session.user.id}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (_) { }
    finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const res = await fetch(`${API_BASE}/upload_user_document`, { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setUploadMessage({ type: "success", text: `File "${data.file}" uploaded!` });
        loadDocuments();
      } else {
        const error = await res.json();
        setUploadMessage({ type: "error", text: error.detail || "Upload failed." });
      }
      e.target.value = "";
    } catch (_) {
      setUploadMessage({ type: "error", text: "Network error." });
      e.target.value = "";
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadMessage(null), 5000);
    }
  };

  const handleDownload = async (docId: string) => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/download_user_document/${docId}?user_id=${session.user.id}`);
      const data = await res.json();
      if (data.download_url) window.open(data.download_url, "_blank");
    } catch (_) { }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    if (!session?.user?.id) return;
    try {
      await fetch(`${API_BASE}/delete_user_document/${docId}?user_id=${session.user.id}`, { method: "DELETE" });
      setDocuments(docs => docs.filter(d => d.id !== docId));
    } catch (_) { }
  };

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen py-8 bg-white dark:bg-black">
        <div className="container max-w-5xl mx-auto px-4">
          <p className="text-center text-gray-500 py-12">Please sign in to manage your Knowledge Base.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-white dark:bg-black">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </div>
      <div className="container max-w-5xl mx-auto px-4 mt-18">
        <header className="py-8">
          <h1 className="text-3xl font-extrabold text-black dark:text-white">My Knowledge Base</h1>
        </header>

        {uploadMessage && (
          <div className={`mb-4 p-4 rounded-md ${uploadMessage.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}>
            {uploadMessage.text}
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 shadow-lg rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-black dark:text-white">Upload Document</h2>
            <label
              htmlFor="file-upload"
              className={`px-4 py-2 rounded-md font-semibold text-sm cursor-pointer ${isUploading ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white"
                }`}
            >
              {isUploading ? "Uploading..." : "Upload PDF"}
            </label>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 shadow-lg rounded-xl p-6">
          <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Your Documents ({documents.length})</h2>

          {documents.length === 0 ? (
            <p className="text-gray-500 py-4">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>{doc.filename}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(doc.id)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-semibold"
                    >
                      Delete
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
