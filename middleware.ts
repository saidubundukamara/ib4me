import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";

const protectedPrefixes = ["/dashboard", "/admin", "/api/admin", "/user"];

export default withAuth(
  function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    const token = (req as any).nextauth?.token as {
      roles?: string[];
      status?: string;
    } | null;
    if (!protectedPrefixes.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }
    if (token?.status && token.status !== "active") {
      return NextResponse.json({ error: "Account disabled" }, { status: 403 });
    }
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      const roles = token?.roles ?? [];
      if (!(roles.includes("admin") || roles.includes("superadmin"))) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const url = new URL("/auth/signin", req.url);
        url.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = (req as NextRequest).nextUrl.pathname;
        if (!protectedPrefixes.some((p) => pathname.startsWith(p))) return true;
        return Boolean(token);
      },
    },
    pages: { signIn: "/auth/signin" },
    secret: process.env.NEXTAUTH_SECRET,
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/user/:path*",
  ],
};
