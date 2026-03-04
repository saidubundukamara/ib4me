import mongoose from "mongoose";
import { categoryRepository, campaignRepository } from "../repositories";
import { ICategory } from "../models/Category";

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

interface PaginatedCategories {
  categories: ICategory[];
  total: number;
  page: number;
  totalPages: number;
}

interface CategoryInput {
  name: string;
  description?: string;
  icon?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export class CategoryService {
  async create(input: CategoryInput): Promise<ICategory> {
    if (!input.name?.trim()) {
      throw new Error("Category name is required");
    }

    if (input.name.length < 2 || input.name.length > 100) {
      throw new Error("Category name must be between 2 and 100 characters");
    }

    const existing = await categoryRepository.findByName(input.name.trim());
    if (existing) {
      throw new Error("A category with this name already exists");
    }

    const slug = this.generateSlug(input.name);
    const existingSlug = await categoryRepository.findBySlug(slug);
    if (existingSlug) {
      throw new Error("A category with this slug already exists");
    }

    return categoryRepository.create({
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      icon: input.icon?.trim() || null,
      displayOrder: input.displayOrder ?? 0,
      isActive: input.isActive ?? true,
    } as unknown as Partial<ICategory>);
  }

  async getById(id: string): Promise<ICategory | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid category ID");
    }
    return categoryRepository.findById(id);
  }

  async getBySlug(slug: string): Promise<ICategory | null> {
    return categoryRepository.findBySlug(slug);
  }

  async update(id: string, input: Partial<CategoryInput>): Promise<ICategory | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid category ID");
    }

    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new Error("Category not found");
    }

    if (input.name !== undefined) {
      if (!input.name?.trim()) {
        throw new Error("Category name is required");
      }

      if (input.name.length < 2 || input.name.length > 100) {
        throw new Error("Category name must be between 2 and 100 characters");
      }

      const existing = await categoryRepository.findByName(input.name.trim());
      if (existing && (existing._id as mongoose.Types.ObjectId).toString() !== id) {
        throw new Error("A category with this name already exists");
      }
    }

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) {
      updateData.name = input.name.trim();
      updateData.slug = this.generateSlug(input.name);
    }
    if (input.description !== undefined) updateData.description = input.description?.trim() || null;
    if (input.icon !== undefined) updateData.icon = input.icon?.trim() || null;
    if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    return categoryRepository.updateById(id, { $set: updateData } as never);
  }

  async toggleActive(id: string): Promise<ICategory | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid category ID");
    }

    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new Error("Category not found");
    }

    return categoryRepository.updateById(id, {
      $set: { isActive: !category.isActive }
    } as never);
  }

  async delete(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid category ID");
    }

    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new Error("Category not found");
    }

    const campaignCount = await campaignRepository.count({
      categoryId: new mongoose.Types.ObjectId(id)
    } as never);

    if (campaignCount > 0) {
      throw new Error(`Cannot delete category. It is used by ${campaignCount} campaign(s). Consider deactivating instead.`);
    }

    return categoryRepository.deleteById(id);
  }

  async listForAdmin(
    filters: CategoryFilters = {},
    options: CategoryListOptions = {}
  ): Promise<PaginatedCategories> {
    return categoryRepository.listForAdmin(filters, options);
  }

  async findActive(): Promise<ICategory[]> {
    return categoryRepository.findActive();
  }

  async getAnalytics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    recentlyAdded: number;
  }> {
    const statusCounts = await categoryRepository.countByStatus();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentlyAdded = await categoryRepository.count({
      createdAt: { $gte: thirtyDaysAgo }
    } as never);

    return {
      ...statusCounts,
      recentlyAdded
    };
  }

  async seedInitialCategories(): Promise<{ created: number; skipped: number }> {
    const defaultCategories = [
      { name: "Medical & Health", icon: "HeartPulse", displayOrder: 1 },
      { name: "Education", icon: "GraduationCap", displayOrder: 2 },
      { name: "Emergency Relief", icon: "Siren", displayOrder: 3 },
      { name: "Community Development", icon: "Users", displayOrder: 4 },
      { name: "Charity & Nonprofit", icon: "HandHeart", displayOrder: 5 },
      { name: "Children & Youth", icon: "Baby", displayOrder: 6 },
      { name: "Environment", icon: "TreePine", displayOrder: 7 },
      { name: "Other", icon: "LayoutGrid", displayOrder: 8 },
    ];

    let created = 0;
    let skipped = 0;

    for (const cat of defaultCategories) {
      const existing = await categoryRepository.findByName(cat.name);
      if (!existing) {
        await this.create({ ...cat, isActive: true });
        created++;
      } else {
        skipped++;
      }
    }

    return { created, skipped };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

export const categoryService = new CategoryService();
