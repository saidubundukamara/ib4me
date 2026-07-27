import { BaseRepository } from "./BaseRepository";
import WebhookEvent, { IWebhookEvent } from "../models/WebhookEvent";

export class WebhookEventRepository extends BaseRepository<IWebhookEvent> {
  constructor() {
    super(WebhookEvent);
  }

  async findByIdempotencyKey(key: string): Promise<IWebhookEvent | null> {
    return this.findOne({ idempotencyKey: key } as never);
  }

  /**
   * Atomically claim a webhook delivery. Returns `true` if THIS caller owns it and should
   * do the work, `false` if it has already been processed.
   *
   * Replaces a process-local `Set`, which on serverless is per-instance and lost on every
   * cold start — so it never deduplicated anything across the instances Monime's retries
   * actually land on.
   *
   * The claim is a single upsert rather than a read-then-write, so two deliveries racing
   * on the same key cannot both win: exactly one inserts, the other either matches the
   * `processed` guard or loses on the unique index.
   *
   * A previously-`failed` row stays claimable on purpose — when we return 500, Monime
   * retries, and that retry must be allowed to succeed.
   *
   * This dedups *delivery*. It does not replace the ledger's own idempotency key, which
   * dedups the *business effect* across redeliveries that arrive with a fresh delivery id
   * (MONIME-FEE-MODEL.md §2 — key on `object.id`, not `event.id`).
   */
  async claim(
    idempotencyKey: string,
    provider: string,
    eventType: string
  ): Promise<boolean> {
    await this.ensureConnection();
    try {
      const prior = await this.model
        .findOneAndUpdate(
          { idempotencyKey, status: { $ne: "processed" } },
          {
            $setOnInsert: {
              idempotencyKey,
              provider,
              eventType,
              receivedAt: new Date(),
              status: "received",
            },
            $inc: { attempts: 1 },
          },
          { upsert: true, new: false }
        )
        .exec();

      // `null` prior document means the upsert inserted it — we own the claim. A non-null
      // prior means a row existed in `received`/`failed`; we take it over and retry.
      return prior === null || prior.status === "failed" || prior.status === "received";
    } catch (error) {
      // Duplicate key means a concurrent delivery inserted first, or a `processed` row
      // already exists and the filter excluded it from the upsert. Either way: not ours.
      if ((error as { code?: number })?.code === 11000) return false;
      throw error;
    }
  }

  async markProcessed(
    idempotencyKey: string,
    relatedIds?: { donationId?: unknown; campaignId?: unknown }
  ): Promise<void> {
    await this.updateOne(
      { idempotencyKey } as never,
      {
        $set: {
          status: "processed",
          processedAt: new Date(),
          ...(relatedIds ? { relatedIds } : {}),
        },
      } as never
    );
  }

  async markFailed(idempotencyKey: string, error: string): Promise<void> {
    await this.updateOne(
      { idempotencyKey } as never,
      { $set: { status: "failed", lastError: error.slice(0, 1000) } } as never
    );
  }
}

export const webhookEventRepository = new WebhookEventRepository();
