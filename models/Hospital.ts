import mongoose from "mongoose";

export interface IHospital extends mongoose.Document {
  name: string;
  address?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  verified: boolean;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const hospitalSchema = new mongoose.Schema<IHospital>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, default: null },
    contactPhone: { type: String, default: null },
    contactEmail: { type: String, default: null, lowercase: true, trim: true },
    verified: { type: Boolean, default: false, index: true },
    notes: { type: String, default: null },
  },
  { timestamps: true }
);

hospitalSchema.index({ name: 1 }, { unique: true });

export default mongoose.models.Hospital ||
  mongoose.model<IHospital>("Hospital", hospitalSchema);
