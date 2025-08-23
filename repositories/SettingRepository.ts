import { BaseRepository } from "./BaseRepository";
import Setting, { ISetting } from "../models/Setting";

export class SettingRepository extends BaseRepository<ISetting> {
  constructor() {
    super(Setting);
  }

  async getPlatformSettings(): Promise<ISetting | null> {
    return this.findById("platform");
  }
}

export const settingRepository = new SettingRepository();
