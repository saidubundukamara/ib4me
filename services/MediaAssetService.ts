import mongoose from "mongoose";
import { mediaAssetRepository } from "../repositories";
import { IMediaAsset } from "../models/MediaAsset";

export class MediaAssetService {
  async listByCampaign(
    campaignId: mongoose.Types.ObjectId
  ): Promise<IMediaAsset[]> {
    return mediaAssetRepository.listByCampaign(campaignId);
  }

  async listByIds(ids: mongoose.Types.ObjectId[]): Promise<IMediaAsset[]> {
    return mediaAssetRepository.listByIds(ids);
  }
}

export const mediaAssetService = new MediaAssetService();
