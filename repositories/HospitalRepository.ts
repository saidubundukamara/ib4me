import { BaseRepository } from "./BaseRepository";
import Hospital, { IHospital } from "../models/Hospital";

export class HospitalRepository extends BaseRepository<IHospital> {
  constructor() {
    super(Hospital);
  }

  async findByName(name: string): Promise<IHospital | null> {
    return this.findOne({ name } as never);
  }
}

export const hospitalRepository = new HospitalRepository();
