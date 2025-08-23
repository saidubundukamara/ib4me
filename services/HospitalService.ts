import { hospitalRepository } from "../repositories";
import { IHospital } from "../models/Hospital";

export class HospitalService {
  async create(
    input: Pick<IHospital, "name"> &
      Partial<Pick<IHospital, "address" | "contactPhone" | "contactEmail">>
  ): Promise<IHospital> {
    return hospitalRepository.create({
      name: input.name,
      address: input.address ?? null,
      contactPhone: input.contactPhone ?? null,
      contactEmail: input.contactEmail ?? null,
      verified: false,
    } as unknown as Partial<IHospital>);
  }

  async findByName(name: string): Promise<IHospital | null> {
    return hospitalRepository.findByName(name);
  }
}

export const hospitalService = new HospitalService();
