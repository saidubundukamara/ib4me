# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: donors inside Sierra Leone.** They give small amounts — the presets are Le 50 / 250 / 500 — from a phone, on mobile data, paying with Orange Money or AfriMoney. They usually arrive from a shared campaign link rather than by browsing, and they are frequently not logged in: donating and tipping are both fully anonymous-capable, session-less flows.

**Campaign organizers.** Two account types, set at registration and carried on `User.roles`:

- _Individual_ — up to 2 active campaigns, 2.6% platform fee.
- _Organization_ (NGO / charity) — up to 8 active campaigns, 2.0% platform fee, plus organization profile fields (registration number, tax ID, website, address).

An organizer may not be the beneficiary; "beneficiary" is a distinct, first-class field in the campaign wizard.

**Diaspora card donors** are a real but secondary audience. Cards work through Monime checkout, but there is no FX and no multi-currency — everything is SLE. Treat diaspora support as present, not as a served audience.

**Admins and superadmins.** Operate on a separate `admin.` subdomain with a separate `admin_token` cookie. Only superadmin can create or modify admin accounts. Admins moderate campaigns, review KYC/KYB, approve payouts and threshold exceptions, and manage settings. Every admin action is written to `AuditLog`.

## Product Purpose

ib4me is a general-purpose crowdfunding platform for Sierra Leone. Individuals and organizations raise money for education, community development, emergency relief, health, children and youth, personal and family needs, environment, and charity work.

Campaigns go live immediately — there is no admin pre-approval queue. Trust is handled visibly instead: an unverified organizer's campaign carries an "Unverified Organizer" badge and a page-level warning, and a verified one carries a checkmark. Verification is never required to raise or receive money.

Success is money actually reaching a Sierra Leonean beneficiary's mobile wallet, with every deduction along the way itemized and reconcilable.

## Positioning

**Local money rails that actually work.** ib4me collects into and pays out of Sierra Leonean mobile money directly: Orange Money (`m17`) and AfriMoney (`m18`) through Monime, with real MSISDN normalization to `+232`, operator lookup, and a provider KYC call that resolves the number to its registered holder name before a payout is allowed (`lib/mobileMoney.ts`).

An international crowdfunding platform can take a Sierra Leonean's donation. It cannot pay a Freetown organizer into their mobile wallet, and it cannot confirm the wallet belongs to who they say it does. That gap is the product.

## Operating Context

- **Phone-first, on mobile data.** The primary donor is on a phone on a constrained connection, arriving from a shared link.
- **Money path is platform-first.** Donor → platform Monime account → internal transfer → the campaign's own Monime financial account. Every campaign gets a dedicated financial account at creation.
- **Sharing is the distribution mechanism.** Campaign share images, QR codes, and `navigator.share` — not search or ads.
- **Withdrawal is a reviewed event, not a button.** An organizer picks a campaign (balances are per-campaign), sees an explicit "requested X · fee Y · you receive Z" quote, and submits. Requests below the configured thresholds — both a fixed minimum and a minimum percentage of the amount raised — land in `threshold_review` and wait for an admin instead of going to Monime.
- **Rates are data, not constants.** Every fee rate is read from the `Setting` document, never hardcoded in a page.

## Capabilities and Constraints

### The fee model — the single most load-bearing product fact

**Fees are deducted from the donation. The donor is charged exactly the amount they type. Nothing is ever added on top.** (`lib/fees.ts`)

```
gross            donor is charged exactly this
  − monimeFee    Monime's cut, netted out before settlement (~1%)
  = arrived      what the platform account physically receives
  − platformFee  2.6% individual / 2.0% organization, applied to `arrived`
  = campaignReceives
```

Supporting rules that future copy must not contradict:

- All money is **integer minor units** (1 Le = 100). `Math.floor`, never round; floored per donation, never on a sum.
- A **reported** fee from Monime always beats a configured rate. A configured rate is a fallback only. `null` means "not reported" and must never be written as `0`.
- Payout fees follow the same shape: the fee comes out of the requested amount, so the recipient receives less than they requested.
- Any user-facing figure derived from an estimate must say so (`FeeSource: "reported" | "estimated"`).

Never write "100% of your donation goes to the campaign" or "donors cover the fees". Both are false.

### Payments

Monime is the only integrated processor. Rails: mobile money (Orange Money, AfriMoney), cards, bank transfer. **PayPal is a settings flag with no implementation. Stripe is not in the codebase.** Currency is SLE only; the "Le" symbol is produced by `lib/currency.ts`, which is the single money formatter.

### Tipping

A **tip** is money to ib4me the company, not to any campaign. Separate Monime account, separate ledger account type, separate transaction — never bundled into a donation. A tip carries no platform fee, because it _is_ platform income. Tipping is gated behind an admin toggle plus a configured tip financial account, and `lib/tipping.ts` **fails closed**: if settings can't be read, tipping reports as off.

### Accounting

Double-entry ledger (`campaign | platform | platform_revenue | platform_tips`), idempotent writes, zero-amount lines illegal, plus standalone reconcilers (`reconcile:donations`, `reconcile:ledger`, `backfill:fee-model`).

### Verification

KYC for individuals, KYB for organizations. Its function is a trust badge and, for organizations, the lower fee — **not** a gate on raising money. The one hard verification gate in the product is the mobile-money holder-name lookup at withdrawal.

### Known gaps — do not describe these as working

- **There is no email, SMS, or WhatsApp delivery anywhere.** `NotificationService` only writes rows and is imported by nothing. Copy that promises a receipt by email is currently untrue. The in-app notification bell is real; the outbound channels are not.
- **Refunds are not implemented** (`DonationService.refundDonation` is a TODO), and neither is receipt resending.
- **No i18n.** English only, `<html lang="en">`, no locale routing, no message catalogs.
- **No FX / multi-currency**, despite symbols existing for USD/GBP/EUR.
- **The contact form is a `mailto:` link**, not a submission pipeline.
- **PWA manifest with no service worker** — installable shell, zero offline capability.
- `Hospital` is a deprecated model from the medical-only era; it still has admin CRUD but nothing in the campaign path consults it.

### Terminology

campaign · organizer (public: _creator_) · beneficiary · donation / donor · tip / tipper · **withdrawal** (organizer-facing) ↔ **payout** (admin/system-facing, same object) · verification (KYC/KYB) · verified / unverified organizer · goal / raised / funded · platform fee · payment fee · campaign receives.

## Brand Commitments

- **Name: `ib4me`, lowercase, always.** `Ib4me` in the Navbar and `IB4ME` on the tip page are bugs, not variants.
- **Tagline: "Help Start Ya."** This replaces "Put fɔ wɛlbɔdi" completely; the old line is retired wherever it appears (root metadata, PWA manifest, hero logo alt text, `public/llms.txt`).
- **Canonical domain: `ib4me.org`.** `ROOT_DOMAIN=ib4me.com` in `.env.example` is stale.
- **Support: `ib4me.organisation@gmail.com`; 27B Grassfield, Freetown, Sierra Leone.** Both real and publishable.
- **Assets:** `public/assets/ib4melogo.png` (dark), `ib4melogowhite.png`, `ib4mefavicon.png`, `Hero.png` (OG image).
- **No social handles are committed.** They are admin-editable settings with no defaults; the footer correctly hides the row until they exist. Do not invent them.
- **Voice today** is warm, plain, second-person, and generically global ("Helping Each Other Can Make The World A Better Place"). Nothing in visible body copy is Sierra Leone-specific — the only local signal is the retired Krio line, which was never rendered as visible text.

## Evidence on Hand

**Real:**

- **The team.** Six named people with real photographs on disk (`app/about/page.tsx`, `public/assets/team/`): Joseph Melvin Kanu (COO), Saidu Bundu Kamara (CTO), Umara Abib Kamara (Head of Product), Ishaka Kargbo (Head of Campaign), Namina Warah Mansaray (Communications Lead), Rugiatu Kargbo (Head of Growth).
- **Live platform statistics.** `/api/stats` aggregates real database counts — funds raised, registered users, donations made, active campaigns — and `LiveStatsGrid` renders them honestly, showing `—` before load. The platform is live with meaningful traction, so these numbers are real and quotable.
- **The fee engine.** `lib/fees.ts`, `lib/currency.ts`, the double-entry ledger, the reconciler scripts, and unit tests in `tests/unit/`. The most rigorously built part of the product.
- **Legal pages.** Substantial, real terms, privacy, and cookie policy, sourced from `public/legal/*.md`.

**Absent — must never be fabricated:**

- **No partners.** The `Partner` model and admin CRUD exist; zero partner logos and no public partner surface.
- **No press mentions** of any kind.
- **Testimonials are real-or-nothing.** Every testimonial requires a real `userId` and passes admin moderation; there is no seeded fake set, and the empty state is honest.
- `lib/campaignsData.ts` contains four fabricated UK campaigns in GBP. It is dead code, imported by nothing.

**Claims that must be backed by `/api/stats`, not hardcoded:** any statement of the form "thousands of donors". The homepage currently hardcodes "Trusted by thousands of donors worldwide" directly above the live counters.

## Product Principles

1. **The money math is the product.** Every figure shown to a donor or organizer must match what `lib/fees.ts` computes, must say when it is an estimate, and must never round in the platform's favor.
2. **Say what is actually deducted.** The donor is charged exactly what they type, and the deductions are itemized. Never claim 100% pass-through.
3. **Trust is shown, not gatekept.** Campaigns launch instantly; verification state is displayed prominently, including the warning, rather than used to block.
4. **Built for a phone on Sierra Leonean mobile data.** Weight, image size, and above-the-fold render cost are product constraints, not polish.
5. **Never promise a channel that does not exist.** No receipt, no SMS, no WhatsApp message is delivered today.

## Accessibility & Inclusion

- **English only.** No i18n framework, no message catalogs. Krio is the brand's heritage but ships nowhere in the UI.
- **Low bandwidth is the real constraint and is currently unaddressed.** Unoptimised assets ship at up to ~1 MB (`Create-fundraiser.jpg` 998 KB, `donate_illustration.jpg` 742 KB, `Saidu.jpg` 610 KB); the About page passes `unoptimized` to `<Image>`; the homepage fetches its campaigns, stats, and testimonials client-side on mount, so a slow connection sees skeletons before content.
- **a11y is ad hoc.** Radix primitives provide a baseline; there is no skip link, no `eslint-plugin-jsx-a11y`, no axe pass, and colour contrast is unaudited. `aria-hidden` on decorative icons and `motion-reduce:` variants are used consistently where present.
- Money formatting is centralized and tested (`lib/currency.ts`); **date formatting is not** — roughly 15 raw `toLocaleDateString()` calls with mixed locales, mostly in admin.
