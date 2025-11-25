"use client";
import React from "react";
import { usePathname } from "next/navigation";

interface HideOnRoutesProps {
  hidePrefixes: string[];
  children: React.ReactNode;
}

export default function HideOnRoutes({ hidePrefixes, children }: HideOnRoutesProps) {
  const pathname = usePathname() || "/";
  
  // Check if we're on admin subdomain (for admin routes handled by middleware)
  const isAdminSubdomain = typeof window !== "undefined" && 
    window.location.hostname.startsWith("admin.");
    
  // Admin routes that get rewritten by middleware (add these to hide list)
  const adminRoutePaths = ["/login", "/forgot-password"];
  const isAdminRoute = isAdminSubdomain && adminRoutePaths.includes(pathname);
  
  // Check normal path prefixes
  const shouldHideByPath = hidePrefixes.some((prefix) => 
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  
  // Hide if matches path prefixes OR is an admin route on admin subdomain
  const shouldHide = shouldHideByPath || isAdminRoute;
  
  if (shouldHide) return null;
  return <>{children}</>;
}
