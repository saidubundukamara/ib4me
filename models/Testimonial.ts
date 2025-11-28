import mongoose from "mongoose";

export interface ITestimonial extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  authorName: string;
  authorRole: string;
  quote: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: mongoose.Types.ObjectId | null;
  reviewedAt?: Date | null;
  rejectionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const testimonialSchema = new mongoose.Schema<ITestimonial>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
    },
    authorRole: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
    },
    quote: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
  },
  { timestamps: true }
);

testimonialSchema.index({ userId: 1 });
testimonialSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Testimonial ||
  mongoose.model<ITestimonial>("Testimonial", testimonialSchema);
