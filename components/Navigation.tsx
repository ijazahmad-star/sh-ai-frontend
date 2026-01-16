"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import lightLogo from "../public/SH-Logos.png";
import darkLogo from "../public/SH-Logos-1.png";
import { usePathname } from "next/navigation";

import { Menu, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

function UserMenu({ user, onSignOut }: { user: any; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative ml-2">
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-2 text-white hover:opacity-90 rounded px-1 py-1"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "User"}
            className="w-7 h-7 lg:w-8 lg:h-8 rounded-full border border-white/20"
          />
        ) : (
          <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-primary-500 flex items-center justify-center">
            <span className="text-xs font-semibold">
              {user.name?.charAt(0) || "U"}
            </span>
          </div>
        )}
        {/* <div className="hidden lg:block text-left">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-gray-300">({user.role})</p>
        </div> */}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded shadow-lg py-2 z-50">
          <div className="px-4 py-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-300">
              {user.role}
            </p>
          </div>
          <div className="border-t border-gray-100 dark:border-zinc-800" />
          <button
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

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
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const doSignOut = async () => {
    setShowSignOutModal(false);
    localStorage.removeItem("lastConversationId");
    await signOut({ callbackUrl: "/" });
  };
  const Links = [
    { href: "/dashboard", label: "Dashboard", visible: true },
    { href: "/chat", label: "AI Chat", visible: true },
    { href: "/prompts/system-prompts", label: "System Prompts", visible: true },
    { href: "/prompts/generator", label: "Prompt Generator", visible: true },
    {
      href: "/admin/users",
      label: "Manage Users",
      visible: session?.user.role === "admin",
    },
    {
      href: "/admin/feedback-analytics",
      label: "Feedback Analytics",
      visible: session?.user.role === "admin",
    },
    { href: "/knowledge-base", label: "Personal Database", visible: true },
  ];
  return (
    <div className="w-full border-b border-gray-200 dark:border-zinc-800 bg-nav-background">
      <header className="flex items-center justify-between px-4 py-3 sm:py-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Image
            src={darkLogo}
            alt="SH Logo (dark)"
            className="rounded-full"
            width={128}
            height={50}
            priority
          />
        </div>

        {/* Desktop Navigation - Centered */}
        <div className="hidden md:flex items-center justify-center flex-1">
          <nav className="flex items-center gap-6">
            {Links.map(
              (link, idx) =>
                link.visible && (
                  <Link
                    key={idx}
                    href={link.href}
                    className={`${
                      pathname === link.href
                        ? "text-white font-semibold"
                        : "text-white hover:text-gray-300"
                    } text-sm lg:text-base transition-colors px-3 py-2 relative`}
                  >
                    {link.label}
                    {pathname === link.href && (
                      <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary-500 rounded-full"></span>
                    )}
                  </Link>
                )
            )}
          </nav>
        </div>

        {/* User Menu - Right Side */}
        <div className="hidden md:flex">
          {session?.user && (
            <UserMenu
              user={session.user}
              onSignOut={() => {
                setShowSignOutModal(true);
              }}
            />
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => handleMenu(!isMenuOpen)}
          className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {isMenuOpen && (
          <div
            className="fixed inset-0 backdrop-blur-sm bg-black/50 md:hidden z-40"
            onClick={closeMenu}
          />
        )}

        <div
          className={`fixed top-0 right-0 h-full w-full max-w-xs md:hidden transform ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          } transition-transform duration-300 ease-in-out z-50 bg-nav-background shadow-xl`}
        >
          <div className="flex flex-col h-full p-5">
            {/* Mobile Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Image
                  src={darkLogo}
                  alt="SH Logo (dark)"
                  className="rounded-full"
                  width={36}
                  height={36}
                />

                <span className="text-sm font-semibold text-white">
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
                    setShowSignOutModal(true);
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

        {/* Sign out confirmation modal */}
        {showSignOutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowSignOutModal(false)}
            />
            <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirm sign out
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Are you sure you want to sign out? You will need to sign in
                again to access your account.
              </p>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowSignOutModal(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 rounded-md text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={doSignOut}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
