"use client";

import Image from "next/image";
import lightLogo from "../public/SH-Logos.png";
import darkLogo from "../public/SH-Logos-1.png";

export default function Footer() {
  return (
    <>
      {/* spacer only visible on md+ so fixed footer doesn't overlap content */}
      <div className="hidden md:block h-20" aria-hidden />

      <footer className="w-full border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 md:fixed md:bottom-0 md:left-0 md:w-full md:h-20">
        <div className="container mx-auto px-4 py-6 md:py-0 md:h-full flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <>
              <Image
                src={lightLogo}
                alt="SH Logo"
                width={90}
                height={56}
                className="rounded block dark:hidden"
              />
              <Image
                src={darkLogo}
                alt="SH Logo (dark)"
                width={90}
                height={56}
                className="rounded hidden dark:block"
              />
            </>
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
                SH AI Assistant
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Secure • Smart • Intelligent
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 text-center md:text-right">
            © {new Date().getFullYear()} SH AI Assistant. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
