"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { logout } from "@/lib/authClient";

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (status !== "authenticated") {
    return (
      <Link
        href="/auth/signin"
        className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Log in
      </Link>
    );
  }

  const avatarUrl = session?.user?.image ?? null;
  const name = session?.user?.name ?? "User";
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-9 overflow-hidden rounded-full border bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
        aria-label="User menu"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-700">
            {initial}
          </span>
        )}
      </button>
      {open && (
        <div
          role="menu"
          aria-label="User menu"
          className="absolute right-0 mt-2 w-44 rounded-md border bg-white p-1 shadow-lg"
        >
          <Link
            href="/dashboard"
            role="menuitem"
            className="block rounded-sm px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/settings"
            role="menuitem"
            className="block rounded-sm px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            className="block w-full rounded-sm px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => {
              setOpen(false);
              logout({ redirectTo: "/" });
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}


