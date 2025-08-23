import mongoose from "mongoose";
import { BaseRepository } from "./BaseRepository";
import MediaAsset, { IMediaAsset } from "../models/MediaAsset";

export class MediaAssetRepository extends BaseRepository<IMediaAsset> {
  constructor() {
    super(MediaAsset);
  }

  async listByCampaign(
    campaignId: mongoose.Types.ObjectId
  ): Promise<IMediaAsset[]> {
    return this.findMany({ campaignId } as never, {
      query: { sort: { createdAt: -1 } },
    });
  }
}

export const mediaAssetRepository = new MediaAssetRepository();
