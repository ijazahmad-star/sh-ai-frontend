import Navigation from "@/components/Navigation";
import KnowledgeBaseClient from "@/components/knowledge-base/KnowledgeBaseClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

interface Document {
  id: string;
  filename: string;
  created_at?: string;
}

export default async function KnowledgeBasePage() {
  const session = (await getServerSession(authOptions as any)) as any;
  const userId = session?.user?.id;

  let documents: Document[] = [];
  if (userId) {
    try {
      const res = await fetch(`${API_BASE}/get_user_documents/${userId}`);
      if (res.ok) {
        const data = await res.json();
        documents = data.documents || [];
      }
    } catch (e) {
      // ignore
    }
  }

  if (!userId) {
    return (
      <div className="min-h-screen py-8 bg-linear-to-b from-white to-zinc-50 dark:from-black dark:to-zinc-900">
        <div className="container max-w-5xl mx-auto px-4">
          <p className="text-center text-gray-500 py-12">
            Please sign in to manage your Knowledge Base.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-zinc-50 dark:from-black dark:to-zinc-900">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </div>
      <div className="container mx-auto px-3 sm:px-4 pt-16 sm:pt-20">
        <header className="py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
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

        <KnowledgeBaseClient initialDocuments={documents} userId={userId} />
      </div>
    </div>
  );
}
