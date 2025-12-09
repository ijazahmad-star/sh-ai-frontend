"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Navigation from "@/components/Navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

interface Document {
  id: string;
  filename: string;
  metadata: any;
  createdAt?: string;
}

export default function KnowledgeBasePage() {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [hasPersonalKB, setHasPersonalKB] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      loadDocuments();
      checkUserKB();
    }
  }, [session?.user?.id]);

  const checkUserKB = async () => {
    if (!session?.user?.id) return;
    
    try {
      const res = await fetch(`${API_BASE}/check_user_kb/${session.user.id}`);
      if (res.ok) {
        const data = await res.json();
        setHasPersonalKB(data.has_personal_kb);
      }
    } catch (e) {
      console.error("Failed to check user KB:", e);
    }
  };

  const loadDocuments = async () => {
    if (!session?.user?.id) return;
    
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/get_user_documents/${session.user.id}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (e) {
      console.error("Failed to load documents:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session?.user?.id) return;

    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadMessage({ type: 'error', text: 'Invalid file type. Please upload PDF files only.' });
      setTimeout(() => setUploadMessage(null), 5000);
      event.target.value = '';
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', session.user.id);

      const res = await fetch(`${API_BASE}/upload_user_document`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        setUploadMessage({ 
          type: 'success', 
          text: `File "${result.filename}" uploaded successfully!` 
        });
        loadDocuments();
        checkUserKB();
      } else {
        // Safely parse error response - FastAPI returns error.detail
        let errorMessage = `Upload failed (Status: ${res.status})`;
        try {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await res.json();
            // FastAPI HTTPException returns error in 'detail' field
            // Use optional chaining to safely access properties
            errorMessage = error?.detail || error?.message || errorMessage;
          } else {
            const text = await res.text();
            errorMessage = text || errorMessage;
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          errorMessage = `Server error (${res.status}). Please check backend logs.`;
        }
        console.error('Upload error:', errorMessage);
        setUploadMessage({ type: 'error', text: errorMessage });
      }

      setTimeout(() => setUploadMessage(null), 5000);
      event.target.value = '';
    } catch (error) {
      console.error('File upload error:', error);
      const errorMessage = error instanceof Error 
        ? `Network error: ${error.message}. Please check if the backend service is running at ${API_BASE}`
        : 'Failed to upload file. Please try again.';
      setUploadMessage({ type: 'error', text: errorMessage });
      setTimeout(() => setUploadMessage(null), 5000);
      event.target.value = '';
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    if (!session?.user?.id) return;

    try {
      const res = await fetch(
        `${API_BASE}/delete_user_document/${session.user.id}/${documentId}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        setUploadMessage({ type: 'success', text: 'Document deleted successfully!' });
        loadDocuments();
        checkUserKB();
        setTimeout(() => setUploadMessage(null), 3000);
      } else {
        // Safely parse error response
        let errorMessage = `Delete failed (Status: ${res.status})`;
        try {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await res.json();
            // Use optional chaining to safely access properties
            errorMessage = error?.detail || error?.message || errorMessage;
          } else {
            const text = await res.text();
            errorMessage = text || errorMessage;
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          errorMessage = `Server error (${res.status}). Please check backend logs.`;
        }
        setUploadMessage({ type: 'error', text: errorMessage });
        setTimeout(() => setUploadMessage(null), 3000);
      }
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = error instanceof Error 
        ? `Network error: ${error.message}. Please check if the backend service is running at ${API_BASE}`
        : 'Failed to delete document.';
      setUploadMessage({ type: 'error', text: errorMessage });
      setTimeout(() => setUploadMessage(null), 3000);
    }
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
      <div className="container max-w-5xl mx-auto px-4">
      <Navigation />
        <header className="py-8">
          <h1 className="text-3xl font-extrabold text-black dark:text-white">
            My Knowledge Base
          </h1>
          <div className="mt-3">
            {hasPersonalKB ? (
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                <p className="text-base text-green-600 dark:text-green-400 font-medium">
                  Your queries will use your personal Knowledge Base
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full"></span>
                <p className="text-base text-gray-600 dark:text-gray-400">
                  You're currently using the default Knowledge Base. Upload documents to create your personal KB.
                </p>
              </div>
            )}
          </div>
        </header>

        {/* Upload Message */}
        {uploadMessage && (
          <div className={`mb-4 p-4 rounded-md ${
            uploadMessage.type === 'success' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
          }`}>
            {uploadMessage.text}
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white dark:bg-zinc-900 shadow-lg rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-black dark:text-white">
              Upload Documents
            </h2>
            <label
              htmlFor="kb-file-upload"
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm cursor-pointer transition-colors ${
                isUploading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Upload PDF</span>
                </>
              )}
            </label>
            <input
              id="kb-file-upload"
              type="file"
              className="hidden"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload PDF documents to create your personal knowledge base. Your queries will search through your uploaded documents.
          </p>
        </div>

        {/* Documents List */}
        <div className="bg-white dark:bg-zinc-900 shadow-lg rounded-xl p-6">
          <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
            Your Documents ({documents.length})
          </h2>

          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading...</p>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-gray-500">
                No documents uploaded yet. Upload your first document to start building your personal KB.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <h3 className="font-medium text-black dark:text-white">
                        {doc.filename}
                      </h3>
                      {doc.createdAt && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-semibold transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

