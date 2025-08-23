import { settingRepository } from "../repositories";
import { ISetting } from "../models/Setting";

export class SettingService {
  async getPlatform(): Promise<ISetting | null> {
    return settingRepository.getPlatformSettings();
  }
}

export const settingService = new SettingService();
