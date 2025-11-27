# IB4ME Platform - How It Works

## What is IB4ME?

IB4ME is a medical emergency crowdfunding platform built specifically for Sierra Leone. It enables patients and their families to raise funds for urgent medical needs, accepting donations through mobile money (Orange Money, AfriMoney) and credit cards.

---

## How Donations Work

### The Donor Experience

1. A donor visits a campaign page and chooses to donate
2. They enter their donation amount and select a payment method (mobile money or card)
3. They're redirected to complete the payment
4. Once payment is confirmed, the campaign receives the funds

### Fee Structure

**Our fees are transparent and donor-friendly:**

| Fee | Rate | Who Pays |
|-----|------|----------|
| Payment Processing (Monime) | 1% | Added to donation |
| Platform Fee (Individuals) | 2.6% | Added to donation |
| Platform Fee (Organizations) | 2.0% | Added to donation |

**Key Point:** Fees are added ON TOP of the donation. This means **campaigns receive 100% of what donors intend to give**.

**Example:**
- Donor wants to give: **100,000 SLE**
- Fees (3.6% for individual): **3,600 SLE**
- Donor pays: **103,600 SLE**
- Campaign receives: **100,000 SLE** (the full intended donation)
- Platform revenue: **3,600 SLE**

### Payment Flow (Behind the Scenes)

All payments are processed through our payment partner, Monime:

1. Donor's payment goes to IB4ME's central account first
2. Platform automatically deducts fees
3. Full donation amount is transferred to the campaign's dedicated account
4. Everything is tracked in our ledger system for full transparency

This centralized model allows us to:
- Process payments efficiently
- Automatically handle fee collection
- Maintain clear financial records
- Potentially offer features like emergency funds or pooled resources in the future

---

## How Campaigns Work

### Creating a Campaign

Campaign creators go through a simple 6-step process:

1. **Emergency Details** - Type of medical emergency, urgency level, diagnosis
2. **Patient Information** - Name, age, photo
3. **Funding Goal** - Target amount needed
4. **Story** - The campaign narrative explaining the situation
5. **Documentation** - Medical records and supporting documents
6. **Review** - Final check before submission

### Verification Process

To protect donors and ensure legitimacy, all campaigns go through verification:

1. **Submission** - User creates campaign (status: Draft)
2. **Admin Review** - Our team reviews the campaign and documentation
3. **Approval/Rejection** - Campaign is either approved to go live or rejected with feedback
4. **Live** - Approved campaigns appear publicly and can receive donations

**For verified organizations:** Campaigns can be auto-approved, streamlining the process for trusted partners like hospitals or NGOs.

### Campaign Limits

To maintain quality and prevent abuse:
- Individual users have a limit on active campaigns
- Organizations have higher limits
- Admins can adjust these limits as needed

---

## How Withdrawals Work

### Requesting a Withdrawal

Campaign owners can withdraw funds raised:

1. Go to the withdrawal section in their dashboard
2. Select the campaign and enter withdrawal amount
3. Choose payout method (mobile money or bank transfer)
4. Submit request

### Safeguards & Thresholds

To prevent fraud and ensure proper use of funds:

| Threshold | Default |
|-----------|---------|
| Minimum withdrawal amount | 50,000 SLE |
| Minimum percentage of funds raised | 10% |

**If thresholds are met:** Withdrawal is processed automatically
**If below thresholds:** Requires manual admin approval

### Payout Methods

- **Mobile Money:** Orange Money or AfriMoney - instant transfer to phone number
- **Bank Transfer:** Direct deposit to bank account

### Admin Controls

Our admin team can:
- Approve or reject withdrawal requests
- Override minimum thresholds when appropriate (e.g., for urgent medical needs)
- Block withdrawals globally if needed (fraud prevention)
- Add payment proof for record-keeping

---

## Revenue Model

### Platform Revenue Streams

1. **Processing Fees per Donation**
   - 2.6% for individual campaigns
   - 2.0% for organization campaigns

2. **Fee Structure Benefits**
   - Fees are additive (donors pay slightly more, campaigns get full amount)
   - This encourages larger donations since campaigns aren't penalized
   - Clear value proposition for campaign creators

### Example Monthly Revenue

If the platform processes 100,000,000 SLE in donations:
- At 2.6% average fee: **2,600,000 SLE platform revenue**
- Plus Monime's 1% goes to payment processing

---

## Trust & Safety

### Verification Layers

1. **User Verification (KYC/KYB)**
   - Individuals must verify identity before campaigns can receive donations
   - Organizations undergo business verification

2. **Campaign Verification**
   - Every campaign reviewed by admin before going live
   - Medical documentation required

3. **Financial Controls**
   - Minimum withdrawal thresholds
   - Admin approval for edge cases
   - Global withdrawal blocking capability

### Audit Trail

All actions are logged:
- Admin approvals/rejections with reasons
- Withdrawal requests and processing
- Campaign status changes
- User verification updates

---

## Technical Infrastructure

### Key Components

- **Payment Processing:** Monime (supports mobile money, cards, bank transfers)
- **Financial Accounts:** Each campaign has its own dedicated financial account
- **Ledger System:** Double-entry bookkeeping for all transactions
- **Currency:** Sierra Leone Leone (SLE) as primary currency

### Platform-First Payment Model

```
Donor → Payment → IB4ME Platform Account → Campaign Account
                         ↓
                   Fees retained
```

This architecture enables:
- Centralized fee collection
- Easy reconciliation and reporting
- Future features (emergency fund, matching donations, etc.)

---

## Summary

IB4ME provides a trusted, transparent platform for medical crowdfunding in Sierra Leone:

- **For Donors:** Easy mobile money/card payments, full donation goes to campaign
- **For Campaign Creators:** Simple setup, verified platform, easy withdrawals
- **For the Platform:** Sustainable fee-based revenue model
- **For Trust:** Multi-layer verification, admin oversight, full audit trail
