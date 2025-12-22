"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import logopic from "../public/SH-logo.png";
import { usePathname } from "next/navigation";

import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenu = (check: boolean) => {
    setIsMenuOpen(check);
  };
  const closeMenu = () => {
    setIsMenuOpen(false);
  };
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };
  const Links = [
    { href: "/dashboard", label: "Dashboard", visible: true },
    {
      href: "/admin/users",
      label: "Manage Users",
      visible: session?.user.role === "admin",
    },
    { href: "/prompts/system-prompts", label: "System Prompts", visible: true },
    { href: "/chat", label: "AI Chat", visible: true },
    { href: "/knowledge-base", label: "Personal Database", visible: true },
  ];
  return (
    <div className="w-full border-b border-gray-200 dark:border-zinc-800 bg-nav-background">
      <header className="flex items-center justify-between px-4 py-3 sm:py-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Image
            src={logopic}
            alt="Logo"
            className="rounded-full"
            width={40}
            height={40}
            priority
          />
          <span className="text-xl sm:text-2xl font-bold text-white">
            <span className="text-primary-500">SH</span> AI Assistant
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden sm:grid grid-flow-col auto-cols-max items-center gap-4">
          {Links.map(
            (link, idx) =>
              link.visible && (
                <Link
                  key={idx}
                  href={link.href}
                  className={`${
                    pathname === link.href
                      ? "text-yellow-500 font-semibold"
                      : "text-white hover:text-yellow-400"
                  } text-sm lg:text-base transition-colors px-1 py-2`}
                >
                  {link.label}
                </Link>
              )
          )}

          {session?.user && (
            <div className="flex items-center gap-3 lg:gap-4 ml-2">
              <div className="flex items-center gap-2 text-white">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-7 h-7 lg:w-8 lg:h-8 rounded-full border border-white/20"
                  />
                ) : (
                  <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-primary-500 flex items-center justify-center">
                    <span className="text-xs font-semibold">
                      {session.user.name?.charAt(0) || "U"}
                    </span>
                  </div>
                )}
                <div className="hidden lg:block">
                  <p className="text-sm font-medium">{session.user.name}</p>
                  <p className="text-xs text-gray-300">({session.user.role})</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="py-2 px-2 bg-primary-500 hover:bg-red-400 hover:cursor-pointer text-white font-sm rounded-lg flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => handleMenu(!isMenuOpen)}
          className="sm:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {isMenuOpen && (
          <div
            className="fixed inset-0 backdrop-blur-sm bg-black/50 sm:hidden z-40"
            onClick={closeMenu}
          />
        )}

        <div
          className={`fixed top-0 right-0 h-full w-full max-w-xs sm:hidden transform ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          } transition-transform duration-300 ease-in-out z-50 bg-nav-background shadow-xl`}
        >
          <div className="flex flex-col h-full p-5">
            {/* Mobile Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Image
                  src={logopic}
                  alt="Logo"
                  className="rounded-full"
                  width={36}
                  height={36}
                />
                <span className="text-lg font-bold text-white">
                  <span className="text-primary-500">SH</span> AI
                </span>
              </div>
              <button
                onClick={closeMenu}
                className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex flex-col flex-1 gap-1">
              {Links.map(
                (link, idx) =>
                  link.visible && (
                    <Link
                      key={idx}
                      href={link.href}
                      onClick={closeMenu}
                      className={`${
                        pathname === link.href
                          ? "bg-white/10 text-yellow-500 font-semibold"
                          : "text-white hover:bg-white/10"
                      } rounded-lg px-4 py-3 text-base transition-colors`}
                    >
                      {link.label}
                    </Link>
                  )
              )}
            </nav>

            {session?.user && (
              <div className="mt-auto pt-6 border-t border-white/10">
                <div className="flex items-center gap-3 mb-4 px-2">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="w-10 h-10 rounded-full border-2 border-primary-500"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
                      <span className="text-sm font-bold">
                        {session.user.name?.charAt(0) || "U"}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                      {session.user.name}
                    </p>
                    <p className="text-gray-300 text-xs">{session.user.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    closeMenu();
                    handleSignOut();
                  }}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
