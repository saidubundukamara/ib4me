import { webhookEventRepository } from "../repositories";
import { IWebhookEvent } from "../models/WebhookEvent";

export class WebhookEventService {
  async record(
    input: Pick<IWebhookEvent, "provider" | "eventType"> &
      Partial<
        Pick<IWebhookEvent, "idempotencyKey" | "payloadRef" | "relatedIds">
      >
  ): Promise<IWebhookEvent> {
    // Idempotency
    if (input.idempotencyKey) {
      const existing = await webhookEventRepository.findByIdempotencyKey(
        input.idempotencyKey
      );
      if (existing) return existing;
    }
    return webhookEventRepository.create({
      provider: input.provider,
      eventType: input.eventType,
      idempotencyKey: input.idempotencyKey ?? null,
      payloadRef: input.payloadRef ?? null,
      receivedAt: new Date(),
      processedAt: null,
      status: "received",
      relatedIds: input.relatedIds ?? null,
    } as unknown as Partial<IWebhookEvent>);
  }
}

export const webhookEventService = new WebhookEventService();
