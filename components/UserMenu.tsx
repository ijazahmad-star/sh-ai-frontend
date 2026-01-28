"use-client";

import { Button } from "./ui/button";
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
      <Button
        onClick={() => setOpen((s) => !s)}
        variant="default"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {user.image ? (
          <img src={user.image} alt={user.name || "User"} />
        ) : (
          <div>
            <span className="text-xs font-semibold">
              {user.name?.charAt(0) || "U"}
            </span>
          </div>
        )}
        {/* <div className="hidden lg:block text-left">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-gray-300">({user.role})</p>
        </div> */}
      </Button>

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
          <Button
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            variant="signout"
          >
            Sign out
          </Button>
        </div>
      )}
    </div>
  );
}
export default UserMenu;