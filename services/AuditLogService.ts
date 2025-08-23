import mongoose from "mongoose";
import { auditLogRepository } from "../repositories";
import { IAuditLog } from "../models/AuditLog";

export class AuditLogService {
  async record(
    entry: Pick<IAuditLog, "actor" | "action" | "target"> &
      Partial<Pick<IAuditLog, "diff" | "ip" | "userAgent">>
  ): Promise<IAuditLog> {
    return auditLogRepository.create({
      actor: entry.actor,
      action: entry.action,
      target: entry.target,
      diff: entry.diff ?? null,
      ip: entry.ip ?? null,
      userAgent: entry.userAgent ?? null,
      at: new Date(),
    } as unknown as Partial<IAuditLog>);
  }

  async listByTarget(
    type: string,
    id?: mongoose.Types.ObjectId | null
  ): Promise<IAuditLog[]> {
    return auditLogRepository.listByTarget(type, id);
  }
}

export const auditLogService = new AuditLogService();
