# MongoDB Database Schema for Medical Emergency Crowdfunding MVP

## Collections & Schemas

### 1) `users`

``` json
{
  "_id": ObjectId,
  "name": "Saidu Bundu-Kamara",
  "email": "saidu@example.com",
  "phone": "+2327xxxxxxx",
  "photoUrl": "https://...",
  "roles": ["user", "admin"],
  "status": "active",
  "whatsappOptIn": true,
  "createdAt": ISODate,
  "updatedAt": ISODate,
  "deletedAt": ISODate,
  "_v": 1
}
```

### 2) `auth_codes`

``` json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "channel": "sms",
  "purpose": "login",
  "codeHash": "bcryptHash",
  "expiresAt": ISODate,
  "consumedAt": ISODate,
  "ip": "102.128.x.x",
  "userAgent": "Chrome/134",
  "createdAt": ISODate
}
```

### 3) `hospitals`

``` json
{
  "_id": ObjectId,
  "name": "Connaught Hospital",
  "address": "Freetown...",
  "contactPhone": "+2327xxxxxxx",
  "contactEmail": "triage@...",
  "verified": true,
  "notes": "Onboarded 2025-08-01",
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

### 4) `campaigns`

``` json
{
  "_id": ObjectId,
  "ownerId": ObjectId,
  "slug": "help-john-surgery-2025",
  "patient": {
    "name": "John Doe",
    "age": 12,
    "photoUrls": ["https://.../p1.jpg"]
  },
  "diagnosis": "Acute appendicitis",
  "hospital": {
    "hospitalId": ObjectId,
    "name": "Connaught Hospital"
  },
  "goal": { "currency": "SLE", "amountMinor": 500000000 },
  "story": "Long-form markdown/HTML...",
  "documents": [{ "type": "doctor_report", "assetId": ObjectId }],
  "verification": {
    "status": "approved",
    "verifiedBy": ObjectId,
    "verifiedAt": ISODate,
    "hospitalVerified": true
  },
  "status": "active",
  "outcome": {
    "status": "ongoing",
    "date": ISODate,
    "nextOfKin": {
      "name": "Jane Doe",
      "relation": "Mother",
      "contact": "+2327xxxxxxx",
      "payoutDecision": "bills_funeral_related"
    }
  },
  "urgency": "high",
  "typeOfEmergency": "surgery",
  "share": {
    "whatsAppPostId": "whapi-msg-123"
  },
  "totals": {
    "raisedMinor": 125000000,
    "donationCount": 132,
    "uniqueDonorCount": 118,
    "lastDonationAt": ISODate
  },
  "withdrawals": {
    "totalPaidMinor": 75000000,
    "count": 2
  },
  "flags": {
    "featured": false,
    "adminVerified": true
  },
  "createdAt": ISODate,
  "updatedAt": ISODate,
  "archivedAt": null,
  "_v": 1
}
```

### 5) `campaign_updates`

``` json
{
  "_id": ObjectId,
  "campaignId": ObjectId,
  "authorId": ObjectId,
  "content": "Surgery scheduled for Friday.",
  "media": [{ "assetId": ObjectId }],
  "isPublic": true,
  "createdAt": ISODate
}
```

### 6) `donations`

``` json
{
  "_id": ObjectId,
  "campaignId": ObjectId,
  "donorId": ObjectId,
  "donorSnapshot": { "name": "Ada", "email": "ada@..." },
  "isAnonymous": false,
  "message": "Praying for you 🙏",
  "amount": { "currency": "SLE", "minor": 2500000 },
  "fx": {
    "displayCurrency": "USD",
    "rate": 0.055,
    "source": "Stripe"
  },
  "provider": {
    "name": "ORANGE_MONEY",
    "paymentId": "om-txn-123",
    "checkoutSessionId": "cs_test_..."
  },
  "status": "succeeded",
  "fees": { "paymentFeeMinor": 50000, "platformFeeMinor": 25000 },
  "netAmountMinor": 2425000,
  "receiptUrl": "https://.../receipt/...",
  "notifiedAt": ISODate,
  "createdAt": ISODate,
  "updatedAt": ISODate,
  "idempotencyKey": "evt_abc123"
}
```

### 7) `payouts`

``` json
{
  "_id": ObjectId,
  "campaignId": ObjectId,
  "requestedBy": ObjectId,
  "amountMinor": 30000000,
  "method": {
    "type": "mobile_money",
    "provider": "ORANGE_MONEY",
    "msisdn": "+2327xxxxxxx",
    "accountName": "John Doe"
  },
  "status": "in_review",
  "approvals": [
    { "adminId": ObjectId, "action": "approved", "note": "Docs clear", "at": ISODate }
  ],
  "policyCheck": {
    "minThresholdMet": true,
    "overrideBy": null
  },
  "paymentProofUrl": "https://.../mm-receipt.jpg",
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

### 8) `ledger_entries`

``` json
{
  "_id": ObjectId,
  "campaignId": ObjectId,
  "refType": "donation",
  "refId": ObjectId,
  "direction": "in",
  "amountMinor": 2500000,
  "currency": "SLE",
  "createdAt": ISODate
}
```

### 9) `media_assets`

``` json
{
  "_id": ObjectId,
  "ownerId": ObjectId,
  "campaignId": ObjectId,
  "type": "doctor_report",
  "storage": { "provider": "s3", "bucket": "ib4me", "key": "..." },
  "url": "https://...",
  "size": 482233,
  "checksum": "sha256:...",
  "createdAt": ISODate
}
```

### 10) `notifications`

``` json
{
  "_id": ObjectId,
  "recipient": { "userId": ObjectId, "phone": "+2327...", "email": "..." },
  "channel": "whatsapp",
  "template": "donation_receipt_v1",
  "payload": { "campaignSlug": "help-john...", "amountMinor": 2500000 },
  "status": "sent",
  "providerMessageId": "whapi-xyz",
  "createdAt": ISODate
}
```

### 11) `webhook_events`

``` json
{
  "_id": ObjectId,
  "provider": "STRIPE",
  "eventType": "charge.succeeded",
  "idempotencyKey": "evt_abc123",
  "payloadRef": {},
  "receivedAt": ISODate,
  "processedAt": ISODate,
  "status": "processed",
  "relatedIds": { "donationId": ObjectId, "campaignId": ObjectId }
}
```

### 12) `audit_logs`

``` json
{
  "_id": ObjectId,
  "actor": { "userId": ObjectId, "role": "admin" },
  "action": "campaign.verify",
  "target": { "type": "campaign", "id": ObjectId },
  "diff": { "verification.status": ["under_review", "approved"] },
  "ip": "102.128.x.x",
  "userAgent": "Chrome/134",
  "at": ISODate
}
```

### 13) `receipts_medical`

``` json
{
  "_id": ObjectId,
  "campaignId": ObjectId,
  "fileAssetId": ObjectId,
  "amountMinor": 18000000,
  "vendor": "Connaught Hospital",
  "date": ISODate,
  "description": "Surgery payment",
  "verifiedBy": ObjectId,
  "approved": true,
  "createdAt": ISODate
}
```

### 14) `settings`

``` json
{
  "_id": "platform",
  "withdrawal": {
    "minAmountMinor": 10000000,
    "minPercent": 25,
    "allowEmergencyOverride": true
  },
  "fees": {
    "platformFeeBps": 100,
    "mobileMoneyFeeBps": 200
  },
  "features": {
    "whatsAppAutoPost": true,
    "paypalEnabled": false,
    "emergencyPoolFund": false
  },
  "updatedAt": ISODate
}
```
