import { notificationRepository } from "../repositories";
import { INotification } from "../models/Notification";

export class NotificationService {
  async queue(
    input: Pick<INotification, "recipient" | "channel" | "template"> & {
      payload?: INotification["payload"];
    }
  ): Promise<INotification> {
    return notificationRepository.create({
      recipient: input.recipient,
      channel: input.channel,
      template: input.template,
      payload: input.payload ?? null,
      status: "queued",
    } as unknown as Partial<INotification>);
  }
}

export const notificationService = new NotificationService();
