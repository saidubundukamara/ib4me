# Missing Features (Hierarchical)

Scope: Based on the MVP document and current codebase scan. Items are end-user or platform capabilities that are not yet implemented. Status legend: [Missing] = not present, [Partial] = some backend primitives exist but feature not end-to-end.

## Platform & UI Shell

- **Public site routing**: Home listing active campaigns [Missing]
- **Campaign detail page**: story, media, progress, donate CTA [Missing]
- **Global layout**: navigation, footer, SEO/meta, error pages [Partial]
- **Search & filters**: by hospital, urgency, type [Missing]
- **Media upload UI**: photos, doctor’s report upload [Missing]

## Authentication & Authorization

- **OTP/email login**: phone/email with code delivery + verification [Missing]
- **Social login**: Google/Facebook [Missing]
- **Sessions**: auth guards for protected routes [Missing]
- **Roles & permissions**: admin, campaign owner, viewer [Missing]

## Campaign Management

- **Create campaign flow**: multi-step form, validation, slugging [Missing]
- **Edit campaign**: owner can update details/media [Missing]
- **Owner dashboard**: donations, progress, status, actions [Missing]
- **Document handling**: secure storage + virus scan + metadata [Missing]

## Admin Verification

- **Review queue**: pending campaigns list with docs preview [Missing]
- **Approve/Reject workflow**: status changes, notes, audit trail UI [Missing]
- **Hospital verification**: mark “Verified by Hospital” with proof [Missing]
- **Badge display**: verified indicators on public pages [Missing]

## Donations & Payments

- **Mobile Money – Orange Money**: checkout/initiation, callback handling [Missing]
- **Mobile Money – AfriMoney**: checkout/initiation, callback handling [Missing]
- **Card payments (Stripe/Monime)**: checkout, 3DS, webhooks [Missing]
- **Donation API endpoints**: create pending, confirm success/failure [Missing]
- **Webhook processors**: idempotent handling, donation reconciliation [Partial]
- **Receipts**: donor confirmation pages/links and emails/WhatsApp [Missing]
- **Anonymous donations**: UI + masking on public feeds [Partial]
- **FX display**: donor display currency and rate source [Missing]

## Notifications

- **WhatsApp provider integration**: Whapi templates and sending [Missing]
- **Email/SMS providers**: transactional delivery + templates [Missing]
- **Delivery worker**: queue, retries, DLQ, idempotency [Missing]
- **Opt-in/out management**: per-user channel preferences [Missing]

## Withdrawals / Payouts

- **Payout request UI**: specify amount, method, destination [Missing]
- **Admin approval workflow**: approve/reject with notes [Missing]
- **Mobile Money payouts**: execution and reconciliation [Missing]
- **Policy enforcement**: min threshold/percent, overrides [Partial]
- **Proof-of-payment**: upload and link to payout [Missing]
- **Ledger entries UI**: visibility of in/out movements [Missing]

## Transparency & Updates

- **Campaign updates UI**: owner posting text/media updates [Missing]
- **Public updates feed**: visible on campaign detail [Missing]
- **Medical receipt publishing**: upload/approve/display receipts [Missing]

## Sharing & Awareness

- **WhatsApp auto-post**: on campaign approval/update [Missing]
- **Social sharing**: Facebook/Twitter share metadata & links [Missing]
- **Poster generator**: image with story/QR/short-link [Missing]

## Analytics & Reporting

- **Owner analytics**: totals, donors, milestones, trends [Missing]
- **Admin dashboard**: active/pending campaigns, donations, payouts [Missing]

## Hospital Partnerships

- **Hospital portal**: verified hospital accounts and case submission [Missing]
- **Direct-to-hospital payments**: flow and reconciliation [Missing]

## Diaspora & International

- **PayPal support**: for diaspora donors [Missing]
- **Multi-currency**: base/display currency modeling & conversion [Missing]

## Accessibility

- **USSD/SMS donations**: non-smartphone donation paths [Missing]

## Security, Compliance, and Risk

- **Rate limiting & abuse protection**: per-IP/user throttles [Missing]
- **Fraud checks**: heuristic/ML signals, velocity rules [Missing]
- **KYC/KYB**: for payout recipients/admin overrides [Missing]
- **Legal pages**: Privacy Policy, Terms, Disclaimers [Missing]
- **Data retention & PII handling**: deletion/anonymization tools [Missing]

## System & Infrastructure

- **Provider configs**: env management for Stripe/Monime/Whapi/SMS [Missing]
- **Background jobs/queue**: worker, scheduling, retries [Missing]
- **Observability**: structured logging, metrics, tracing, alerting [Missing]
- **Error handling policy**: standardized errors, user-safe messages [Missing]
- **Testing**: unit, integration, e2e for core flows [Missing]
- **CI/CD**: build, test, deploy pipeline [Missing]
- **Seed scripts**: dev fixtures for users/campaigns/donations [Missing]
- **Migrations**: schema/data migrations tooling [Missing]

---

## Notes on Partials (backend primitives exist)

- Donation status transitions and ledger entries exist in services, but no API/webhook wiring or UI.
- Webhook event recording exists without providers or processors.
- Notification queueing exists without provider delivery or templates.
- Payout status transitions and ledger entries exist without execution/provider integration.
- Models/repositories are defined for most domain objects but lack routes/UI.
