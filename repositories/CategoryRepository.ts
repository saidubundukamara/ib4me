import { BaseRepository } from "./BaseRepository";
import Category, { ICategory } from "../models/Category";

interface CategoryFilters {
  search?: string;
  isActive?: boolean | "all";
  dateFrom?: Date;
  dateTo?: Date;
}

interface CategoryListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class CategoryRepository extends BaseRepository<ICategory> {
  constructor() {
    super(Category);
  }

  async findByName(name: string): Promise<ICategory | null> {
    return this.findOne({ name } as never);
  }

  async findBySlug(slug: string): Promise<ICategory | null> {
    return this.findOne({ slug } as never);
  }

  async findActive(): Promise<ICategory[]> {
    return this.findMany({ isActive: true } as never, {
      query: { sort: { displayOrder: 1, name: 1 } }
    });
  }

  async listForAdmin(
    filters: CategoryFilters = {},
    options: CategoryListOptions = {}
  ): Promise<{
    categories: ICategory[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = "displayOrder",
      sortOrder = "asc"
    } = options;

    const query: Record<string, unknown> = {};

    if (filters.isActive !== undefined && filters.isActive !== "all") {
      query.isActive = filters.isActive;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) (query.createdAt as Record<string, unknown>).$gte = filters.dateFrom;
      if (filters.dateTo) (query.createdAt as Record<string, unknown>).$lte = filters.dateTo;
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { description: { $regex: filters.search, $options: "i" } }
      ];
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      this.findMany(query as never, {
        query: { sort, skip, limit }
      }),
      this.count(query as never)
    ]);

    return {
      categories,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async countByStatus(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    const [total, active] = await Promise.all([
      this.count({} as never),
      this.count({ isActive: true } as never)
    ]);

    return {
      total,
      active,
      inactive: total - active
    };
  }
}

export const categoryRepository = new CategoryRepository();
