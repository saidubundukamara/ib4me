"use client"

import {
    LogOutIcon,
    Settings,
    Heart,
} from "lucide-react"
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { logout } from "@/lib/authClient";

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"

const UserMenu = () => {

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
                className="inline-flex items-center font-pt-serif rounded-md border px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-gray-50"
            >
                Log in
            </Link>
        );
    }

    const avatarUrl = session?.user?.image ?? null;
    const name = session?.user?.name ?? "User";
    const initial = name.trim().charAt(0).toUpperCase();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="icon" variant="outline" aria-label="Open account menu">
                    {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                    ) : (
                        <span className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-700">
                            {initial}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-w-64">
                <DropdownMenuLabel className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden">
                        {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                        ) : (
                            <span className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-700 bg-gray-100">
                                {initial}
                            </span>
                        )}
                    </div>
                    <div className="flex min-w-0 flex-col">
                        <span className="text-sm font-medium">
                            {name}
                        </span>
                        <span className="text-muted-foreground truncate text-xs font-normal">
                            {session?.user?.email || "User Account"}
                        </span>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem>
                        <Heart size={16} className="opacity-60" aria-hidden="true" />
                        <Link href='/dashboard'>
                            My Fundraisers
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Settings size={16} className="opacity-60" aria-hidden="true" />
                        <Link href='/dashboard/settings'>
                            Settings
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <LogOutIcon size={16} className="opacity-60" aria-hidden="true" />
                    <span onClick={() => {
                        setOpen(false);
                        logout({ redirectTo: "/" });
                    }}>Logout</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default UserMenu