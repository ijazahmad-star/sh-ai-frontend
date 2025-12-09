import Link from "next/link";

import ChatInterface from "@/components/chat/ChatInterface";
import Navigation from "@/components/Navigation";
import { getServerSession } from "next-auth/next";

export default async function ChatPage() {
  const session = await getServerSession();
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center from-white to-zinc-50 dark:from-black dark:to-zinc-900 font-sans">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Access Denied
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            You must be signed in to view the chat.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all text-sm font-semibold shadow-sm"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="min-h-screen py-4 from-white to-zinc-50 dark:from-black dark:to-zinc-900 font-sans">
        <div className="container">
          <Navigation />
          <ChatInterface />
        </div>
      </div>
    </>
  );
}
