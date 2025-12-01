import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";
import { NextResponse } from "next/server";

/**
 * Rate limiter for general authentication endpoints
 * 5 requests per 15 minutes per identifier
 */
export const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
  prefix: "ratelimit:auth",
});

/**
 * Rate limiter for OTP/verification code requests
 * 3 requests per 10 minutes per identifier
 * More restrictive to prevent SMS/email spam
 */
export const otpRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "10 m"),
  analytics: true,
  prefix: "ratelimit:otp",
});

/**
 * Rate limiter for registration endpoint
 * 5 registrations per hour per IP
 * Prevents mass account creation
 */
export const registrationRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
  prefix: "ratelimit:register",
});

/**
 * Helper to get client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

/**
 * Helper to create a rate limit error response
 */
export function rateLimitResponse(remaining: number, resetTime?: number) {
  const headers: Record<string, string> = {
    "X-RateLimit-Remaining": remaining.toString(),
  };
  if (resetTime) {
    headers["X-RateLimit-Reset"] = resetTime.toString();
  }

  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers }
  );
}

/**
 * Check rate limit and return response if exceeded
 * Returns null if within limits, or a NextResponse if rate limited
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<NextResponse | null> {
  const { success, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    return rateLimitResponse(remaining, reset);
  }

  return null;
}
