import mongoose from "mongoose";
import { partnerRepository } from "../repositories";
import { IPartner, PartnerType, PartnerStatus } from "../models/Partner";
import MediaAsset from "../models/MediaAsset";
import CloudinaryService, {
  deleteMediaAssetWithCloudinary,
} from "../lib/cloudinary";

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

interface PaginatedPartners {
  partners: IPartner[];
  total: number;
  page: number;
  totalPages: number;
}

interface PartnerInput {
  name: string;
  website?: string;
  partnerType: PartnerType;
  status?: PartnerStatus;
}

export class PartnerService {
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private validatePartnerType(type: string): type is PartnerType {
    return ["corporate", "healthcare", "ngo"].includes(type);
  }

  private validateStatus(status: string): status is PartnerStatus {
    return ["active", "inactive"].includes(status);
  }

  async create(input: PartnerInput): Promise<IPartner> {
    if (!input.name?.trim()) {
      throw new Error("Partner name is required");
    }

    if (input.name.length < 2 || input.name.length > 150) {
      throw new Error("Partner name must be between 2 and 150 characters");
    }

    const existing = await partnerRepository.findByName(input.name.trim());
    if (existing) {
      throw new Error("A partner with this name already exists");
    }

    if (!input.partnerType || !this.validatePartnerType(input.partnerType)) {
      throw new Error(
        "Invalid partner type. Must be: corporate, healthcare, or ngo"
      );
    }

    if (input.website && !this.isValidUrl(input.website)) {
      throw new Error("Invalid website URL format");
    }

    if (input.status && !this.validateStatus(input.status)) {
      throw new Error("Invalid status. Must be: active or inactive");
    }

    return partnerRepository.create({
      name: input.name.trim(),
      website: input.website?.trim() || null,
      partnerType: input.partnerType,
      status: input.status || "active",
    } as unknown as Partial<IPartner>);
  }

  async getById(id: string): Promise<IPartner | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid partner ID");
    }
    return partnerRepository.findById(id);
  }

  async update(
    id: string,
    input: Partial<PartnerInput>
  ): Promise<IPartner | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid partner ID");
    }

    const partner = await partnerRepository.findById(id);
    if (!partner) {
      throw new Error("Partner not found");
    }

    if (input.name !== undefined) {
      if (!input.name?.trim()) {
        throw new Error("Partner name is required");
      }

      if (input.name.length < 2 || input.name.length > 150) {
        throw new Error("Partner name must be between 2 and 150 characters");
      }

      const existing = await partnerRepository.findByName(input.name.trim());
      if (existing && (existing._id as mongoose.Types.ObjectId).toString() !== id) {
        throw new Error("A partner with this name already exists");
      }
    }

    if (
      input.website !== undefined &&
      input.website &&
      !this.isValidUrl(input.website)
    ) {
      throw new Error("Invalid website URL format");
    }

    if (
      input.partnerType !== undefined &&
      !this.validatePartnerType(input.partnerType)
    ) {
      throw new Error(
        "Invalid partner type. Must be: corporate, healthcare, or ngo"
      );
    }

    if (input.status !== undefined && !this.validateStatus(input.status)) {
      throw new Error("Invalid status. Must be: active or inactive");
    }

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.website !== undefined)
      updateData.website = input.website?.trim() || null;
    if (input.partnerType !== undefined)
      updateData.partnerType = input.partnerType;
    if (input.status !== undefined) updateData.status = input.status;

    return partnerRepository.updateById(id, { $set: updateData } as never);
  }

  async delete(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid partner ID");
    }

    const partner = await partnerRepository.findById(id);
    if (!partner) {
      throw new Error("Partner not found");
    }

    if (partner.logoAssetId) {
      await deleteMediaAssetWithCloudinary(partner.logoAssetId, MediaAsset);
    }

    return partnerRepository.deleteById(id);
  }

  async uploadLogo(partnerId: string, logoBuffer: Buffer): Promise<IPartner | null> {
    if (!mongoose.Types.ObjectId.isValid(partnerId)) {
      throw new Error("Invalid partner ID");
    }

    const partner = await partnerRepository.findById(partnerId);
    if (!partner) {
      throw new Error("Partner not found");
    }

    if (partner.logoAssetId) {
      await deleteMediaAssetWithCloudinary(partner.logoAssetId, MediaAsset);
    }

    const uploadResult = await CloudinaryService.uploadBuffer(logoBuffer, {
      folder: "partners/logos",
      resource_type: "image",
      transformation: {
        width: 400,
        height: 400,
        crop: "fit",
        quality: "auto",
        fetch_format: "auto",
      },
    });

    const logoAsset = await MediaAsset.create({
      type: "image",
      url: uploadResult.secure_url,
      storage: {
        provider: "cloudinary",
        key: uploadResult.public_id,
      },
      size: uploadResult.bytes,
    });

    return partnerRepository.updateById(partnerId, {
      $set: { logoAssetId: logoAsset._id },
    } as never);
  }

  async removeLogo(partnerId: string): Promise<IPartner | null> {
    if (!mongoose.Types.ObjectId.isValid(partnerId)) {
      throw new Error("Invalid partner ID");
    }

    const partner = await partnerRepository.findById(partnerId);
    if (!partner) {
      throw new Error("Partner not found");
    }

    if (!partner.logoAssetId) {
      throw new Error("Partner has no logo to remove");
    }

    await deleteMediaAssetWithCloudinary(partner.logoAssetId, MediaAsset);

    return partnerRepository.updateById(partnerId, {
      $set: { logoAssetId: null },
    } as never);
  }

  async toggleStatus(id: string): Promise<IPartner | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid partner ID");
    }

    const partner = await partnerRepository.findById(id);
    if (!partner) {
      throw new Error("Partner not found");
    }

    const newStatus: PartnerStatus =
      partner.status === "active" ? "inactive" : "active";
    return partnerRepository.updateById(id, {
      $set: { status: newStatus },
    } as never);
  }

  async listForAdmin(
    filters: PartnerFilters = {},
    options: PartnerListOptions = {}
  ): Promise<PaginatedPartners> {
    return partnerRepository.listForAdmin(filters, options);
  }

  async findByName(name: string): Promise<IPartner | null> {
    return partnerRepository.findByName(name);
  }

  async findActive(): Promise<IPartner[]> {
    return partnerRepository.findActive();
  }

  async findByType(partnerType: PartnerType): Promise<IPartner[]> {
    return partnerRepository.findByType(partnerType);
  }

  async getAnalytics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<PartnerType, number>;
    recentlyAdded: number;
  }> {
    const counts = await partnerRepository.countByTypeAndStatus();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentlyAdded = await partnerRepository.count({
      createdAt: { $gte: thirtyDaysAgo },
    } as never);

    return {
      ...counts,
      recentlyAdded,
    };
  }
}

export const partnerService = new PartnerService();
