"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  generateCampaignImage,
  downloadImage,
  type CampaignImageData,
} from "@/utils/imageGenerator";

interface ShareImageButtonProps {
  campaign: CampaignImageData;
}

export default function ShareImageButton({ campaign }: ShareImageButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (loading) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("Your browser does not support image generation");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Generating shareable image...");

    try {
      const baseUrl = window.location.origin;
      const imageBlob = await generateCampaignImage(campaign, baseUrl);
      downloadImage(imageBlob, `${campaign.slug}-share.png`);
      toast.dismiss(loadingToast);
      toast.success("Shareable image downloaded!");
    } catch (error) {
      toast.dismiss(loadingToast);
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to generate image: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      className="w-full gap-2 mt-3"
      onClick={handleDownload}
      disabled={loading}
    >
      <Download className="h-4 w-4" />
      {loading ? "Generating..." : "Download Share Image"}
    </Button>
  );
}
