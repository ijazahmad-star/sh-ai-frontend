import Link from "next/link";
import PromptGenerator from "@/components/prompts/PromptGenerator";
import Navigation from "@/components/Navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function PromptGeneratorPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-white to-zinc-50 dark:from-black dark:to-zinc-900 font-sans">
        <div className="text-center p-8 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-xl">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Access Denied
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            You must be signed in to use the prompt generator.
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
    <div className="min-h-screen bg-linear-to-b from-white to-zinc-50 dark:from-black dark:to-zinc-900">
      <Navigation />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <header className="py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white">
                AI Prompt Generator
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Transform your ideas into powerful system prompts with AI
                assistance
              </p>
            </div>
          </div>
        </header>
        <PromptGenerator />
      </div>
    </div>
  );
}
