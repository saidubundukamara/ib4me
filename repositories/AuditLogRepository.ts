import mongoose from "mongoose";
import { BaseRepository } from "./BaseRepository";
import AuditLog, { IAuditLog } from "../models/AuditLog";

export class AuditLogRepository extends BaseRepository<IAuditLog> {
  constructor() {
    super(AuditLog);
  }

  async listByTarget(
    type: string,
    id?: mongoose.Types.ObjectId | null
  ): Promise<IAuditLog[]> {
    return this.findMany({ target: { type, id: id ?? null } } as never, {
      query: { sort: { at: -1 } },
    });
  }
}

export const auditLogRepository = new AuditLogRepository();
