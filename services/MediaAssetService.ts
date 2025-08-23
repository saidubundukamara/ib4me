import mongoose from "mongoose";
import { mediaAssetRepository } from "../repositories";
import { IMediaAsset } from "../models/MediaAsset";

export class MediaAssetService {
  async listByCampaign(
    campaignId: mongoose.Types.ObjectId
  ): Promise<IMediaAsset[]> {
    return mediaAssetRepository.listByCampaign(campaignId);
  }
}

export const mediaAssetService = new MediaAssetService();
