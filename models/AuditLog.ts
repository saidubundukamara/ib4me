import mongoose from "mongoose";

export interface IAuditActor {
  userId?: mongoose.Types.ObjectId | null;
  role?: string | null;
}

export interface IAuditTarget {
  type: string;
  id?: mongoose.Types.ObjectId | null;
}

export interface IAuditLog extends mongoose.Document {
  actor: IAuditActor;
  action: string;
  target: IAuditTarget;
  diff?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
  at: Date;
}

const auditLogSchema = new mongoose.Schema<IAuditLog>(
  {
    actor: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      role: { type: String, default: null },
    },
    action: { type: String, required: true, index: true },
    target: {
      type: { type: String, required: true },
      id: { type: mongoose.Schema.Types.ObjectId, default: null },
    },
    diff: { type: Object, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    at: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: false }
);

auditLogSchema.index({ "target.type": 1, "target.id": 1, at: -1 });

export default mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
