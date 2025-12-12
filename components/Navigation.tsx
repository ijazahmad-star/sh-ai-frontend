"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";

export default function Navigation() {
  const { data: session } = useSession();
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };
  return (
    <div
      className="p-6 w-full border-b border-gray-200 dark:border-zinc-800"
      style={{ backgroundColor: "rgb(11, 0, 44)" }}
    >
      <header className="flex justify-between items-center">
        <div className="text-2xl font-bold text-white">
          <span className="text-red-600">SH</span> AI Assistant
        </div>
        <div className="flex gap-6 items-center">
          <Link href="/dashboard" className="text-white hover:underline">
            Dashboard
          </Link>

          {session?.user?.role === "admin" && (
            <Link
              href="/admin/users"
              className="text-white hover:underline"
            >
              Manage Users
            </Link>
          )}

          <Link
            href="/prompts/system-prompts"
            className="text-white hover:underline"
          >
            System Prompts
          </Link>
          <Link href="/knowledge-base" className="text-white hover:underline">
            Knowledge Base
          </Link>
          <Link href="/chat" className="text-white hover:underline">
            Chat
          </Link>

          {session?.user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center text-white gap-2 hover:underline">
                <span className="text-sm text-white">
                  {session.user.name} ({session.user.role})
                </span>
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-8 h-8 rounded-full"
                  />
                )}
              </div>
              <button
                onClick={handleSignOut}
                className=" text-sm text-white hover:bg-zinc-800 hover:text-red-600 "
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}
