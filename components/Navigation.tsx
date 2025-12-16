"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import logopic from "../public/SH-logo.png";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div
      className="w-full border-b border-gray-200 dark:border-zinc-800"
      style={{ backgroundColor: "rgb(11, 0, 44)" }}
    >
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Image
            src={logopic}
            alt="Logo"
            className="rounded-full"
            width={50}
            height={50}
          />
          <span className="text-2xl font-bold text-white">
            <span className="text-red-600">SH</span> AI Assistant
          </span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/dashboard" className={pathname === "/dashboard" ? "text-yellow-500 font-bold" : "text-white"}>
            Dashboard
          </Link>

          {session?.user?.role === "admin" && (
            <Link href="/admin/users" className={pathname === "/admin/users" ? "text-yellow-500 font-bold" : "text-white"}>
              Manage Users
            </Link>
          )}

          <Link
            href="/prompts/system-prompts"
            className={pathname === "/prompts/system-prompts" ? "text-yellow-500 font-bold" : "text-white"}
          >
            System Prompts
          </Link>

          <Link href="/knowledge-base" className={pathname === "/knowledge-base" ? "text-yellow-500 font-bold" : "text-white"}>
            Knowledge Base
          </Link>

          <Link href="/chat" className={pathname === "/chat" ? "text-yellow-500 font-bold" : "text-white hovor"}>
            AI Chat
          </Link>

          {session?.user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white">
                <span className="text-sm">
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
                className="text-sm text-white hover:text-red-600"
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
