import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public admin routes that don't require authentication
const publicAdminRoutes = ["/admin/login", "/admin/forgot-password", "/api/admin/auth/login", "/api/admin/auth/verify"];

// Helper function to check if user has admin token
function hasAdminToken(req: NextRequest): boolean {
  const adminToken = req.cookies.get('admin_token')?.value;
  return Boolean(adminToken);
}

// Main middleware function
export default function middleware(req: NextRequest) {
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
  
  // For user routes, we'll handle authentication in the layout components
  // This avoids the NextAuth middleware complexity that's causing the error
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
