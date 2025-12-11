"use client";

import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      setError("Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-4 bg-gradient-to-b from-white to-zinc-50 dark:from-black dark:to-zinc-900 font-sans">
      <div className="container">
        <header className="hero py-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-black dark:text-white">
            SH AI Assistant
          </h1>
          <p className="mt-3 text-base text-red-600 dark:text-red-500 max-w-2xl font-semibold">
            Secure. Smart. Intelligent.
          </p>
        </header>

        <main className="mt-8">
          <div className="card bg-white dark:bg-zinc-900 shadow-lg rounded-xl p-8 max-w-md mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-black dark:text-white text-center">
                Welcome Back
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                Sign in to continue
              </p>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                  placeholder="Your password"
                />
              </div>

              {error && (
                <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Contact your administrator for account creation
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
