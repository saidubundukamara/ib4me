# Donation Flow: Platform-First Payment Architecture

## Overview

All donations go to the platform's Monime financial account first, then the donation amount is transferred to the campaign's account. The platform keeps the processing fee.

## Fee Structure

| Fee | Rate | Description | Paid By |
|-----|------|-------------|---------|
| Payment Fee (Monime) | 1% | Payment processor fee | Donor (auto-deducted by Monime) |
| Platform Fee | 2.6% (individual) / 2.0% (organization) | IB4ME platform fee | Donor |
| **Total** | **3.6%** (individual) / **3.0%** (organization) | Combined fees | Donor |

**Fee rates are configurable by admins:**
- Individual campaigns: Default 2.6% platform fee (+ 1% payment fee = 3.6% total)
- Organization campaigns: Default 2.0% platform fee (+ 1% payment fee = 3.0% total)

### Example: Le 100 Donation (Individual Campaign)

1. Donation amount: Le 100
2. Payment fee (1%): Le 1.00
3. Platform fee (2.6%): Le 2.60
4. **Total fees: Le 3.60**
5. **Donor pays: Le 103.60** (rounded to Le 104)
6. Monime deducts 1% of Le 104 = Le 1.04 → Platform receives Le 102.96
7. Platform transfers Le 100 to campaign account
8. Platform keeps: Le 2.96 (the platform fee portion after Monime's cut)

### Example: Le 250 Donation (Individual Campaign)

1. Donation amount: Le 250
2. Total fees (3.6%): Le 9
3. **Donor pays: Le 259**
4. Campaign receives: Le 250

## Flow Diagram

```
Donor -> Checkout (Le 103.60) -> Platform Account -> Internal Transfer (Le 100) -> Campaign Account
                                     |
                                     +-> Platform keeps platform fee (Le 2.96 after Monime's 1%)
```

## Donation Status Lifecycle

```
pending
  |
  v (payment.completed webhook)
payment_received
  |
  +-- Initiate internal transfer (synchronous API call)
  |
  +-- Transfer succeeds immediately?
  |       |
  |       YES -> Mark donation "succeeded"
  |              Update campaign totals
  |              Create ledger entries
  |
  |       NO (API error) -> Store transfer error
  |                         Queue for retry
  |                         Admin can manually retry
```

## Internal Transfer API

**Endpoint:** `POST https://api.monime.io/v1/internal-transfers`

**Request:**
```typescript
{
  amount: {
    currency: "SLE",
    value: 10000  // Minor units
  },
  sourceFinancialAccount: {
    id: "<platform-financial-account-id>"
  },
  destinationFinancialAccount: {
    id: "<campaign-financial-account-id>"
  },
  description: "Donation transfer for <donationId>",
  metadata: {
    donationId: "<donationId>",
    type: "donation_transfer"
  }
}
```

**Headers:**
```
Authorization: Bearer <token>
Monime-Space-Id: <space-id>
Idempotency-Key: <unique-key>
Content-Type: application/json
```

## Ledger Entries Per Donation

For a Le 100 donation with Le 3.60 total fees (Le 103.60 charged to donor):

| # | Account | Type | Direction | Amount (minor) | When |
|---|---------|------|-----------|----------------|------|
| 1 | Platform | `platform_receipt` | in | 10,256* | payment.completed |
| 2 | Platform | `platform_fee` | in | 360 | payment.completed |
| 3 | Platform | `platform_transfer_out` | out | 10,000 | transfer.completed |
| 4 | Campaign | `campaign_transfer_in` | in | 10,000 | transfer.completed |

*After Monime's 1% deduction from Le 103.60 (Le 1.04)

## Error Handling

### Transfer Failures

When an internal transfer fails:
1. Store error details in `donation.transfer.failureReason`
2. Keep donation status as `payment_received`
3. Increment `donation.transfer.retryCount`
4. Admin can retry manually via `/api/admin/donations/[id]/retry-transfer`
5. Max retry attempts: 5

### Admin Retry Endpoint

```
POST /api/admin/donations/{donationId}/retry-transfer
Authorization: Admin session required
```

## Files Modified

| File | Description |
|------|-------------|
| `models/Donation.ts` | Added `payment_received` status, `transfer` field |
| `models/LedgerEntry.ts` | Added new ref types, `accountType`, `transferId` |
| `models/Setting.ts` | Simplified fee structure (baseFeeMinor = 0) |
| `lib/monime.ts` | Added `createInternalTransfer` method |
| `services/DonationService.ts` | Added transfer handling methods |
| `services/SettingService.ts` | Updated fee calculation |
| `repositories/LedgerEntryRepository.ts` | Added platform balance methods |
| `app/api/donations/create/route.ts` | Targets platform account |
| `app/api/donations/webhook/route.ts` | Implements transfer flow |
| `app/api/admin/donations/[id]/retry-transfer/route.ts` | Admin retry endpoint |
| `app/campaigns/[slug]/donate/DonateClient.tsx` | Displays fee breakdown |
| `app/s/admin/settings/components/FeeSettings.tsx` | Simplified fee settings |

## Configuration Required

Before using this flow, ensure:

1. **Platform Financial Account** is configured in admin settings
   - Navigate to Admin > Settings > Payment
   - Set the platform financial account ID from Monime

2. **Fee Settings** are configured (optional - defaults are provided)
   - Individual campaigns: 260 bps (2.6%)
   - Organization campaigns: 200 bps (2.0%)

## Testing Checklist

1. [ ] Platform account configured in admin settings
2. [ ] Verify Monime internal transfer API works
3. [ ] Happy path: donation -> payment_received -> transfer -> succeeded
4. [ ] Failure path: transfer fails -> logged for admin
5. [ ] Campaign totals only update on transfer completion
6. [ ] Ledger entries created correctly
7. [ ] Fee breakdown displays correctly on donate page
