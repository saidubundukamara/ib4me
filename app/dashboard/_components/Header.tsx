"use client";

import React from "react";
import Image from "next/image";
import { logout } from "@/lib/authClient";

export function Header() {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const target = e.target as Node | null;
      if (menuRef.current && target && !menuRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <header className="sticky top-0 z-20 border-b bg-white">
      <div className="flex items-center gap-3 px-6 h-14">
        <div className="relative flex-1">
          <input
            className="w-full rounded-xl border border-gray-200 bg-white px-10 py-2 text-sm outline-none focus:ring-2 ring-indigo-300 placeholder:text-gray-500"
            placeholder="Search campaigns, donations..."
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
        </div>
        <button className="relative p-2 rounded-lg hover:bg-gray-50 transition">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 6-3 8h18c0-2-3  -1-3-8z"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span className="absolute -right-0 -top-0 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] text-white">3</span>
        </button>
        <div className="flex items-center gap-3 relative" ref={menuRef}>
          <div className="hidden sm:flex flex-col leading-4">
            <span className="text-sm font-medium text-slate-900">Your Account</span>
            <span className="text-xs text-slate-600">Fundraiser</span>
          </div>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="h-9 w-9 rounded-full overflow-hidden bg-gray-200 ring-1 ring-transparent focus:ring-indigo-300 focus:outline-none"
          >
            <Image alt="avatar" src="/vercel.svg" width={36} height={36} />
          </button>
          {open && (
            <div
              role="menu"
              className="absolute right-0 top-12 w-44 rounded-xl border bg-white shadow-lg text-sm overflow-hidden"
            >
              <a
                href="/dashboard"
                role="menuitem"
                className="block px-3 py-2 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                Profile
              </a>
              <a
                href="/dashboard/settings"
                role="menuitem"
                className="block px-3 py-2 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                Settings
              </a>
              <button
                role="menuitem"
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-rose-600"
                onClick={async () => {
                  setOpen(false);
                  await logout({ redirectTo: "/auth/signin" });
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;


