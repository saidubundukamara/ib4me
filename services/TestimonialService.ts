import mongoose from "mongoose";
import { testimonialRepository, userRepository } from "../repositories";
import { ITestimonial } from "../models/Testimonial";
import { IUser } from "../models/User";
import { auditLogService } from "./AuditLogService";
import type { AuditContext } from "../lib/admin-auth";

interface CreateTestimonialInput {
  authorRole: string;
  quote: string;
}

interface UpdateTestimonialInput {
  authorRole?: string;
  quote?: string;
}

interface TestimonialFilters {
  status?: ITestimonial["status"] | "all";
  search?: string;
}

interface TestimonialListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface PaginatedTestimonials {
  testimonials: ITestimonial[];
  total: number;
  page: number;
  totalPages: number;
}

export class TestimonialService {
  // User methods

  /**
   * Create a new testimonial
   * Author name is automatically fetched from the user's account
   */
  async createTestimonial(
    userId: string,
    input: CreateTestimonialInput
  ): Promise<ITestimonial> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Validate input
    if (!input.quote || input.quote.trim().length === 0) {
      throw new Error("Quote is required");
    }
    if (input.quote.trim().length > 500) {
      throw new Error("Quote must be 500 characters or less");
    }
    if (!input.authorRole || input.authorRole.trim().length === 0) {
      throw new Error("Author role is required");
    }
    if (input.authorRole.trim().length > 100) {
      throw new Error("Author role must be 100 characters or less");
    }

    // Check if user already has an approved testimonial
    const hasApproved = await testimonialRepository.hasApprovedTestimonial(userId);
    if (hasApproved) {
      throw new Error("You already have an approved testimonial. Only one approved testimonial is allowed per user.");
    }

    // Use the user's account name as the author name
    const authorName = user.name || "Anonymous";

    return testimonialRepository.create({
      userId: new mongoose.Types.ObjectId(userId),
      authorName,
      authorRole: input.authorRole.trim(),
      quote: input.quote.trim(),
      status: "pending",
    } as Partial<ITestimonial>);
  }

  /**
   * Update a user's testimonial (only pending/rejected)
   * Note: authorName cannot be updated - it comes from the user's account
   */
  async updateTestimonial(
    userId: string,
    testimonialId: string,
    input: UpdateTestimonialInput
  ): Promise<ITestimonial | null> {
    const testimonial = await testimonialRepository.findById(testimonialId);

    if (!testimonial) {
      throw new Error("Testimonial not found");
    }

    if (testimonial.userId.toString() !== userId) {
      throw new Error("Not authorized to update this testimonial");
    }

    if (testimonial.status === "approved") {
      throw new Error("Cannot edit an approved testimonial");
    }

    // Validate input
    if (input.quote !== undefined) {
      if (input.quote.trim().length === 0) {
        throw new Error("Quote is required");
      }
      if (input.quote.trim().length > 500) {
        throw new Error("Quote must be 500 characters or less");
      }
    }
    if (input.authorRole !== undefined) {
      if (input.authorRole.trim().length === 0) {
        throw new Error("Author role is required");
      }
      if (input.authorRole.trim().length > 100) {
        throw new Error("Author role must be 100 characters or less");
      }
    }

    const update: Record<string, unknown> = {};
    if (input.authorRole !== undefined) {
      update.authorRole = input.authorRole.trim();
    }
    if (input.quote !== undefined) {
      update.quote = input.quote.trim();
    }

    // Reset status to pending if it was rejected
    if (testimonial.status === "rejected") {
      update.status = "pending";
      update.rejectionReason = null;
    }

    return testimonialRepository.updateById(testimonialId, { $set: update } as never);
  }

  /**
   * Delete a user's testimonial (only pending/rejected)
   */
  async deleteTestimonial(
    userId: string,
    testimonialId: string
  ): Promise<boolean> {
    const testimonial = await testimonialRepository.findById(testimonialId);

    if (!testimonial) {
      throw new Error("Testimonial not found");
    }

    if (testimonial.userId.toString() !== userId) {
      throw new Error("Not authorized to delete this testimonial");
    }

    if (testimonial.status === "approved") {
      throw new Error("Cannot delete an approved testimonial");
    }

    return testimonialRepository.deleteById(testimonialId);
  }

  /**
   * Get user's testimonials
   */
  async getUserTestimonials(userId: string): Promise<ITestimonial[]> {
    return testimonialRepository.findByUserId(userId);
  }

  // Admin methods

  /**
   * List testimonials for admin (with pagination and filters)
   */
  async listForAdmin(
    filters: TestimonialFilters = {},
    options: TestimonialListOptions = {}
  ): Promise<PaginatedTestimonials> {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options;

    const query: Record<string, unknown> = {};

    if (filters.status && filters.status !== "all") {
      query.status = filters.status;
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [testimonials, total] = await Promise.all([
      testimonialRepository.findMany(query as never, {
        query: { sort, skip, limit, populate: "userId" },
      } as never),
      testimonialRepository.count(query as never),
    ]);

    // Filter by search if provided (search by author name)
    let filteredTestimonials = testimonials;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredTestimonials = testimonials.filter((t) => {
        const user = t.userId as unknown as IUser | null;
        return (
          t.authorName.toLowerCase().includes(searchLower) ||
          t.authorRole.toLowerCase().includes(searchLower) ||
          user?.name?.toLowerCase().includes(searchLower) ||
          user?.email?.toLowerCase().includes(searchLower)
        );
      });
    }

    return {
      testimonials: filteredTestimonials,
      total: filters.search ? filteredTestimonials.length : total,
      page,
      totalPages: Math.ceil((filters.search ? filteredTestimonials.length : total) / limit),
    };
  }

  /**
   * Get testimonial by ID
   */
  async getById(testimonialId: string): Promise<ITestimonial | null> {
    return testimonialRepository.findById(testimonialId, {
      query: { populate: "userId" },
    } as never);
  }

  /**
   * Approve a testimonial
   */
  async approveTestimonial(
    testimonialId: string,
    adminId: string,
    auditContext?: AuditContext
  ): Promise<ITestimonial | null> {
    const testimonial = await testimonialRepository.findById(testimonialId);

    if (!testimonial) {
      throw new Error("Testimonial not found");
    }

    if (testimonial.status === "approved") {
      throw new Error("Testimonial is already approved");
    }

    // Check if user already has another approved testimonial
    const hasApproved = await testimonialRepository.hasApprovedTestimonial(
      testimonial.userId.toString()
    );
    if (hasApproved) {
      throw new Error("This user already has an approved testimonial. Reject this one or remove the existing one first.");
    }

    const updated = await testimonialRepository.updateStatus(
      testimonialId,
      "approved",
      adminId
    );

    if (updated && auditContext) {
      await auditLogService.record({
        actor: { userId: new mongoose.Types.ObjectId(adminId), role: "Admin" },
        action: "testimonial.approve",
        target: { type: "Testimonial", id: new mongoose.Types.ObjectId(testimonialId) },
        ip: auditContext.ip,
        userAgent: auditContext.userAgent,
      });
    }

    return updated;
  }

  /**
   * Reject a testimonial
   */
  async rejectTestimonial(
    testimonialId: string,
    adminId: string,
    reason: string,
    auditContext?: AuditContext
  ): Promise<ITestimonial | null> {
    const testimonial = await testimonialRepository.findById(testimonialId);

    if (!testimonial) {
      throw new Error("Testimonial not found");
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error("Rejection reason is required");
    }

    const updated = await testimonialRepository.updateStatus(
      testimonialId,
      "rejected",
      adminId,
      reason.trim()
    );

    if (updated && auditContext) {
      await auditLogService.record({
        actor: { userId: new mongoose.Types.ObjectId(adminId), role: "Admin" },
        action: "testimonial.reject",
        target: { type: "Testimonial", id: new mongoose.Types.ObjectId(testimonialId) },
        diff: { reason },
        ip: auditContext.ip,
        userAgent: auditContext.userAgent,
      });
    }

    return updated;
  }

  // Public methods

  /**
   * Get approved testimonials for homepage
   */
  async getApprovedTestimonials(limit: number = 6): Promise<ITestimonial[]> {
    return testimonialRepository.findApproved(limit);
  }

  /**
   * Get testimonial stats for admin dashboard
   */
  async getStats(): Promise<{ pending: number; approved: number; rejected: number; total: number }> {
    const [pending, approved, rejected] = await Promise.all([
      testimonialRepository.count({ status: "pending" } as never),
      testimonialRepository.count({ status: "approved" } as never),
      testimonialRepository.count({ status: "rejected" } as never),
    ]);

    return {
      pending,
      approved,
      rejected,
      total: pending + approved + rejected,
    };
  }
}

export const testimonialService = new TestimonialService();
