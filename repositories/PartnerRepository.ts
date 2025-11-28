import { BaseRepository } from "./BaseRepository";
import Partner, { IPartner, PartnerType, PartnerStatus } from "../models/Partner";

interface PartnerFilters {
  search?: string;
  partnerType?: PartnerType | "all";
  status?: PartnerStatus | "all";
  dateFrom?: Date;
  dateTo?: Date;
}

interface PartnerListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class PartnerRepository extends BaseRepository<IPartner> {
  constructor() {
    super(Partner);
  }

  async findByName(name: string): Promise<IPartner | null> {
    return this.findOne({ name } as never);
  }

  async findActive(): Promise<IPartner[]> {
    return this.findMany({ status: "active" } as never, {
      query: { sort: { name: 1 } },
    });
  }

  async findByType(partnerType: PartnerType): Promise<IPartner[]> {
    return this.findMany({ partnerType, status: "active" } as never, {
      query: { sort: { name: 1 } },
    });
  }

  async listForAdmin(
    filters: PartnerFilters = {},
    options: PartnerListOptions = {}
  ): Promise<{
    partners: IPartner[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options;

    // Build query filter
    const query: Record<string, unknown> = {};

    if (filters.partnerType && filters.partnerType !== "all") {
      query.partnerType = filters.partnerType;
    }

    if (filters.status && filters.status !== "all") {
      query.status = filters.status;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom)
        (query.createdAt as Record<string, unknown>).$gte = filters.dateFrom;
      if (filters.dateTo)
        (query.createdAt as Record<string, unknown>).$lte = filters.dateTo;
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { website: { $regex: filters.search, $options: "i" } },
      ];
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [partners, total] = await Promise.all([
      this.findMany(query as never, {
        query: { sort, skip, limit },
      }),
      this.count(query as never),
    ]);

    return {
      partners,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async countByTypeAndStatus(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<PartnerType, number>;
  }> {
    const [total, active, corporate, healthcare, ngo] = await Promise.all([
      this.count({} as never),
      this.count({ status: "active" } as never),
      this.count({ partnerType: "corporate" } as never),
      this.count({ partnerType: "healthcare" } as never),
      this.count({ partnerType: "ngo" } as never),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      byType: { corporate, healthcare, ngo },
    };
  }
}

export const partnerRepository = new PartnerRepository();
