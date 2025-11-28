import mongoose from "mongoose";
import { Metadata } from "next";
import { mediaAssetService } from "@/services";
import { CloudinaryService } from "@/lib/cloudinary";

const DEFAULT_OG_IMAGE = {
  url: "https://ib4me.org/assets/Hero.png",
  width: 1200,
  height: 630,
  alt: "ib4me - Medical Emergency Fundraising",
};

const OG_TRANSFORMATIONS = {
  width: 1200,
  crop: "fill" as const,
  gravity: "auto",
  aspect_ratio: "1.91:1",
  fetch_format: "jpg",  // Use jpg for better crawler compatibility
  quality: "auto",
};

export interface OGImageResult {
  url: string;
  width: number;
  height: number;
  alt: string;
}

/**
 * Get OG image from the first campaign that has a patient photo
 */
export async function getOGImageFromCampaigns(
  campaigns: Array<{ patient?: { photoAssetId?: mongoose.Types.ObjectId; name?: string } }>,
  altText?: string
): Promise<OGImageResult> {
  const campaignWithPhoto = campaigns.find((c) => c.patient?.photoAssetId);

  if (!campaignWithPhoto?.patient?.photoAssetId) {
    return { ...DEFAULT_OG_IMAGE, alt: altText || DEFAULT_OG_IMAGE.alt };
  }

  const assets = await mediaAssetService.listByIds([
    campaignWithPhoto.patient.photoAssetId as mongoose.Types.ObjectId,
  ]);
  const asset = assets[0];

  if (asset?.storage?.key) {
    return {
      url: CloudinaryService.generateTransformationUrl(asset.storage.key, OG_TRANSFORMATIONS),
      width: 1200,
      height: 630,
      alt: altText || campaignWithPhoto.patient.name || "Campaign patient",
    };
  }

  // Fallback to stored URL if available
  if (asset?.url) {
    return {
      url: asset.url,
      width: 1200,
      height: 630,
      alt: altText || campaignWithPhoto.patient.name || "Campaign patient",
    };
  }

  return { ...DEFAULT_OG_IMAGE, alt: altText || DEFAULT_OG_IMAGE.alt };
}

/**
 * Build standard page metadata with OG image
 */
export function buildPageMetadata(params: {
  title: string;
  description: string;
  image: OGImageResult;
  type?: "website" | "profile";
  url?: string;
}): Metadata {
  const { title, description, image, type = "website", url } = params;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type,
      siteName: "ib4me",
      ...(url && { url }),
      images: [{ url: image.url, width: image.width, height: image.height, alt: image.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}
