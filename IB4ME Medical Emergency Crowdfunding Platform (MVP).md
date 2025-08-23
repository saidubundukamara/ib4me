---
title: IB4ME Medical Emergency Crowdfunding Platform (MVP)

---

# IB4ME Medical Emergency Crowdfunding Platform (MVP)

A niche crowdfunding platform designed for **medical emergencies** in Sierra Leone.  
The platform enables patients/families to raise funds quickly, with donations accepted via **Mobile Money (Orange Money, AfriMoney)** and **credit cards**.  

---

## 🎯 Goals
- Provide a **transparent, trusted** way for Sierra Leoneans to fundraise for medical needs.
- Support **local and diaspora donors** with multiple payment options.
- Leverage **WhatsApp** as a primary channel for campaign awareness and communication.

---

## 🚀 MVP Features

### 1. User Authentication
- Sign up / Login (Phone + OTP or Email).
- Optional: Social login (Facebook/Google).

### 2. Campaign Creation
- Fields:
  - Patient name, age, photo.
  - Diagnosis, hospital name.
  - Amount needed.
  - Doctor’s report / medical documentation upload.
  - Contact details of campaign owner.
- Owner dashboard: track donations, edit info.

### 3. Admin Verification
- Admin reviews campaigns and supporting documents.
- Approve / reject campaigns.
- Approved campaigns published to:
  - Website (public campaigns page).
  - WhatsApp channel (via **Whapi API**).

### 4. Campaign Display
- Homepage: list of **active campaigns**.
- Campaign detail page:
  - Story, photos, goal & progress bar.
  - Donation button.
- Filters: by hospital, type of emergency, urgency.

### 5. Donations
- Local payments:
  - **Orange Money**.
  - **AfriMoney**.
- Credit card payments (Stripe/Monime).
- Automatic progress bar updates after donations.

### 6. Transparency & Updates
- Campaign owners can post updates (photos, notes).
- Donors notified via **email / WhatsApp**.
- Admin “Verified Campaign” tag after hospital confirmation.

### 7. Notifications
- Donors: confirmation receipts (WhatsApp/SMS).
- Admins: new campaign submissions.
- Campaign owners: approval/rejection updates.

### 8. Withdrawals
- **Minimum withdrawal threshold** (e.g., Le 100,000).
- Withdrawals via **Orange Money / AfriMoney**.
- Admin approval required before release.

---

## 📲 Extra Features (Improving Local Impact)

### 🔐 Trust & Transparency
- Display “Verified by Hospital” badge.
- Publish receipts for medical bill payments.
- Admin audits for suspicious campaigns.

### 📲 Accessibility
- **WhatsApp-first approach**:
  - Auto-post campaigns to WhatsApp channel.
  - Donation links open directly from WhatsApp posts.
- **USSD/SMS donations** for feature phone users (future).

### 🤝 Community Features
- Donate on behalf of someone.
- Peer-to-peer sharing with auto-generated posters.
- Leaderboard: top donors (weekly/monthly).

### 📊 Analytics & Reporting
- Campaign dashboard for owners:
  - Total donations, donor count, milestones.
- Admin dashboard:
  - Active campaigns, payout logs, donation stats.

### 💵 Diaspora Donations
- Accept credit cards & PayPal for Sierra Leoneans abroad.


### 🏥 Partnerships
- Collaborate with hospitals:
  - Direct-to-hospital payments.
  - Hospitals can publish urgent verified cases.

### 📢 Awareness
- Auto-generate **campaign posters** with QR codes.
- Integration for **Facebook/Twitter** sharing.

---

## ⚖️ Policies

### Withdrawals
- Minimum withdrawal: **25%** (to cover transaction fees).
- Withdrawals require **admin approval**.
- Emergency exception: smaller payouts allowed with admin override.

### In the Event of Patient Death
- By default: Funds go to next of kin for **medical bills, funeral, or related expenses**.
- Donors are notified of campaign status (via WhatsApp & website).
- Future option: part of unused funds may go into an **Emergency Pool Fund** to help other patients (with transparency).

---

## 🌍 Long-Term / Advanced Features
- Micro-health insurance tie-ins.
- Recurring monthly donations.
- Emergency pool fund for urgent pre-approved cases.
- AI/ML for fraud detection.

---

## ✅ MVP Summary
- **Core**: Campaign creation → Admin verification → Donations (local + cards) → Campaign display → Withdrawals.  
- **Local Enhancements**: WhatsApp integration, Mobile Money, transparency policies.  
- **Future Growth**: Diaspora support, hospital partnerships, emergency fund, insurance integration.
