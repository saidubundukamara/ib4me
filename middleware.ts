import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Public admin routes that don't require authentication
const publicAdminRoutes = [
  // Old admin routes (for fallback)
  "/admin/login", "/admin/forgot-password",
  // New subdomain routes
  "/login", "/forgot-password", "/s/admin/login", "/s/admin/forgot-password",
  // API routes
  "/api/admin/auth/login", "/api/admin/auth/verify",
  "/api/admin/settings" // GET is public for site name fetching
];

// Helper function to check if user has admin token
function hasAdminToken(req: NextRequest): boolean {
  const adminToken = req.cookies.get('admin_token')?.value;
  return Boolean(adminToken);
}

// Helper function to extract subdomain from request
function extractSubdomain(req: NextRequest): string | null {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get("host") || url.hostname;
  
  // Handle localhost development
  if (hostname.includes("localhost")) {
    const parts = hostname.split(".");
    return parts.length > 1 && parts[0] !== "localhost" ? parts[0] : null;
  }
  
  // Get root domain from environment or default
  const rootDomain = process.env.ROOT_DOMAIN || process.env.VERCEL_URL || "ib4me.com";
  
  // Extract subdomain from hostname
  if (hostname.includes(rootDomain)) {
    const subdomain = hostname.replace(`.${rootDomain}`, "");
    return subdomain !== rootDomain ? subdomain : null;
  }
  
  // Handle Vercel preview deployments
  if (hostname.includes(".vercel.app")) {
    const parts = hostname.split(".");
    if (parts.length > 3) {
      return parts[0];
    }
  }
  
  return null;
}

// Main middleware function
export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const subdomain = extractSubdomain(req);
  
  // Handle admin subdomain routing
  if (subdomain === "admin") {
    // Block access to /admin routes on admin subdomain (they should be rewritten)
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    
    // Rewrite root path and other paths to admin routes
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/s/admin", req.url));
    } else if (!pathname.startsWith("/api/admin") && !pathname.startsWith("/s/admin")) {
      return NextResponse.rewrite(new URL(`/s/admin${pathname}`, req.url));
    }
  }
  
  // Block access to admin routes from main domain (redirect to admin subdomain)
  if (!subdomain && (pathname.startsWith("/admin") || pathname.startsWith("/s/admin"))) {
    const adminUrl = new URL(req.url);
    adminUrl.hostname = `admin.${adminUrl.hostname}`;
    if (pathname.startsWith("/s/admin")) {
      adminUrl.pathname = pathname.replace("/s/admin", "");
    } else {
      adminUrl.pathname = pathname.replace("/admin", "");
    }
    if (adminUrl.pathname === "") adminUrl.pathname = "/";
    return NextResponse.redirect(adminUrl);
  }
  
  // Handle admin routes (now only accessible via /s/admin from admin subdomain)
  if (pathname.startsWith("/s/admin") || pathname.startsWith("/api/admin")) {
    // Ensure /s/admin routes are only accessible from admin subdomain
    if (pathname.startsWith("/s/admin") && subdomain !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    
    const routePath = pathname.startsWith("/s/admin") ? pathname.replace("/s/admin", "/admin") : pathname;
    
    // Allow public admin routes
    if (publicAdminRoutes.includes(routePath)) {
      return NextResponse.next();
    }
    
    // Check for admin authentication
    if (!hasAdminToken(req)) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // Redirect to login on admin subdomain
      if (subdomain === "admin") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    
    return NextResponse.next();
  }

  // Auth pages that should redirect authenticated users to dashboard
  const authPagesToRedirect = ["/auth/signin", "/auth/register"];

  // Handle auth pages - redirect authenticated users away
  if (authPagesToRedirect.some(page => pathname === page || pathname.startsWith(page + "/"))) {
    try {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token"
      });

      // If user has a valid, active token, redirect them to dashboard
      if (token && token.status === "active") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    } catch (error) {
      console.error("Auth page middleware token check failed:", error);
      // On error, allow access to auth page (fail open)
    }
  }

  // Handle user/dashboard routes with NextAuth session checking
  if (pathname.startsWith("/user") || pathname.startsWith("/dashboard")) {
    try {
      const token = await getToken({ 
        req, 
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token"
      });
      
      // If no token or user is not active, redirect to signin
      if (!token || token.status !== "active") {
        return NextResponse.redirect(new URL("/auth/signin", req.url));
      }
      
      return NextResponse.next();
    } catch (error) {
      console.error("NextAuth token verification failed:", error);
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Admin routes (both old and new)
    "/admin/:path*",
    "/s/admin/:path*",
    "/api/admin/:path*",
    // User routes
    "/user/:path*",
    "/dashboard/:path*",
    // Root paths for subdomain handling
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
