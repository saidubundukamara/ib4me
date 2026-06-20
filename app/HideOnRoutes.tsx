"use client";
import React from "react";
import { usePathname } from "next/navigation";

interface HideOnRoutesProps {
  hidePrefixes: string[];
  children: React.ReactNode;
}

export default function HideOnRoutes({ hidePrefixes, children }: HideOnRoutesProps) {
  const pathname = usePathname() || "/";

  const shouldHide = hidePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (shouldHide) return null;
  return <>{children}</>;
}
