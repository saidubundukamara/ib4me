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

  async listByIds(ids: mongoose.Types.ObjectId[]): Promise<IMediaAsset[]> {
    if (ids.length === 0) return [];
    return this.findMany({ _id: { $in: ids } } as never);
  }
}

export const mediaAssetRepository = new MediaAssetRepository();
