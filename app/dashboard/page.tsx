import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-white to-zinc-50 dark:from-black dark:to-zinc-900 font-sans">
        <div className="text-center p-8 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-xl">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Access Denied
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            You must be signed in to view the dashboard.
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
    <div className="min-h-screen py-4 bg-linear-to-b from-white to-zinc-50 dark:from-black dark:to-zinc-900 font-sans">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </div>
      <div className="container mt-28">
        <main className="mt-8">
          <div className="card bg-white dark:bg-zinc-900 shadow-lg rounded-xl p-6 border border-gray-100 dark:border-zinc-800">
            <h1 className="text-2xl font-bold text-black dark:text-white">
              Welcome to the Dashboard
            </h1>
            <p className="mt-3 text-red-600 dark:text-red-500 font-medium">
              SH AI Assistance!
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/prompts/system-prompts" className="btn-primary">
                Manage Prompts
              </Link>
              <Link href="/chat" className="btn-primary">
                Open Chat
              </Link>
              <Link href="/knowledge-base" className="btn-primary">
                Access Personal Datebase
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
