import mongoose from "mongoose";
import { hospitalRepository, campaignRepository } from "../repositories";
import { IHospital } from "../models/Hospital";
import { runInTransaction } from "./ServiceTransaction";

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

interface PaginatedHospitals {
  hospitals: IHospital[];
  total: number;
  page: number;
  totalPages: number;
}

interface HospitalInput {
  name: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  verified?: boolean;
}

export class HospitalService {
  async create(input: HospitalInput): Promise<IHospital> {
    // Validate required fields
    if (!input.name?.trim()) {
      throw new Error("Hospital name is required");
    }

    if (input.name.length < 2 || input.name.length > 100) {
      throw new Error("Hospital name must be between 2 and 100 characters");
    }

    // Check for duplicate name
    const existing = await hospitalRepository.findByName(input.name.trim());
    if (existing) {
      throw new Error("A hospital with this name already exists");
    }

    // Validate email format if provided
    if (input.contactEmail && !this.isValidEmail(input.contactEmail)) {
      throw new Error("Invalid email format");
    }

    // Check for duplicate email if provided
    if (input.contactEmail) {
      const existingEmail = await hospitalRepository.findByEmail(input.contactEmail);
      if (existingEmail) {
        throw new Error("A hospital with this email already exists");
      }
    }

    return hospitalRepository.create({
      name: input.name.trim(),
      address: input.address?.trim() || null,
      contactPhone: input.contactPhone?.trim() || null,
      contactEmail: input.contactEmail?.trim().toLowerCase() || null,
      notes: input.notes?.trim() || null,
      verified: input.verified || false,
    } as unknown as Partial<IHospital>);
  }

  async getById(id: string): Promise<IHospital | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid hospital ID");
    }
    return hospitalRepository.findById(id);
  }

  async update(id: string, input: Partial<HospitalInput>): Promise<IHospital | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid hospital ID");
    }

    const hospital = await hospitalRepository.findById(id);
    if (!hospital) {
      throw new Error("Hospital not found");
    }

    // Validate name if being updated
    if (input.name !== undefined) {
      if (!input.name?.trim()) {
        throw new Error("Hospital name is required");
      }

      if (input.name.length < 2 || input.name.length > 100) {
        throw new Error("Hospital name must be between 2 and 100 characters");
      }

      // Check for duplicate name (excluding current hospital)
      const existing = await hospitalRepository.findByName(input.name.trim());
      if (existing && (existing._id as any).toString() !== id) {
        throw new Error("A hospital with this name already exists");
      }
    }

    // Validate email if being updated
    if (input.contactEmail !== undefined && input.contactEmail && !this.isValidEmail(input.contactEmail)) {
      throw new Error("Invalid email format");
    }

    // Check for duplicate email if being updated
    if (input.contactEmail) {
      const existingEmail = await hospitalRepository.findByEmail(input.contactEmail);
      if (existingEmail && (existingEmail._id as any).toString() !== id) {
        throw new Error("A hospital with this email already exists");
      }
    }

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.address !== undefined) updateData.address = input.address?.trim() || null;
    if (input.contactPhone !== undefined) updateData.contactPhone = input.contactPhone?.trim() || null;
    if (input.contactEmail !== undefined) updateData.contactEmail = input.contactEmail?.trim().toLowerCase() || null;
    if (input.notes !== undefined) updateData.notes = input.notes?.trim() || null;
    if (input.verified !== undefined) updateData.verified = input.verified;

    return hospitalRepository.updateById(id, { $set: updateData } as never);
  }

  async delete(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid hospital ID");
    }

    const hospital = await hospitalRepository.findById(id);
    if (!hospital) {
      throw new Error("Hospital not found");
    }

    // Check if hospital is used in any campaigns (legacy field path)
    const campaignCount = await campaignRepository.count({
      "institution.hospitalId": new mongoose.Types.ObjectId(id)
    } as never);

    if (campaignCount > 0) {
      throw new Error(`Cannot delete hospital. It is currently used in ${campaignCount} campaign(s).`);
    }

    return hospitalRepository.deleteById(id);
  }

  async toggleVerification(id: string): Promise<IHospital | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid hospital ID");
    }

    const hospital = await hospitalRepository.findById(id);
    if (!hospital) {
      throw new Error("Hospital not found");
    }

    return hospitalRepository.updateById(id, { 
      $set: { verified: !hospital.verified } 
    } as never);
  }

  async listForAdmin(
    filters: HospitalFilters = {},
    options: HospitalListOptions = {}
  ): Promise<PaginatedHospitals> {
    return hospitalRepository.listForAdmin(filters, options);
  }

  async findByName(name: string): Promise<IHospital | null> {
    return hospitalRepository.findByName(name);
  }

  async findVerified(): Promise<IHospital[]> {
    return hospitalRepository.findVerified();
  }

  async getAnalytics(): Promise<{
    total: number;
    verified: number;
    unverified: number;
    recentlyAdded: number;
  }> {
    const statusCounts = await hospitalRepository.countByStatus();
    
    // Count hospitals added in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentlyAdded = await hospitalRepository.count({
      createdAt: { $gte: thirtyDaysAgo }
    } as never);

    return {
      ...statusCounts,
      recentlyAdded
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export const hospitalService = new HospitalService();
