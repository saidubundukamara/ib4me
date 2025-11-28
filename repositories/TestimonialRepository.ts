import mongoose from "mongoose";
import { BaseRepository, RepositorySession } from "./BaseRepository";
import Testimonial, { ITestimonial } from "../models/Testimonial";

export class TestimonialRepository extends BaseRepository<ITestimonial> {
  constructor() {
    super(Testimonial);
  }

  async findByUserId(userId: string): Promise<ITestimonial[]> {
    return this.findMany(
      { userId: new mongoose.Types.ObjectId(userId) } as never,
      {
        query: { sort: { createdAt: -1 } },
      } as never
    );
  }

  async findApproved(limit: number = 6): Promise<ITestimonial[]> {
    return this.findMany(
      { status: "approved" } as never,
      {
        query: {
          sort: { reviewedAt: -1 },
          limit,
        },
      } as never
    );
  }

  async findByStatus(status: ITestimonial["status"]): Promise<ITestimonial[]> {
    return this.findMany(
      { status } as never,
      {
        query: { sort: { createdAt: -1 }, populate: "userId" },
      } as never
    );
  }

  async hasApprovedTestimonial(userId: string): Promise<boolean> {
    const count = await this.count({
      userId: new mongoose.Types.ObjectId(userId),
      status: "approved",
    } as never);
    return count > 0;
  }

  async updateStatus(
    testimonialId: string,
    status: ITestimonial["status"],
    reviewedBy?: string,
    rejectionReason?: string,
    session?: RepositorySession
  ): Promise<ITestimonial | null> {
    const update: Record<string, unknown> = { status };

    if (reviewedBy) {
      update.reviewedBy = new mongoose.Types.ObjectId(reviewedBy);
      update.reviewedAt = new Date();
    }

    if (status === "rejected" && rejectionReason) {
      update.rejectionReason = rejectionReason;
    }

    if (status === "approved") {
      update.rejectionReason = null;
    }

    return this.updateById(testimonialId, { $set: update } as never, session);
  }
}

export const testimonialRepository = new TestimonialRepository();
