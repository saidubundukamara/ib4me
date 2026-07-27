# Monime fee model — implementation spec

> **Read this before touching any code that moves money through Monime.**
>
> Audience: an AI agent (or engineer) implementing or repairing a Monime integration.
> This is the **resolved** model. It is normative — the rules below are numbered so they can be
> cited in review. It was written after fixing a real, shipped cash-flow defect in
> `ezstaw-backend`, and applies equally to any escrow-style platform on Monime.
>
> Reference implementation: `ezstaw-backend/apps/payment/`. Every file path in this document is
> relative to that repo unless stated otherwise.
> History of the investigation (pre-fix findings, superseded): `docs/payment-fees-design-note.md`.

---

## 1. The bug class, in one paragraph

**Monime nets its fee out of the money *before* it settles.** Your financial account receives
`gross − fee`, never `gross`. If your code credits the merchant (or an escrow pool) with the
amount you *asked Monime to collect*, you have booked money that never arrived. Escrow then
pays out more than came in, and the difference is silently funded by other orders' undelivered
float — a growing cash-flow drain, not a rounding error. The same shape repeats on the way out:
the payout fee comes out of the amount sent, so the merchant receives less than your ledger says
you sent them.

### 60-second self-check

Run these against the codebase. Any one of them failing means the defect is present.

| Check | What you're looking for |
|---|---|
| `grep -rn "fees" <payment webhook handler>` | Does anything read `data.fees[]` off the settlement payload? If not, the provider fee is **not modelled at all**. |
| Trace the amount passed to your escrow-credit / balance-credit call | If it is the same variable you sent to Monime's checkout, you are crediting gross. |
| `grep -rn "fee" <payout model / schema>` | Is there a `fee` and a `netAmount` column on payouts? If not, the merchant is being told a number they will not receive. |
| Look at your fake/dev provider mode | Does it emit a `fees[]` array? If not, **no local test can ever surface this bug** — this is how it ships unnoticed. |
| Look at the merchant-facing balance | Is it one number, or an itemised breakdown? A single number is always the wrong number. |

---

## 2. Monime's actual behaviour

Ground truth, captured from a real `payment.processing_completed` webhook. Do not infer any of
this — it is not what a Stripe-shaped mental model predicts.

1. **The fee is netted before settlement.** The pool receives `amount − sum(fees)`. There is no
   "hold then pay the fee" step for you to model.
2. **The fee is charged on the TOTAL COLLECTED, not on the item price.** If you add anything on
   top of the item — a surcharge passed to the customer, a tip, a service fee — Monime taxes
   that too. Budgeting 1% of the item price when you charged item + surcharge leaves you short
   by 1% of the surcharge on every single transaction, forever.
3. **`data.fees` is an ARRAY**, each entry `{ amount: { currency, value }, code, metadata }`.
   `"Base"` is the only code observed so far, but the set is Monime's to extend.
   **Sum it. Never read `[0]`.**
4. **Two events fire for one payment**, with the same timestamp:
   - `checkout_session.completed` — **no `fees[]`**
   - `payment.processing_completed` — **carries `fees[]`**

   Either can arrive first. Whichever your inbox processes first will settle the order, so a
   naive handler that returns early on "already settled" loses the fee roughly half the time.
   Worse: a handler that *writes* a fee of `0` on the fee-less event will clobber a real fee
   recorded by the other one.
5. **The event name is `payment.processing_completed`**, not `payment.completed`. There is no
   evidence `payment.completed` is ever sent.
6. **The session id lives at `data.ownershipGraph.owner`** (`{ type: "checkout_session", id }`),
   **not** at `data.checkoutSessionId`.
7. **`financialTransactionReference` and `channel.reference`** are the strongest reconciliation
   keys available. Capture both.
8. **The payout fee comes out of the amount sent.** Request a payout of `X`, Monime moves `X`,
   the merchant's wallet gains `X − fee`. It is ~1%, and it is reported on `payout.completed`
   in the same `fees[]` shape.
9. **Fees are charged per capture.** A pre-order settled in two installments is charged twice,
   each rounded independently.
10. **Polled reads carry no fee data.** `GET /checkout-sessions/{id}` and the payment-code
    endpoints return no `fees[]`. Anything settled by a polling fallback rather than the webhook
    will over-credit until corrected — log it loudly where it happens.
11. **The live API double-nests some fields.** Real `checkout-session` responses nest
    `status` / `metadata` / `reference` under a second `result`. A flat fake-mode stub will not
    reproduce this, so the nesting only bites in production — flatten defensively.

### The payload (abridged to load-bearing fields)

```jsonc
{
  "apiVersion": "caph.2025-08-23",
  "event": { "id": "wkd-...", "name": "payment.processing_completed", "timestamp": "1784112516" },
  "object": { "id": "spm-k6SuRvH5uuVM967ptVAYawT9jJm", "type": "payment" },
  "data": {
    "amount": { "currency": "SLE", "value": 30000 },      // GROSS the customer paid
    "fees": [                                             // ARRAY — sum it, never read [0]
      { "amount": { "currency": "SLE", "value": 300 }, "code": "Base", "metadata": null }
    ],
    "channel": {
      "type": "momo", "provider": "m18",
      "reference": "MP260715.1048.A32757",                // MNO reference — recon key
      "phoneNumber": "+23299****51"
    },
    "financialAccountId": "fac-...",
    "financialTransactionReference": "20260715-104836302-SESVFU",   // recon key
    "ownershipGraph": {
      "owner": { "type": "checkout_session", "id": "scs-k6SuRsGazzxqKhdRXuQxAPbbxSg" }
    },
    "status": "completed"
  }
}
```

`300 / 30000` = exactly 1%. **Use `object.id` (`spm-…`) as the per-capture correction key — not
`event.id` (`wkd-…`), which is a webhook delivery id.**

---

## 3. The canonical waterfall

All amounts are **integer minor units of SLE** (1 Le = 100 minor units). Example: Le300.00
order = `30000`, merchant on a 2.5% plan (`250` bps), 1% provider fees.

| Step | Movement | Where the money is |
|---|---|---|
| Customer pays | `30000` charged — **no customer-facing surcharge**, the shopper pays exactly the cart total | — |
| Monime collects | `amount` 30000, `fees[].Base` 300 | escrow pool receives **29700** |
| Ledger on hold | debit `settlement_float` 29700 → credit `escrow_held` 29700 | matches the physical balance |
| Delivery confirmed | platform fee = `floor(250 × 30000 / 10000)` = **750** | |
| Ledger on release | debit `escrow_held` 29700 → credit `merchant_payable` 28950 + `platform_revenue` 750 | pool → **0** |
| Physical transfer | pool → merchant account 28950; pool → platform revenue 750 | |
| Merchant payout | 28950 sent, Monime payout fee 1% = 290 | merchant wallet **28660** |

**Where the Le300 ended up:** customer paid Le300.00 · merchant received Le286.60 ·
platform earned Le7.50 · Monime earned Le5.90.

As a formula:

```
gross                                          (shopper pays this exactly; includes sales tax)
  − providerFee   = sum(data.fees[].amount.value)        ← netted BEFORE settlement
  = arrived                                              → escrow pool / escrow_held
      (a partial refund subtracts refundedAmount from this too)
  − platformFee   = floor(feeBase × feeBps / 10000), capped at arrived
  = net                                                  → merchant_payable → merchant account
  − payoutFee     = fees[] on payout.completed, else floor(amount × payoutBps / 10000)
  = what the merchant actually receives                  → Payout.netAmount
```

---

## 4. Normative rules

| | |
|---|---|
| **R1** | Credit the net that arrived, never the gross you requested |
| **R2** | The platform-fee base is gross, minus refunds, minus tax — never the net |
| **R3** | Floor the fee per order, never on a summed gross |
| **R4** | One rate resolver; the refund reversal uses the rate actually charged |
| **R5** | `arrived === net + fee`; zero-amount lines are illegal |
| **R6** | Handle the two-event race with a per-capture correction |
| **R7** | The payout fee is not a ledger account |
| **R8** | Bound every payout by `min(ledger, providerBalance)`, and fail closed |
| **R9** | Released ≠ transferred |
| **R10** | Compute the split once, persist it, reuse it on retry |
| **R11** | Refund reversal is pro-rata against the fee the hold records having taken |
| **R12** | Record, never infer |
| **R13** | A recorded provider fee must not be write-only |
| **R14** | The amount you move must equal the amount you booked |

### R1 — Credit the net that arrived, never the gross you requested

```ts
const providerFee = input.providerFee ?? 0;
const arrived = input.amount - providerFee;   // escrow.service.ts, hold()
```

Every downstream figure derives from `arrived`. **Failure prevented:** the escrow pool
structurally drains, funded by undelivered orders' float.

### R2 — The platform-fee base is gross, minus refunds, minus tax — never the net

```ts
export function releasableGross(hold) {
  return Math.max(hold.amount - (hold.refundedAmount ?? 0), 0);
}

export function feeBase(hold) {
  const gross = releasableGross(hold);
  const tax = hold.taxAmount ?? 0;
  if (tax <= 0 || hold.amount <= 0) return gross;
  const releasableTax = Math.min(tax, Math.round((gross * tax) / hold.amount));
  return Math.max(gross - releasableTax, 0);
}
```

Three separate reasons, all load-bearing:

- **Not the net.** Basing your take rate on what survived the provider's cut silently couples
  your revenue to a supplier's pricing — a new Monime fee code would cut your margin. Gross is
  also computable at order time, which is what makes an expected-payout preview possible. (The
  difference is ~8 minor units on a Le300 order; the decision is made on coupling, not size.)
- **Minus refunds.** A partial refund leaves a hold releasable, so charging on the original
  gross bills the merchant for a sale that partly un-happened.
- **Minus tax.** Sales tax is the government's money passing through the merchant, never
  merchant revenue. Taking a percentage of it takes a cut of tax the merchant still owes in
  full. (Note: Monime charges its 1% on the tax-inclusive amount regardless — this rule governs
  only *your* fee.)

**Failure prevented:** overcharging on refunded value, and "the platform taxes your taxes".

### R3 — Floor the fee PER ORDER, never on a summed gross

Three Le1.00 orders at 350 bps is `3 × floor(3.5) = 9`, **not** `floor(10.5) = 10`. That is the
difference between showing a merchant Le2.88 and Le2.87.

Aggregate queries must reproduce the per-row floor. Prisma's `aggregate` cannot express it, so
`heldTotals()` uses raw SQL — and the `::numeric` cast is load-bearing, because Postgres
integer division *truncates* rather than floors:

```sql
coalesce(sum(floor(greatest(
  greatest("amount" - "refundedAmount", 0)
    - CASE WHEN "amount" > 0
        THEN least("taxAmount",
                   round(greatest("amount" - "refundedAmount", 0)::numeric
                         * "taxAmount" / "amount"))
        ELSE 0 END,
  0)::numeric * ${feeBps}::int / 10000)), 0)::bigint AS platform_fee
```

**Failure prevented:** the dashboard tile and the ledger disagree by a minor unit per order.

### R4 — One rate resolver, and the refund reversal must use the rate actually charged

The release path resolved the store's *plan* rate; the refund clawback read a process-wide env
constant. On a 3.5% store: 3 minor units taken, 2 reversed — keeping a slice of a refunded
order. On a 1% tier it over-reverses, crediting back revenue never charged.

See R11 for the correct reversal.

### R5 — `arrived === net + fee`, and zero-amount lines are illegal

```ts
fee = Math.floor((feeBase(hold) * feeBps) / 10000);
const arrived = heldNet(hold);
if (fee > arrived) fee = Math.max(arrived, 0);   // a heavily-refunded order can leave less
                                                 // behind than the fee on remaining gross
net = arrived - fee;
```

Omit any zero-amount entry (a tiny order can round the fee to 0), and skip the posting entirely
when `arrived === 0` — a 99-of-100 refund leaves nothing to move but does not flip the hold to
`refunded`, so it is still "releasable". Mark it released anyway so it stops being retried.

### R6 — Handle the two-event race with a per-capture correction

When the fee-bearing event arrives *second*, do not return early. Post the difference:

```ts
if (payment.status === 'held' || payment.status === 'released') {
  if (settlement && settlement.providerFee > 0) {
    const applied = await this.escrow.applyProviderFee({
      storeId, orderId,
      providerFee: settlement.providerFee,
      monimeRef: settlement.monimeRef,     // Monime's spm-… payment id
    });
    if (applied) await this.repo.recordLateProviderFee(payment.id, { ... });
  }
  return;
}
```

The correction is the exact mirror of `hold()`'s over-credit, idempotency-keyed
`escrow-provider-fee:${orderId}:${monimeRef}`:

| Hold status | Debit | Credit |
|---|---|---|
| `held` | `escrow_held` (store) | `settlement_float` (platform) |
| `released` / `refunded` | `merchant_payable` (store) | `settlement_float` (platform) |

If the merchant has already withdrawn (`payable < providerFee`), **do not post** — correcting
would drive their balance negative for money that is genuinely gone. Log it and emit an audit
event for an operator instead.

Two non-negotiables:

- **Key per capture, not per order.** A pre-order settles across several captures, each with its
  own independently-rounded cut; an order-scoped key swallows every correction after the first.
- **Mirror onto the payment row only when the ledger actually moved.** `applyProviderFee`
  returns `false` on a replay; incrementing `providerFeeTotal` unconditionally lets a replayed
  webhook make the payment claim the fee twice.

**Both orderings must converge on identical balances.** That is the test.

### R7 — The payout fee is NOT a ledger account

```ts
const fee = providerFee ?? estimatePayoutFee(payout.amount);
// ledger posts payout.amount IN FULL:
//   debit merchant_payable(store) amount · credit settlement_float(platform) amount
await this.repo.setCompleted(payout.id, {
  fee,
  netAmount: Math.max(payout.amount - fee, 0),
});
```

`amount` really did leave the settlement account (net to the merchant, fee to Monime), and the
fee was **never platform money** — it comes out of a balance the merchant already owned. Adding
a `provider_fee` account kind would break the identity your ledger report asserts:

```
settlement_float === escrow_held + merchant_payable + platform_revenue
```

Record it as columns on the payout row instead. Write them at **completion**, not at request
time, where the figure is only an estimate.

### R8 — Bound every payout by `min(ledger, providerBalance)`, and fail closed

Every merchant figure derived from your own ledger is yours to get wrong and an attacker's to
edit. The provider's balance is not.

```ts
private async providerAvailable(financialAccountId: string): Promise<number> {
  const account = await this.monime.getFinancialAccount(financialAccountId);
  const balance = account.balance?.available;
  if (!balance || typeof balance.value !== 'number') {
    throw new ValidationError('Could not confirm your balance with the payment provider.');
  }
  if (balance.currency !== 'SLE') {
    throw new ValidationError(`Account is held in ${balance.currency}, not SLE`);
  }
  return balance.value;
}
```

- **Audit divergence in both directions.** Under = money we believe we hold isn't there.
  Over = money arrived we never booked. Cap at the ledger in the second case, because paying out
  unbooked money is just a different hole.
- **Fail closed.** An unreadable, absent or non-SLE balance refuses the payout. This costs no
  availability: a Monime you can't `GET` from is one you can't `createPayout` against either,
  and failing open lets anyone who can break the read switch the guard off.
- **Never compare currencies implicitly.** A foreign-currency balance measured against SLE minor
  units is arithmetic nonsense, not a small discrepancy.
- **Put the gate at the single choke point** both auto-approve and operator-approve paths pass
  through, and **before** the "your money is on its way" event fires. That event must never be
  said about a payout you are about to refuse.

This is not a defence against a compromised app server, which holds this very token.

### R9 — Released ≠ transferred

Selling is typically not KYC-gated while payouts are, so **selling before verifying is the
normal onboarding path**, not a rare edge case. Such a release books `merchant_payable`
correctly but cannot move the cash — there is no provider account to move it to.

- Add a `netTransferredAt` timestamp **distinct from `releasedAt`**. `releasedAt` records the
  ledger posting; `netTransferredAt` records the money physically arriving.
- **Stamp it after the transfer**, never alongside the ledger post — so an unstamped released
  hold is an unambiguous "the cash is still in the pool".
- Index `(status, netTransferredAt)` and run a sweep over
  `status = released AND net > 0 AND netTransferredAt IS NULL`, oldest first.
- **Trigger it twice**: on merchant provisioning (so a newly verified merchant can withdraw at
  once, wrapped so a sweep failure cannot fail provisioning), and periodically — more often than
  the payout batch, since this is money the merchant is owed but cannot reach.
- Per-row `try/catch`: one store's failure must not strand the rest of the batch.
- **Do not backfill the stamp.** The errors are asymmetric — stamping too many marks a genuinely
  stranded transfer as done and the money is lost to manual forensics, while stamping too few
  just replays a completed transfer for one idempotent API call. And the two are
  indistinguishable from the data. Letting the sweep replay is self-correcting; a backfill guess
  is not.

**Failure prevented:** money sits in the pool while the books say the merchant holds it, and the
merchant meets it as an opaque insufficient-funds error at payout — after being told their money
was on its way.

### R10 — Compute the split once, persist it, reuse it on retry

```ts
if (hold.status === 'held') {
  // compute fee/net from the store's CURRENT plan rate, persist via markReleased(orderId, fee, net)
} else {
  fee = hold.fee;      // already released: reuse the persisted split
  net = hold.net;
}
// then (re)run the physical transfers under stable idempotency keys:
//   `xfer-net:${orderId}`, `xfer-fee:${orderId}`
```

A plan change between attempts must never make the physical transfers drift from the ledger
posting. This is also what makes R9's sweep safe: replaying a completed transfer is a free
no-op.

Flip the hold to `released` **immediately after** the posting, so a concurrent refund routes to
`merchant_payable` rather than the now-zero escrow bucket.

### R11 — Refund reversal is pro-rata against the fee the hold RECORDS having taken

```ts
const feePortion =
  fromEscrow || hold.amount <= 0
    ? 0                                              // pre-delivery: no fee was taken yet
    : Math.floor((hold.fee * gross) / hold.amount);  // derived from what was ACTUALLY posted
const netPortion = gross - feePortion;
```

Never recompute from a rate. A full refund then reverses exactly what was posted, a partial
reverses in proportion, and both sum to the refunded gross.

| Case | Ledger entries |
|---|---|
| Pre-delivery (`held`) | credit `settlement_float` `gross`; debit `escrow_held` `gross`. **No `platform_revenue` line** — the fee has not been taken. |
| Post-delivery | credit `settlement_float` `gross`; debit `merchant_payable` `netPortion`; debit `platform_revenue` `feePortion` |

Bound refunds: `remaining = hold.amount − hold.refundedAmount`. If the merchant has already
withdrawn and `payable < netPortion`, create a flagged pending refund plus an audit event rather
than posting a negative balance.

### R12 — Record, never infer

Provider fee, payout fee, and provider references are **columns**, not derivations. Two reasons:
reconciliation has to compare like with like at zero tolerance (internal books saying 30,000
against a settlement statement saying 29,700 flags *every row, forever*), and a merchant must
never be told a number they did not receive.

Recording is not enough on its own — see R13.

### R13 — A recorded provider fee must not be write-only

Storing `providerFee` and then computing every downstream figure from a hardcoded rate is the
same bug wearing a disguise: the number that reflects reality sits in the database while the
number that drives the money is an assumption. Two consequences to design against:

- **The assumed rate will be wrong eventually.** Provider pricing is not guaranteed uniform
  across rails, and may carry caps, floors, or per-channel rates. Anything that hardcodes "1%"
  in more than one place will drift; hardcoding it in the UI *and* the server guarantees the two
  disagree.
- **Analytics computed from the assumption are fiction.** If your take-rate / processor-cost
  dashboards sum the modelled fee rather than the recorded one, they will look healthy while the
  float drains.

Rule: the recorded fee drives the ledger, the payout, the reconciliation, and the reporting. The
configured rate is a **fallback for when the provider didn't report one**, and nothing else.

### R14 — The amount you move must equal the amount you booked

Every physical transfer must be the same figure the ledger posted for it. It is easy to compute
a correct net, write it to the ledger, and then transfer a different variable — typically the
gross, because that is the one already in scope. The books then say one thing while the money
does another, and the discrepancy is invisible until the source account runs dry.

Assert it: `arrived === net + fee`, and the transfer amount is read from the **persisted split**
(R10), never recomputed at the call site.

---

## 5. Data model

Schema below is the reference implementation's. Note that with `db push` (no migration files)
every new column must be nullable or carry a `@default` — all of these do, and pre-existing rows
reading `0` collapses to exactly the previous behaviour.

```prisma
model EscrowHold {
  // GROSS the shopper paid, minor units. Stays the platform-fee base and the
  // ceiling for refunds — a refunded shopper gets back what they paid.
  amount           Int
  // Sales tax contained in `amount`, accumulated alongside it (a pre-order's
  // two captures each contribute their share). Excluded from the fee base.
  taxAmount        Int          @default(0)
  // What Monime kept before settlement. `amount - providerFee` is what the
  // escrow pool PHYSICALLY received and therefore all that can be paid out.
  providerFee      Int          @default(0)
  fee              Int          @default(0)  // platform fee, computed once at release
  net              Int          @default(0)  // heldNet - fee, paid to the merchant
  refundedAmount   Int          @default(0)  // cumulative GROSS refunded
  status           EscrowStatus @default(held)
  releasedAt       DateTime?                 // the LEDGER posting
  netTransferredAt DateTime?                 // the money PHYSICALLY arriving (R9)

  @@index([storeId, status])
  @@index([status, netTransferredAt])        // drives the stranded-transfer sweep
}

model Payout {
  amount    Int              // minor units — debited from merchant_payable IN FULL
  fee       Int @default(0)  // what the provider kept; comes OUT of `amount`
  netAmount Int @default(0)  // what the merchant actually received
}

model Payment {
  amount           Int              // order total, minor units
  taxAmount        Int @default(0)  // sales tax contained in `amount`
  providerFeeTotal Int @default(0)  // cumulative across every capture
  monimeRef        String?          // Monime's payment id (spm-…)
  providerRef      String?          // financialTransactionReference
}
```

Net is **derived, never stored** on `Payment` (`receivedAmount − providerFeeTotal`) so the two
cannot drift apart. On `EscrowHold` the split *is* stored, deliberately — see R10.

The hold row is **additive**: a pre-order's deposit and balance installments increment `amount`,
`taxAmount` and `providerFee` on **one** row, because release always reads a single row. Split
the order's tax per capture:

```ts
function taxShare(payment, capturedAmount) {
  if (!payment.taxAmount || payment.amount <= 0) return 0;
  return Math.min(
    payment.taxAmount,
    Math.round((capturedAmount * payment.taxAmount) / payment.amount),
  );
}
```

Sending the whole order's tax on both installments would double-count it.

---

## 6. Ledger postings — complete list

Account kinds: `settlement_float` (platform), `escrow_held` (per store), `merchant_payable`
(per store), `platform_revenue` (platform).

**Identity:** `settlement_float === escrow_held + merchant_payable + platform_revenue`.

| Event | source / idempotency key | Entries |
|---|---|---|
| **Hold** (per capture) | `order` / `escrow-hold:${orderId}` (or `:${monimeRef}` per capture) | debit `settlement_float` `arrived`; credit `escrow_held` `arrived` |
| **Late provider fee, still held** | `adjustment` / `escrow-provider-fee:${orderId}:${monimeRef}` | debit `escrow_held` `providerFee`; credit `settlement_float` `providerFee` |
| **Late provider fee, released/refunded** | same key | debit `merchant_payable` `providerFee`; credit `settlement_float` `providerFee` — skipped + audited if payable can't cover |
| **Release** | `order` / `escrow-release:${orderId}` | debit `escrow_held` `arrived`; credit `merchant_payable` `net`; credit `platform_revenue` `fee`. Skipped entirely when `arrived === 0` |
| **Refund, pre-delivery** | `refund` / `refund:${refundId}` | credit `settlement_float` `gross`; debit `escrow_held` `gross` |
| **Refund, post-delivery** | same | credit `settlement_float` `gross`; debit `merchant_payable` `netPortion`; debit `platform_revenue` `feePortion` |
| **Payout completed** | `payout` / `payout:${payoutId}` | debit `merchant_payable` `amount`; credit `settlement_float` `amount` — **full amount, fee NOT in the ledger** (R7) |
| **Payout failed** | — | no movement — the money never left |

**The ledger post is the idempotency gate.** Check it *before* the additive hold write, so a
replayed webhook can never double-count.

Physical Monime transfers use their own stable keys — `xfer-net:${orderId}`,
`xfer-fee:${orderId}` — which is what makes replay safe.

---

## 7. Rounding and units

| Rule | Why |
|---|---|
| All money is **integer minor units**. No floats persisted anywhere. | |
| Fees use **`Math.floor`** | Floored in the merchant's favour. A quote that rounds up promises the merchant less than they get; one that rounds down, more. |
| Floor **per order**, never on an aggregate | R3 |
| Prorations use **`Math.round`, then `Math.min`** with the whole | `taxShare`, `feeBase`'s `releasableTax` — a proration must never exceed the total it divides |
| SQL aggregates need **`::numeric`** before division | Postgres integer division truncates, not floors |
| Zero-amount ledger lines are **illegal** — omit them | A tiny order rounds its fee to 0 |
| `bigint` → `Number()` at the raw-SQL boundary | |
| **Validate currency, never assume it** | Comparing a non-SLE balance against SLE minor units is nonsense, not a small error |

---

## 8. Display rules

Computing correctly and then printing one netted number reproduces the bug at the UI layer. A
merchant with three Le1.00 sales was shown **"Escrow Balance Le 3"** when Le2.88 was the real
figure.

### The API must itemise every deduction

`GET /stores/:storeId/wallet` returns:

```jsonc
{
  "currency": "SLE",
  "available": 0,             // ledger merchant_payable, CAPPED at the provider balance
  "escrowHeld": 0,            // ledger escrow_held (physical — already net of Monime)
  "payoutMethod": null,
  "minPayout": 0,
  "nextPayoutEstimate": "...",
  "estimatedAmount": 0,

  // --- Fee breakdown (merchant-facing) ---
  "escrowGross": 0,           // shopper-paid gross on still-held orders, less refunds
  "escrowProviderFee": 0,     // what the provider kept before the money reached the pool
  "feeBps": 250,              // the store's plan rate — so no UI hardcodes a percentage
  "estimatedPlatformFee": 0,  // what those orders will incur at release
  "escrowTax": 0,             // sales tax inside escrowGross, excluded from the fee base
  "escrowNetEstimate": 0,     // max(gross − providerFee − platformFee, 0)
  "payoutFeeBps": 100         // so the payout quote is honest up front
}
```

Plus a per-order waterfall, `GET /stores/:storeId/orders/:orderId/escrow`:
`{ status, gross, providerFee, platformFee, taxAmount, net, feeBps, refundedAmount }`.

### The rules

1. **Never surface a single netted number.** Ship the itemised set so every deduction can be
   named. A UI that receives only a balance can only print the balance.
2. **Never hardcode a percentage in the UI.** Send `feeBps` and `payoutFeeBps` down; the
   frontend renders whatever it is told.
3. **Forecast figures come from the hold rows, not the ledger** — those rows are what the
   release path reads, so they are what the merchant will actually be paid. (The two agree
   except on refunded orders, where the ledger carries a provider-fee gap that belongs to the
   platform, not to the merchant's forecast.)
4. **Every preview must use the same base and the same floor as the authoritative path.** In the
   reference implementation *three* places compute the platform fee — the release path
   (authoritative), the per-order preview, and the dashboard tile's aggregate SQL — and all
   three must agree to the minor unit, or the UI quotes a fee that is never charged.
5. **Once released, return the persisted split verbatim.** A plan change afterwards must not
   rewrite history.
6. **The displayed `available` is capped at the provider balance**, cached ~60s, and **fails
   open** — deliberately softer than R8's gate. An optimistic *number* is harmless because the
   authoritative, uncached, fail-closed check still runs before any money moves; a page that
   won't render because the provider is slow is a real outage.
7. **Payout quotes read "requested X · fee Y · you receive Z"** — never a silent deduction. Say
   plainly that mobile-money providers charge on every withdrawal, and that the exact figure is
   confirmed on settlement.
8. **Format at the edge only.** Amounts travel as integer minor units end to end; convert to
   `Le x.xx` in the render layer. A client that redoes the bps arithmetic on **major** units
   will disagree with the server on almost every amount — `round(100 × 260 / 10000)` is `3` in
   whole Leones but `Le 2.60` in minor units, and any fee under half a Leone displays as zero.
   If a client must preview a fee, it does the arithmetic in minor units with the same
   `Math.floor`.
9. **Fix the money formatter.** `maximumFractionDigits: 2` with
   `minimumFractionDigits: 0` renders `Le 103.6` and `Le 1`. Money is always two decimals.
10. **Show the unverified state honestly.** Before KYC there is no provider account: render the
    wallet with zeros plus a "verify to get paid" prompt, not an error.

---

## 9. Dev / fake mode is part of the fix

**This is the root cause of the defect shipping unnoticed.** The fake provider fired only
`checkout_session.completed`, so local dev could never observe the provider's cut, and every
merchant-facing figure read as gross — correctly, given the data it was fed.

A fake provider mode must:

- Emit **both** events, in production order, for every payment.
- Carry a synthetic `fees[]` array at a configurable rate:
  `providerFee = Math.floor((gross * FAKE_FEE_BPS) / 10000)`, default 100 bps.
- Use a realistic `object.id` (`spm-fake-…`), **unique per capture** — a pre-order paid in two
  installments is charged twice and each rounds independently.
- Expose a switch to **flip the event order** (e.g. `?order=payment-first`) so the race in R6 is
  exercised from both sides.
- Expose a settable fake provider **balance**, so R8's divergence path can be rehearsed by
  setting it below `merchant_payable`.

---

## 10. Configuration

| Var | Default | Meaning |
|---|---|---|
| `PLATFORM_FEE_BPS` | `250` | Fallback platform rate when the plan service is unreachable |
| `MONIME_PAYOUT_FEE_BPS` | `100` | Payout-fee fallback when `payout.completed` omits `fees[]` |
| `MONIME_FAKE_FEE_BPS` | `100` | Synthetic collection fee in dev |
| `MONIME_FAKE_ACCOUNT_BALANCE` | `MAX_SAFE_INTEGER` | Fake provider balance; lower it to rehearse divergence |
| `ESCROW_SWEEP_INTERVAL_MS` | `300000` (5 min) | Stranded-transfer sweep — deliberately more frequent than payouts |
| `PAYOUT_INTERVAL_MS` | `900000` (15 min) | Scheduled payout batch |

The live rate is resolved per store from the billing/plan service and cached ~60s; the env var is
a fallback only. Rates in the reference implementation: 5.0% / 3.5% / 2.5% / 1.5% / 1.0% by plan.

### Audit events worth emitting

| Action | Emitted when |
|---|---|
| `payment.provider_fee_unrecoverable` | A late fee correction can't be posted — the merchant already withdrew |
| `payout.balance_divergence` | Ledger and provider balance disagree, in either direction |
| `payout.insufficient_provider_balance` | The fail-closed gate refused a payout |
| `refund.clawback_required` | A refund exceeds what the merchant still has payable |

---

## 11. Test checklist

Each of these caught a real defect. Treat a missing test as a missing fix.

1. **The pool nets to zero.** 30000 gross / 300 provider fee / 750 platform fee →
   `escrow_held` 29700 out, `merchant_payable` 28950 + `platform_revenue` 750 in.
2. **Both webhook orderings converge on identical balances.** Fee-first and session-first must
   produce byte-identical ledger totals.
3. **A replayed webhook cannot charge the fee twice** — assert the payment's cumulative provider
   fee is incremented only when the ledger post actually moved.
4. **Per-order floor.** Three 100-unit orders at 350 bps → `platform_revenue` 9 (not 10),
   `merchant_payable` 288, `escrow_held` 297, and `297 − 9 === 288`.
5. **Partial-refund release.** Le1.00 refunded Le0.40 must transfer 59, not 99.
6. **Full refund reverses exactly what was posted.** Hold `{ amount:100, fee:3 }` → revenue
   debit 3, payable debit 97, float credit 100 — even when the env-constant rate says 2.
7. **Pre-delivery refund posts no `platform_revenue` line at all.**
8. **A retried release reuses the persisted split**, and does not recompute after a plan change.
9. **Payout is refused when the provider balance is short**, before the "on its way" event
   fires, and refused when the balance is unreadable or in the wrong currency.
10. **`provider_fee` never appears as a ledger account kind** on the payout posting.
11. **A stranded transfer settles on sweep**, and a completed one replays as a free no-op.
12. **Tax exclusion.** `amount 10000, taxAmount 1304, feeBps 250` → fee 217 (not 250);
    a legacy row with no `taxAmount` → fee 250, byte-identical to pre-tax behaviour.
13. **The aggregate SQL matches the TypeScript to the minor unit.** Check it against a real
    Postgres, not by reading it.
14. **The transfer amount equals the booked amount.** Assert that what the provider was asked to
    move is read from the persisted split, not recomputed — the R14 regression is silent
    otherwise.
15. **A reported fee that differs from the configured rate wins.** Feed a settlement whose
    `fees[]` disagrees with the configured bps and assert the recorded value, not the assumption,
    drives the ledger and the payout.

---

## 12. Porting checklist

Ordered so the codebase stays coherent at every step. Each step names the reference file to copy
the approach from.

| # | Step | Reference |
|---|---|---|
| 1 | Add the columns: hold `taxAmount`/`providerFee`/`fee`/`net`/`refundedAmount`/`netTransferredAt` + `(status, netTransferredAt)` index; `Payout.fee`/`netAmount`; payment `providerFeeTotal` + provider refs. All defaulted so old rows collapse to prior behaviour. | `apps/payment/prisma/schema.prisma` |
| 2 | Add the provider types and a `sumMonimeFees()` helper — tolerant of a missing array (reads as "nothing deducted", never `NaN`), used by **both** payments and payouts. | `shared/monime/monime.types.ts` |
| 3 | Fix webhook parsing: handle `payment.processing_completed`, resolve the session from `ownershipGraph.owner`, sum `data.fees[]`, capture `financialTransactionReference` / `channel.reference`, and carry `object.id` (`spm-…`) through as the per-capture ref. | `webhook/webhook.service.ts` |
| 4 | Credit `arrived = amount − providerFee` at hold, with the ledger post as the idempotency gate before the additive row write. Add `taxShare()` per capture. | `escrow/escrow.service.ts`, `payment/payment.service.ts` |
| 5 | Add the late-correction path for the two-event race, keyed per capture, mirroring onto the payment row only when the ledger moved. | `escrow/escrow.service.ts` → `applyProviderFee()` |
| 6 | Add `heldNet` / `releasableGross` / `feeBase`; rewrite release to use them, cap the fee at `arrived`, omit zero lines, and persist the split. | `escrow/escrow.repository.ts`, `escrow.service.ts` |
| 7 | Fix the refund reversal to be pro-rata against the recorded fee. | `refund/refund.service.ts` |
| 8 | Add the payout fee (webhook `fees[]`, else floored bps fallback) as columns — **not** ledger entries — and the `min(ledger, provider)` fail-closed balance gate at the dispatch choke point, before the initiated event. | `payout/payout.service.ts` |
| 9 | Add `netTransferredAt` stamping after the transfer, `findStranded`, `sweepStranded`, and both triggers (on provisioning + periodic). No backfill. | `escrow.service.ts`, `events/merchant-verified.consumer.ts`, `payout/jobs/` |
| 10 | Itemise the wallet API and add the per-order waterfall endpoint; make the aggregate SQL mirror `feeBase` exactly. | `payout/finance.controller.ts`, `escrow.repository.ts` → `heldTotals()` |
| 11 | Update every merchant-facing surface to render the breakdown, and never a lone balance. | `merchant-dashboard/components/payouts/`, `components/dashboard/payments/` |
| 12 | Fix fake/dev mode to emit both events with `fees[]`, per-capture ids, an order flip, and a settable balance. | `webhook/fake-monime.controller.ts` |
| 13 | Re-check reconciliation tolerance now that fees are recorded, and feed the captured provider refs in as match keys. | `reconciliation/matcher.service.ts` |

---

## 13. Appendix — applying this to `ib4me`

`~/Dev/ib4me` is the second Monime integration carrying this bug class. It is a Next.js 15 /
MongoDB donation platform, so the shapes differ — there is no escrow layer, and the money path is
donor → **platform** financial account → internal transfer → **campaign** financial account →
payout. Structurally that is the same three hops as hold → release → payout, and every rule above
maps onto it. Findings from an audit of that codebase, against the rules:

| Rule | What `ib4me` does today |
|---|---|
| **R14** | `DonationService.ts:482` and `app/api/donations/[id]/process-transfer/route.ts:117` transfer `donation.amount.minor` — the **gross** — while the ledger books `campaignReceivesMinor`. In fee-from-donation mode (the default when the donor-choice flag is on) the platform transfers out more than it received and earns nothing. **This is the direct, compounding cash loss — fix it first.** |
| **R1 / R13** | Monime's cut is a hardcoded `BASE_FEE_BPS = 100` in five places (`SettingService.ts:553`, `lib/feeDisplay.ts:4`, `app/pricing/page.tsx:22`, `DonateClient.tsx:83`, `FeeSettings.tsx:71`). The real value **is** stored on `fees.paymentFeeMinor` from `payment.completed` — and then never read by any calculation. `DonationRepository.ts:413` even reports processor fees from the assumption. |
| **§2, "total collected"** | The 1% is applied to `donationAmountMinor`, but Monime charges on `totalChargedMinor`. With a donor-covered fee that is short by 1% of the surcharge on every donation. |
| **R6** | `checkout_session.completed` (`webhook/route.ts:158`) calls `markPaymentReceived` with **no** `fees` key, writing `paymentFeeMinor = 0` — so the fee-less event clobbers the real fee whenever it lands second. There is no correction path. Also: webhook idempotency is a process-local `Set`, useless across serverless instances, while an unused `WebhookEvent` model already exists. |
| **R7 / R12** | No payout fee exists anywhere. `Payout` has no `feeMinor` / `netAmountMinor`. `MonimePayoutResponse.fees` is declared and never read. |
| **R8** | Balance is read live from Monime (good), but `assertSufficientBalance` leaves no headroom for the payout fee. The only protection is a client-side `WITHDRAWAL_BUFFER_PERCENT = 0.99` in `WithdrawalForm.tsx`, which `app/api/payouts/route.ts` does not enforce — trivially bypassed by posting directly. |
| **R11** | `refundDonation` (`DonationService.ts:1064`) moves no money at all (`// TODO: Implement actual refund`), reverses no fee, decrements `totals.raisedMinor` by the gross while it was credited with the net, and writes `refundReason`/`refundedBy`/`refundedAt` that are not in the schema so Mongoose discards them silently. |
| **§6 ledger** | `platform_receipt` is booked at gross rather than what settled, `platform_fee` books Monime's share as platform revenue, and there is no processor-fee leg — there is no `processor_fee` ref type in `models/LedgerEntry.ts`. The ledger cannot balance by construction. |
| **§8 display** | `DonateClient.tsx:74-96` recomputes the fee in **whole Leones**: a Le 100 donation displays "total Le 104" while the server charges Le 103.60, and any donation under Le 50 shows a zero platform fee. |
| **§7 units** | `PayoutService.ts:493` hardcodes `currency: "UGX"` in the payout ledger entry. |

Two structural notes for the port:

- **Consolidate the fee models.** `ib4me` currently has three: `calculateDonationFees` (live),
  the legacy `platformFeeBps` / `mobileMoneyFeeBps` on `IFeeSetting` (still writable from a
  second admin screen, no effect on charges), and a separate one for tips in `TipService.ts`
  that is the only path actually subtracting Monime's reported fee. One engine, one base.
- **Escrow is optional; the accounting is not.** `ib4me` has no held-funds concept, so R9's
  stranded-transfer sweep has no direct analogue — but the platform account *is* a de-facto
  holding account with no reconciliation against the ledger, which is the same exposure. R14 and
  R1 are the load-bearing rules there.

---

## 14. What this spec does not cover

Three things are deliberately out of scope. They are factual limitations of the reference
implementation, recorded so nobody assumes they were handled:

1. **The refund provider-fee gap.** A full refund returns the shopper the gross, while only
   `gross − providerFee` ever arrived, and the refund is sent as a fresh payout, incurring a
   second provider fee. Roughly 2% of a refunded order has no assigned owner. Whose balance
   absorbs it is a policy question — see `docs/payment-fees-design-note.md` §6.
2. **Polled settlement still over-credits.** A payment settled by the polling reconciler rather
   than the webhook carries no `fees[]`, so escrow over-credits by the provider's cut until
   reconciled. Log it explicitly where it happens.
3. **Effective merchant cost exceeds the advertised plan rate**, because the provider's two 1%
   fees sit on top of it. That is a pricing decision, not an accounting one.

### Known outstanding defect in the reference implementation

`apps/payment/src/refund/refund-admin.service.ts:17,232` — the **operator-approved clawback path
still violates R4/R11**:

```ts
const FEE_BPS = Number(process.env.PLATFORM_FEE_BPS ?? 250);
const feePortion = Math.floor((gross * FEE_BPS) / 10000);
```

This is exactly the pattern `refund.service.ts` was fixed away from. On a 350 bps store an
operator clawback reverses 250 bps and the platform keeps a slice of a refunded order. It should
read `Math.floor((hold.fee * gross) / hold.amount)` like the main refund path. Do not copy this
file's approach when porting.
