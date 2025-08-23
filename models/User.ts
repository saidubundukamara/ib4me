import mongoose from "mongoose";

export interface IUser extends mongoose.Document {
  name: string;
  email?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  roles?: string[];
  status?: "active" | "inactive" | "blocked";
  whatsappOptIn?: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, default: null, index: true },
    photoUrl: { type: String, default: null },
    roles: { type: [String], default: ["user"] },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
      index: true,
    },
    whatsappOptIn: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });

export default mongoose.models.User ||
  mongoose.model<IUser>("User", userSchema);
