import { BaseRepository } from "./BaseRepository";
import Hospital, { IHospital } from "../models/Hospital";

interface HospitalFilters {
  search?: string;
  verified?: boolean | "all";
  dateFrom?: Date;
  dateTo?: Date;
}

interface HospitalListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class HospitalRepository extends BaseRepository<IHospital> {
  constructor() {
    super(Hospital);
  }

  async findByName(name: string): Promise<IHospital | null> {
    return this.findOne({ name } as never);
  }

  async findByEmail(email: string): Promise<IHospital | null> {
    return this.findOne({ contactEmail: email } as never);
  }

  async findVerified(): Promise<IHospital[]> {
    return this.findMany({ verified: true } as never, {
      query: { sort: { name: 1 } }
    });
  }

  async listForAdmin(
    filters: HospitalFilters = {},
    options: HospitalListOptions = {}
  ): Promise<{
    hospitals: IHospital[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = options;

    // Build query filter
    const query: Record<string, unknown> = {};
    
    if (filters.verified !== undefined && filters.verified !== "all") {
      query.verified = filters.verified;
    }
    
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) (query.createdAt as Record<string, unknown>).$gte = filters.dateFrom;
      if (filters.dateTo) (query.createdAt as Record<string, unknown>).$lte = filters.dateTo;
    }
    
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { address: { $regex: filters.search, $options: "i" } },
        { contactEmail: { $regex: filters.search, $options: "i" } },
        { contactPhone: { $regex: filters.search, $options: "i" } }
      ];
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [hospitals, total] = await Promise.all([
      this.findMany(query as never, {
        query: { sort, skip, limit }
      }),
      this.count(query as never)
    ]);

    return {
      hospitals,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async countByStatus(): Promise<{
    total: number;
    verified: number;
    unverified: number;
  }> {
    const [total, verified] = await Promise.all([
      this.count({} as never),
      this.count({ verified: true } as never)
    ]);

    return {
      total,
      verified,
      unverified: total - verified
    };
  }
}

export const hospitalRepository = new HospitalRepository();
