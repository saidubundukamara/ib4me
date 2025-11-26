import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Get the host for cookie domain configuration
    const host = request.headers.get('host') || '';

    // Build cookie options - domain is only set for production
    // Browsers don't support domain='localhost' for subdomain cookies
    const cookieOptions: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'lax';
      path: string;
      maxAge: number;
      domain?: string;
    } = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Expire immediately
    };

    // Only set domain for production (real domains support subdomain cookies)
    if (!host.includes('localhost')) {
      const rootDomain = process.env.ROOT_DOMAIN || 'ib4me.com';
      cookieOptions.domain = `.${rootDomain}`;
    }

    // Clear the admin token cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_token', '', cookieOptions);

    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
