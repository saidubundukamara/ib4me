"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

import { Card } from "@/components/ui/card";

import logo from "@/public/assets/ib4melogo.png";

type AuthLayoutProps = {
  title: string;
  subtitle?: string;
  highlight?: ReactNode;
  lead?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  aside?: ReactNode;
};

export function AuthLayout({
  title,
  subtitle,
  highlight,
  lead,
  children,
  footer,
  aside,
}: AuthLayoutProps) {
  const hasAside = Boolean(aside);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-gradient-to-br from-background via-background/90 to-primary/10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-12 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col">
        {/* Logo header — acts as home link */}
        <div className="px-4 pt-6 sm:px-8 sm:pt-8">
          <Link href="/" aria-label="Go to homepage">
            <Image src={logo} alt="ib4me" className="h-9 w-auto object-contain" priority />
          </Link>
        </div>

        <div className="flex flex-1 px-4 pb-10 sm:px-8 sm:pb-14 sm:pt-5">
          <Card className="flex w-full flex-1 overflow-hidden rounded-3xl border border-border/40 bg-card/95 shadow-2xl backdrop-blur">
            <div className="grid h-full w-full gap-8 md:grid-cols-5">
              {hasAside ? (
                <div className="relative hidden overflow-hidden bg-primary md:col-span-2 md:flex md:flex-col md:justify-between">
                  <div className="absolute inset-0 bg-white/10 mix-blend-soft-light" />
                  <div className="relative flex flex-1 flex-col justify-between p-10 text-primary-foreground">
                    {aside}
                  </div>
                </div>
              ) : null}

              <div className={hasAside ? "md:col-span-3" : "md:col-span-5"}>
                <div className="flex h-full flex-col justify-center p-6 sm:p-10">
                  <div className="mb-8 text-center md:text-left">
                    <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h2>
                    {subtitle ? <p className="mt-2 text-sm text-muted-foreground md:text-base">{subtitle}</p> : null}
                    {highlight ? <div className="mt-2">{highlight}</div> : null}
                  </div>

                  <div className="flex flex-1 flex-col justify-center gap-6">
                    {lead}
                    <div>{children}</div>
                  </div>

                  {footer ? (
                    <div className="mt-6 text-center text-sm text-muted-foreground md:text-left">{footer}</div>
                  ) : null}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
