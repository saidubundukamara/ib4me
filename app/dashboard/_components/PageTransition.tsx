"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type PageTransitionProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  return (
    <div key={pathname} className={cn("flex w-full flex-col gap-6 animate-fade-in", className)}>
      {children}
    </div>
  );
}

export default PageTransition;


