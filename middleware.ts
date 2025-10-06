import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Public admin routes that don't require authentication
const publicAdminRoutes = ["/admin/login", "/admin/forgot-password", "/api/admin/auth/login", "/api/admin/auth/verify"];

// Helper function to check if user has admin token
function hasAdminToken(req: NextRequest): boolean {
  const adminToken = req.cookies.get('admin_token')?.value;
  return Boolean(adminToken);
}

// Main middleware function
export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
  // Handle admin routes separately
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    // Allow public admin routes
    if (publicAdminRoutes.includes(pathname)) {
      return NextResponse.next();
    }
    
    // Check for admin authentication
    if (!hasAdminToken(req)) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    
    return NextResponse.next();
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
    "/admin/:path*",
    "/api/admin/:path*",
    "/user/:path*",
    "/dashboard/:path*",
  ],
};
