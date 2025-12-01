# IB4ME Security Analysis & Fixes

**Date**: December 1, 2025
**Codebase**: IB4ME Medical Emergency Crowdfunding Platform
**Stack**: Next.js 15, MongoDB, NextAuth.js, Monime Payments

---

## Executive Summary

This security analysis identified **15+ vulnerabilities** across authentication, input validation, and payment processing. The most critical issues involve **bypassed webhook verification** (allowing fake payment completion), **NoSQL injection** in search queries, and **missing password strength validation**.

---

## 🔴 CRITICAL Issues

### 1. Webhook Signature Verification Bypassed

**Location**: `lib/monime.ts:476-482`

**Current Code**:
```typescript
verifyWebhookSignature(): boolean {
  console.warn("Webhook signature verification not implemented...");
  return true; // Always returns true!
}
```

**Risk**: Attackers can craft fake webhook payloads to mark donations as complete without actual payment.

**Fix**:
```typescript
verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.MONIME_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("MONIME_WEBHOOK_SECRET is required");
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

**Also Update**: `app/api/donations/webhook/route.ts:26-42` to actually verify:
```typescript
const rawBody = await request.text();
const signature = request.headers.get("x-monime-signature");

if (!signature || !monimeService.verifyWebhookSignature(rawBody, signature)) {
  return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
}

const payload = JSON.parse(rawBody);
```

**Environment Variable Required**: Add `MONIME_WEBHOOK_SECRET` to `.env`

---

### 2. NoSQL Regex Injection

**Locations**:
- `services/CampaignService.ts:138-142`
- `repositories/UserRepository.ts:84-87`

**Current Code**:
```typescript
if (filters.search) {
  query.$or = [
    { "patient.name": { $regex: filters.search, $options: "i" } },
    // User input directly in regex!
  ];
}
```

**Risk**: Malicious regex patterns like `.*` or `(?=a]){10}` can cause ReDoS or bypass filters.

**Fix** - Escape regex special characters:
```typescript
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

if (filters.search) {
  const safeSearch = escapeRegex(filters.search);
  query.$or = [
    { "patient.name": { $regex: safeSearch, $options: "i" } },
    { diagnosis: { $regex: safeSearch, $options: "i" } },
    { slug: { $regex: safeSearch, $options: "i" } }
  ];
}
```

**Alternative**: Use MongoDB text search index instead of regex.

---

### 3. No Password Strength Validation

**Location**: `app/api/auth/register/route.ts:29`

**Current Code**:
```typescript
if (!name || !(email || phone) || !password) {
  // Only checks existence, not strength
}
```

**Risk**: Users can set passwords like "1" or "password".

**Fix** - Add password validation:
```typescript
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }
  if (!PASSWORD_REGEX.test(password)) {
    return { valid: false, error: "Password must contain uppercase, lowercase, and number" };
  }
  return { valid: true };
}

// In registration route:
const passwordCheck = validatePassword(password);
if (!passwordCheck.valid) {
  return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
}
```

---

## 🟠 HIGH Priority Issues

### 4. Sensitive Data Logging

**Locations**:
- `app/api/donations/webhook/route.ts:322,521` - Full webhook payloads logged
- `app/api/auth/request-reset/route.ts:39` - Auth codes logged
- `app/api/auth/request-verify/route.ts:39` - Auth codes logged
- `lib/monime.ts:337-348` - Full API error responses logged

**Risk**: Sensitive payment data, personal info, and auth codes in logs.

**Fix**: Remove or redact sensitive logging:
```typescript
// Instead of logging full payload:
console.log("Webhook received:", { eventType: payload.type, eventId: payload.id });

// Remove auth code logging entirely:
// console.log("Generated code:", code); // DELETE THIS

// Redact error responses:
console.error("Monime API error:", { status: response.status, endpoint });
```

---

### 5. No Rate Limiting on Auth Endpoints

**Locations**: All routes in `app/api/auth/*`

**Risk**: Brute force attacks, credential stuffing, SMS/email spam.

**Fix** - Create rate limiting middleware:
```typescript
// lib/rate-limit.ts
import { LRUCache } from 'lru-cache';

const rateLimit = new LRUCache({
  max: 500,
  ttl: 60 * 1000, // 1 minute
});

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const tokenCount = (rateLimit.get(key) as number) || 0;

  if (tokenCount >= limit) {
    return { allowed: false, remaining: 0 };
  }

  rateLimit.set(key, tokenCount + 1, { ttl: windowMs });
  return { allowed: true, remaining: limit - tokenCount - 1 };
}

// Usage in auth routes:
const ip = request.headers.get('x-forwarded-for') || 'unknown';
const rateLimitResult = checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000);

if (!rateLimitResult.allowed) {
  return NextResponse.json(
    { error: "Too many attempts. Try again later." },
    { status: 429 }
  );
}
```

**Recommended Limits**:
- Login: 5 attempts per 15 minutes per IP
- Password reset: 3 per hour per email
- Registration: 5 per hour per IP
- OTP request: 3 per 10 minutes per phone/email

---

### 6. IDOR on Donation Status Endpoint

**Location**: `app/api/donations/[id]/status/route.ts`

**Risk**: Anyone can query any donation's status if they know/guess the ID.

**Fix** - Add ownership verification:
```typescript
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const donationId = params.id;

  const donation = await donationService.findById(donationId);

  if (!donation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Allow access if: user owns the donation, or it's their campaign, or they're admin
  const isOwner = donation.donorSnapshot?.email === session?.user?.email;
  const isCampaignOwner = donation.campaign.userId?.toString() === session?.user?.id;
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'superadmin';

  if (!isOwner && !isCampaignOwner && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Continue with response...
}
```

---

## 🟡 MEDIUM Priority Issues

### 7. In-Memory Webhook Deduplication

**Location**: `app/api/donations/webhook/route.ts:11-12`

**Current Code**:
```typescript
const processedWebhooks = new Set<string>();
```

**Risk**: Webhook replay attacks after server restart or across multiple instances.

**Fix** - Use MongoDB for deduplication:
```typescript
// models/ProcessedWebhook.ts
const ProcessedWebhookSchema = new Schema({
  eventId: { type: String, required: true, unique: true },
  processedAt: { type: Date, default: Date.now, expires: 86400 } // TTL: 24 hours
});

// In webhook route:
const existing = await ProcessedWebhook.findOne({ eventId: payload.id });
if (existing) {
  return NextResponse.json({ received: true, duplicate: true });
}

await ProcessedWebhook.create({ eventId: payload.id });
```

---

### 8. No Session Revocation on Password Change

**Location**: `app/api/auth/change-password/route.ts`

**Risk**: After password change, old sessions remain valid.

**Fix** - Add session version tracking:
```typescript
// In User model, add:
sessionVersion: { type: Number, default: 0 }

// In change-password route, after successful change:
await User.findByIdAndUpdate(userId, {
  $inc: { sessionVersion: 1 },
  passwordChangedAt: new Date()
});

// In NextAuth callbacks, validate session version:
async jwt({ token, user }) {
  if (user) {
    token.sessionVersion = user.sessionVersion;
  }
  return token;
}

async session({ session, token }) {
  const currentUser = await User.findById(token.sub);
  if (currentUser.sessionVersion !== token.sessionVersion) {
    throw new Error("Session invalidated");
  }
  return session;
}
```

---

### 9. Sort Field Not Whitelisted

**Location**: `services/CampaignService.ts:147`

**Current Code**:
```typescript
sort[sortBy] = sortOrder === "asc" ? 1 : -1;
```

**Risk**: Could allow sorting by sensitive fields.

**Fix**:
```typescript
const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'goal', 'status', 'patient.name'];

if (sortBy && !ALLOWED_SORT_FIELDS.includes(sortBy)) {
  sortBy = 'createdAt'; // Default fallback
}
sort[sortBy] = sortOrder === "asc" ? 1 : -1;
```

---

### 10. User Content Not Sanitized

**Location**: `app/api/campaigns/route.ts:141,182`

**Risk**: Stored XSS via story/diagnosis fields.

**Fix** - Add sanitization:
```typescript
import DOMPurify from 'isomorphic-dompurify';

const story = DOMPurify.sanitize(form.get("story") as string || "");
const diagnosis = DOMPurify.sanitize(form.get("diagnosis") as string || "");
```

**Install**: `npm install isomorphic-dompurify`

---

### 11. File Upload MIME Type Not Strictly Validated

**Location**: `app/api/campaigns/route.ts:200,226`

**Current Code**: Uses `resource_type: "auto"` for Cloudinary.

**Fix** - Whitelist allowed MIME types:
```typescript
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

// Before upload:
if (!validateFileType(file, ALLOWED_IMAGE_TYPES)) {
  throw new Error("Invalid file type");
}
```

---

### 12. Missing HTTPS Redirect in Production

**Location**: `middleware.ts`

**Fix** - Force HTTPS:
```typescript
// At the start of middleware:
if (process.env.NODE_ENV === 'production') {
  const proto = request.headers.get('x-forwarded-proto');
  if (proto !== 'https') {
    const httpsUrl = new URL(request.url);
    httpsUrl.protocol = 'https:';
    return NextResponse.redirect(httpsUrl);
  }
}
```

---

## ✅ Existing Good Practices

These security measures are already properly implemented:

| Practice | Location | Status |
|----------|----------|--------|
| Bcrypt password hashing (10 rounds) | `app/api/auth/register/route.ts:58` | ✅ Good |
| JWT session strategy | `app/api/auth/[...nextauth]/route.ts:11` | ✅ Good |
| HttpOnly secure admin cookies | `app/api/admin/auth/login/route.ts:64-75` | ✅ Good |
| Route protection middleware | `middleware.ts` | ✅ Good |
| ObjectId validation | Multiple routes | ✅ Good |
| Zod schema validation | `app/api/donations/create/route.ts:6-18` | ✅ Good |
| Idempotency keys for transactions | `DonationService.ts` | ✅ Good |
| Brute force protection (5 attempts) | `[...nextauth]/route.ts:48-52` | ✅ Good |
| One-time use auth codes | `AuthCodeService.ts` | ✅ Good |
| User enumeration prevention | `request-reset/route.ts:23` | ✅ Good |

---

## Implementation Priority

### Phase 1: Critical (Do Immediately)
1. Webhook signature verification
2. NoSQL regex escaping
3. Password strength validation

### Phase 2: High (This Week)
4. Remove sensitive logging
5. Rate limiting on auth
6. IDOR protection on donations

### Phase 3: Medium (This Month)
7. Persistent webhook deduplication
8. Session revocation on password change
9. Sort field whitelist
10. Content sanitization
11. Strict file type validation
12. HTTPS redirect

---

## Environment Variables to Add

```env
# Webhook Security
MONIME_WEBHOOK_SECRET=your_webhook_secret_here
```

---

## Dependencies to Install

```bash
npm install isomorphic-dompurify lru-cache
npm install -D @types/dompurify
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `lib/monime.ts` | Implement webhook signature verification |
| `app/api/donations/webhook/route.ts` | Verify signature, remove sensitive logs, use DB deduplication |
| `services/CampaignService.ts` | Escape regex input, whitelist sort fields |
| `repositories/UserRepository.ts` | Escape regex input |
| `app/api/auth/register/route.ts` | Add password validation |
| `app/api/auth/request-reset/route.ts` | Remove debug logging |
| `app/api/auth/request-verify/route.ts` | Remove debug logging |
| `app/api/donations/[id]/status/route.ts` | Add IDOR protection |
| `app/api/campaigns/route.ts` | Sanitize user content, validate file types |
| `middleware.ts` | Add HTTPS redirect |
| `lib/rate-limit.ts` | Create new rate limiting utility |
| `models/ProcessedWebhook.ts` | Create new model for webhook deduplication |
