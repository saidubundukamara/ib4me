import { BaseRepository } from "./BaseRepository";
import WebhookEvent, { IWebhookEvent } from "../models/WebhookEvent";

export class WebhookEventRepository extends BaseRepository<IWebhookEvent> {
  constructor() {
    super(WebhookEvent);
  }

  async findByIdempotencyKey(key: string): Promise<IWebhookEvent | null> {
    return this.findOne({ idempotencyKey: key } as never);
  }
}

export const webhookEventRepository = new WebhookEventRepository();
