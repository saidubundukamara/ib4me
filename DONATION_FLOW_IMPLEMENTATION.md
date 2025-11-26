# Donation Flow Redesign: Platform-First Payment Architecture

## Problem Statement

Currently, donations go directly to campaign financial accounts in Monime. This creates a problem:
- Fees (platform + processing) are calculated and tracked in the database
- But the **full payment (donation + fees) goes to the campaign**, not the platform
- Platform has no way to actually collect its fees

## Solution Overview

Route ALL payments to a central platform account first, then transfer the donation amount to the campaign account. Platform keeps the fees.

```
BEFORE: Donor -> Monime Checkout -> Campaign Account (receives ALL)

AFTER:  Donor -> Monime Checkout -> Platform Account -> Transfer -> Campaign Account
        (Platform keeps fees)      (Campaign gets donation amount only)
```

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Transfer timing | Immediately after payment | Funds should move to campaign promptly |
| Campaign accounts | Keep per-campaign Monime accounts | Maintains fund isolation for payouts |
| Failure handling | Simple logging | Admin handles failed transfers manually via Monime dashboard |
| Accounting | Full double-entry | 4 ledger entries per donation for complete audit trail |
| Campaign totals | Update on transfer completion | Ensures totals reflect actual funds in campaign account |

---

## New Donation Flow

### Step-by-Step Flow

1. **Donation Created** (`/api/donations/create`)
   - Donation record created with `status: "pending"`
   - Checkout session targets `platformFinancialAccount.id` (NOT campaign account)
   - Metadata includes `campaignFinancialAccountId` for later transfer

2. **Payment Completed** (webhook: `payment.completed`)
   - Update donation `status: "payment_received"` (NEW intermediate status)
   - Create ledger entries for platform receipt and fee collection
   - Initiate internal transfer from platform to campaign account
   - Update donation `transfer.status: "pending"`

3. **Transfer Completed** (webhook: `internal_transfer.completed`)
   - Update donation `status: "succeeded"`
   - Update donation `transfer.status: "completed"`
   - Create ledger entries for transfer (platform out, campaign in)
   - **NOW** update campaign totals (`raisedMinor`, `donationCount`)

4. **Transfer Failed** (webhook: `internal_transfer.failed`)
   - Update donation `transfer.status: "failed"` with reason
   - Log error for admin review
   - Admin manually retries via Monime dashboard

### Donation Status Lifecycle

```
pending
  |
  v (payment.completed webhook)
payment_received  <-- NEW STATUS
  |
  +-- transfer.status: pending
  |
  v (internal_transfer.completed webhook)
succeeded
  |
  +-- transfer.status: completed
  +-- campaign totals updated

OR if transfer fails:

payment_received
  |
  +-- transfer.status: failed
  +-- failureReason recorded
  +-- Admin handles manually
```

---

## Implementation Details

### 1. Model Changes

#### Donation Model (`models/Donation.ts`)

Add new status and transfer tracking:

```typescript
// Update status enum
status: "pending" | "payment_received" | "succeeded" | "failed" | "refunded"

// Add transfer tracking (new field)
transfer?: {
  id?: string;              // Monime transfer ID
  status: "pending" | "completed" | "failed";
  initiatedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
} | null;
```

#### LedgerEntry Model (`models/LedgerEntry.ts`)

Extend for platform-level accounting:

```typescript
// New ref types
export type LedgerRefType =
  | "donation"              // Campaign receives donation
  | "payout"                // Withdrawal from campaign
  | "adjustment"            // Manual adjustment
  | "donation_refund"       // Refund
  | "platform_receipt"      // NEW: Payment received to platform
  | "platform_fee"          // NEW: Fee retained by platform
  | "platform_transfer_out" // NEW: Transfer out from platform
  | "campaign_transfer_in"; // NEW: Transfer in to campaign

// New fields
accountType: "campaign" | "platform";  // Which account this entry affects
transferId?: string;                   // Monime transfer ID for reconciliation
feeBreakdown?: {                       // For platform_fee entries
  baseFeeMinor: number;
  processingFeeMinor: number;
  campaignType: "individual" | "organization";
};
```

---

### 2. API Changes

#### Donation Creation (`app/api/donations/create/route.ts`)

Change checkout target from campaign to platform:

```typescript
// BEFORE
financialAccountId: campaign.financial_account.id

// AFTER
const platformAccount = await settingService.getPlatformAccountSettings();
if (!platformAccount?.id) {
  return NextResponse.json(
    { error: "Platform payment processing not configured" },
    { status: 500 }
  );
}
financialAccountId: platformAccount.id

// Add to metadata for transfer
metadata: {
  ...existingMetadata,
  campaignFinancialAccountId: campaign.financial_account.id,
}
```

#### Webhook Handler (`app/api/donations/webhook/route.ts`)

**Modify `handlePaymentCompleted`:**

```typescript
async function handlePaymentCompleted(payload: MonimeWebhookPayload) {
  const { donationId, checkoutSession, payment } = extractPaymentData(payload);

  await runInTransaction(async (session) => {
    // 1. Mark as payment_received (NOT succeeded yet)
    await donationService.markPaymentReceived(donationId, payment, session);

    // 2. Create platform ledger entries
    const donation = await donationRepository.findById(donationId);

    // Entry 1: Platform receives full payment
    await ledgerEntryRepository.create({
      accountType: "platform",
      refType: "platform_receipt",
      refId: donation._id,
      direction: "in",
      amountMinor: donation.totalChargedMinor,
      currency: donation.amount.currency,
    }, session);

    // Entry 2: Platform fee recorded
    await ledgerEntryRepository.create({
      accountType: "platform",
      campaignId: donation.campaignId,
      refType: "platform_fee",
      refId: donation._id,
      direction: "in",
      amountMinor: donation.fees.totalFeeMinor,
      currency: donation.amount.currency,
      feeBreakdown: {
        baseFeeMinor: donation.fees.baseFeeMinor,
        processingFeeMinor: donation.fees.processingFeeMinor,
        campaignType: donation.fees.campaignType,
      },
    }, session);
  });

  // 3. Initiate transfer (outside transaction - fire and log)
  const campaignFaId = checkoutSession.metadata?.campaignFinancialAccountId;
  try {
    const transfer = await monimeService.createInternalTransfer({
      source: { financialAccountId: platformAccountId },
      destination: { financialAccountId: campaignFaId },
      amount: {
        value: donation.amount.minor,  // Donation only, not fees
        currency: donation.amount.currency,
      },
      metadata: { donationId, type: "donation_transfer" },
    });

    await donationService.updateTransferStatus(donationId, {
      id: transfer.id,
      status: "pending",
      initiatedAt: new Date(),
    });
  } catch (error) {
    console.error(`Transfer failed for donation ${donationId}:`, error);
    await donationService.updateTransferStatus(donationId, {
      status: "failed",
      failureReason: error.message,
    });
  }
}
```

**Add new handlers for transfer webhooks:**

```typescript
case "internal_transfer.completed":
  await handleTransferCompleted(payload);
  break;

case "internal_transfer.failed":
  await handleTransferFailed(payload);
  break;

async function handleTransferCompleted(payload: MonimeWebhookPayload) {
  const transfer = payload.data;
  const donationId = transfer.metadata?.donationId;

  await runInTransaction(async (session) => {
    const donation = await donationRepository.findById(donationId);

    // 1. Update donation to succeeded
    await donationRepository.updateById(donationId, {
      status: "succeeded",
      "transfer.status": "completed",
      "transfer.completedAt": new Date(),
      completedAt: new Date(),
    }, session);

    // 2. Create transfer ledger entries
    // Entry 3: Platform transfer out
    await ledgerEntryRepository.create({
      accountType: "platform",
      campaignId: donation.campaignId,
      refType: "platform_transfer_out",
      refId: donation._id,
      direction: "out",
      amountMinor: donation.amount.minor,
      currency: donation.amount.currency,
      transferId: transfer.id,
    }, session);

    // Entry 4: Campaign receives transfer
    await ledgerEntryRepository.create({
      accountType: "campaign",
      campaignId: donation.campaignId,
      refType: "campaign_transfer_in",
      refId: donation._id,
      direction: "in",
      amountMinor: donation.amount.minor,
      currency: donation.amount.currency,
      transferId: transfer.id,
    }, session);

    // 3. NOW update campaign totals
    await campaignRepository.updateById(donation.campaignId, {
      $inc: {
        "totals.raisedMinor": donation.amount.minor,
        "totals.donationCount": 1,
      },
      $set: { "totals.lastDonationAt": new Date() },
    }, session);
  });
}

async function handleTransferFailed(payload: MonimeWebhookPayload) {
  const transfer = payload.data;
  const donationId = transfer.metadata?.donationId;

  await donationService.updateTransferStatus(donationId, {
    status: "failed",
    failureReason: transfer.failureReason || "Transfer failed",
  });

  console.error(`Transfer failed for donation ${donationId}:`, transfer.failureReason);
  // Admin will handle manually via Monime dashboard
}
```

---

### 3. Monime Service (`lib/monime.ts`)

Add internal transfer capability:

```typescript
export interface MonimeInternalTransferRequest {
  source: { financialAccountId: string };
  destination: { financialAccountId: string };
  amount: { value: number; currency: string };
  metadata?: Record<string, unknown>;
}

export interface MonimeInternalTransferResponse {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  amount: { value: number; currency: string };
  source: { financialAccountId: string };
  destination: { financialAccountId: string };
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
  metadata?: Record<string, unknown>;
}

async createInternalTransfer(
  request: MonimeInternalTransferRequest,
  idempotencyKey?: string
): Promise<MonimeInternalTransferResponse> {
  const response = await this.client.post('/book-transfers', request, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
  });
  return response.data;
}
```

---

### 4. Service Changes

#### DonationService (`services/DonationService.ts`)

Add new methods:

```typescript
async markPaymentReceived(
  donationId: string,
  paymentDetails: MonimePayment,
  session?: ClientSession
): Promise<IDonation | null> {
  return this.repository.updateById(donationId, {
    status: "payment_received",
    "provider.paymentId": paymentDetails.id,
    "fees.paymentFeeMinor": paymentDetails.fees?.total || 0,
    updatedAt: new Date(),
  }, session);
}

async updateTransferStatus(
  donationId: string,
  transfer: {
    id?: string;
    status: "pending" | "completed" | "failed";
    initiatedAt?: Date;
    completedAt?: Date;
    failureReason?: string;
  }
): Promise<IDonation | null> {
  return this.repository.updateById(donationId, {
    $set: { transfer, updatedAt: new Date() },
  });
}
```

---

### 5. Repository Changes

#### LedgerEntryRepository (`repositories/LedgerEntryRepository.ts`)

Add platform balance query:

```typescript
async getPlatformBalance(): Promise<{ totalIn: number; totalOut: number; balance: number }> {
  const result = await this.model.aggregate([
    { $match: { accountType: "platform" } },
    {
      $group: {
        _id: null,
        totalIn: {
          $sum: { $cond: [{ $eq: ["$direction", "in"] }, "$amountMinor", 0] },
        },
        totalOut: {
          $sum: { $cond: [{ $eq: ["$direction", "out"] }, "$amountMinor", 0] },
        },
      },
    },
    { $project: { balance: { $subtract: ["$totalIn", "$totalOut"] } } },
  ]);
  return result[0] || { totalIn: 0, totalOut: 0, balance: 0 };
}

async getFeeRevenue(dateFrom?: Date, dateTo?: Date): Promise<{
  totalFees: number;
  baseFees: number;
  processingFees: number;
  count: number;
}> {
  const match: any = { refType: "platform_fee" };
  if (dateFrom || dateTo) {
    match.createdAt = {};
    if (dateFrom) match.createdAt.$gte = dateFrom;
    if (dateTo) match.createdAt.$lte = dateTo;
  }

  const result = await this.model.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalFees: { $sum: "$amountMinor" },
        baseFees: { $sum: "$feeBreakdown.baseFeeMinor" },
        processingFees: { $sum: "$feeBreakdown.processingFeeMinor" },
        count: { $sum: 1 },
      },
    },
  ]);
  return result[0] || { totalFees: 0, baseFees: 0, processingFees: 0, count: 0 };
}
```

---

## Files to Modify

| File | Type | Changes |
|------|------|---------|
| `models/Donation.ts` | Modify | Add `payment_received` status, add `transfer` field |
| `models/LedgerEntry.ts` | Modify | Add new ref types, `accountType`, `transferId`, `feeBreakdown` |
| `app/api/donations/create/route.ts` | Modify | Target platform account, add campaign FA ID to metadata |
| `app/api/donations/webhook/route.ts` | Modify | Split payment handling, add transfer handlers |
| `lib/monime.ts` | Modify | Add `createInternalTransfer` method |
| `services/DonationService.ts` | Modify | Add `markPaymentReceived`, `updateTransferStatus` |
| `repositories/LedgerEntryRepository.ts` | Modify | Add `getPlatformBalance`, `getFeeRevenue` |

---

## Ledger Entries Per Donation (Full Double-Entry)

For a Le 100 donation with Le 3.10 fees (Le 103.10 total charged):

| # | Account | Type | Direction | Amount | Description |
|---|---------|------|-----------|--------|-------------|
| 1 | Platform | `platform_receipt` | in | 10,310 | Full payment received |
| 2 | Platform | `platform_fee` | in | 310 | Fee retained |
| 3 | Platform | `platform_transfer_out` | out | 10,000 | Transfer to campaign |
| 4 | Campaign | `campaign_transfer_in` | in | 10,000 | Donation received |

**Platform balance check:** Entry 1 - Entry 3 = 10,310 - 10,000 = 310 (fees)
**This should equal:** Sum of Entry 2 = 310

---

## Backward Compatibility

- **Existing donations**: Already `succeeded` with funds in campaign accounts. No migration needed.
- **New donations**: Use new flow. Old donations have no `transfer` field (field is optional).
- **Campaign totals**: Remain accurate. Old donations already counted. New donations counted on transfer completion.

---

## Testing Checklist

1. **Pre-deployment:**
   - [ ] Platform account configured in admin settings (`platformFinancialAccount.id`)
   - [ ] Verify Monime internal transfer API endpoint works

2. **Happy path:**
   - [ ] Create donation - targets platform account
   - [ ] Payment completes - status becomes `payment_received`
   - [ ] Transfer completes - status becomes `succeeded`, campaign totals update
   - [ ] Verify 4 ledger entries created

3. **Failure handling:**
   - [ ] Transfer fails - donation stays `payment_received`, logged for admin
   - [ ] Platform account not configured - returns 500 error

4. **Accounting:**
   - [ ] Platform balance = sum of fees
   - [ ] Campaign totals = sum of completed transfers

---

## Open Questions for Monime API

Before implementation, verify with Monime documentation:

1. What is the endpoint for internal/book transfers? (assumed `/book-transfers`)
2. What webhook events are fired? (assumed `internal_transfer.completed`, `internal_transfer.failed`)
3. Is idempotency supported on transfers?
4. What is the webhook signature header for transfer events?

---

## Implementation Order

1. **Phase 1: Model Updates**
   - Update `models/Donation.ts` with new status and transfer field
   - Update `models/LedgerEntry.ts` with new types and fields

2. **Phase 2: Monime Integration**
   - Add `createInternalTransfer` to `lib/monime.ts`
   - Verify API works with Monime

3. **Phase 3: Service Layer**
   - Add new methods to `services/DonationService.ts`
   - Add platform balance methods to `repositories/LedgerEntryRepository.ts`

4. **Phase 4: API Routes**
   - Update `app/api/donations/create/route.ts` to target platform account
   - Update `app/api/donations/webhook/route.ts` with new handlers

5. **Phase 5: Testing**
   - Test full flow with test donations
   - Verify ledger entries are created correctly
   - Verify campaign totals update on transfer completion
