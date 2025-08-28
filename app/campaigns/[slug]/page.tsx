import Link from "next/link";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { campaignService, mediaAssetService } from "@/services";
import { CloudinaryService } from "@/lib/cloudinary";

type PageParams = { params: { slug: string } };

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function CampaignDetailPage({ params }: PageParams) {
  const campaign = await campaignService.getBySlug(params.slug);
  if (!campaign) return notFound();

  const currency = campaign.goal?.currency || "SLE";
  const raisedMinor = campaign.totals?.raisedMinor ?? 0;
  const goalMinor = campaign.goal?.amountMinor ?? 0;
  const amountRaised = Math.max(0, Math.floor(raisedMinor) / 100);
  const goalAmount = Math.max(0, Math.floor(goalMinor) / 100);
  const progress = goalAmount > 0 ? Math.min(100, Math.round((amountRaised / goalAmount) * 100)) : 0;
  const title = campaign.patient?.name || campaign.diagnosis || campaign.slug;
  const firstImageDoc = (campaign.documents || []).find((d) => d.type?.startsWith("image/"));
  let heroUrl = "/assets/Hero.png";
  let heroSrcSet: string | undefined;
  let heroSizes: string | undefined;
  if (firstImageDoc?.assetId) {
    const [asset] = await mediaAssetService.listByIds([firstImageDoc.assetId as unknown as mongoose.Types.ObjectId]);
    if (asset) {
      const key = asset.storage?.key;
      if (key) {
        const widths = [640, 768, 1024, 1280, 1536];
        heroSrcSet = widths
          .map((w) =>
            `${CloudinaryService.generateTransformationUrl(key, {
              width: w,
              crop: "fill",
              gravity: "auto",
              aspect_ratio: "16:9",
              fetch_format: "auto",
              quality: "auto",
            })} ${w}w`
          )
          .join(", ");
        heroUrl = CloudinaryService.generateTransformationUrl(key, {
          width: 1280,
          crop: "fill",
          gravity: "auto",
          aspect_ratio: "16:9",
          fetch_format: "auto",
          quality: "auto",
        });
        heroSizes = "(min-width: 1024px) 66vw, 100vw";
      } else {
        heroUrl = asset.url || heroUrl;
      }
    }
  }

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="overflow-hidden rounded-lg border">
            <div className="aspect-[16/9] w-full bg-neutral-100">
              <img src={heroUrl} srcSet={heroSrcSet} sizes={heroSizes} alt={title} className="h-full w-full object-cover" />
            </div>
            <div className="p-4 md:p-6">
              <h1 className="text-2xl md:text-3xl font-semibold">{title}</h1>
              <div className="mt-4 text-sm md:text-base text-gray-800">
                {campaign.story ? <p>{campaign.story}</p> : null}
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-lg border p-4 md:p-6">
            <div className="flex items-end gap-2">
              <div className="text-2xl md:text-3xl font-semibold">{formatAmount(amountRaised, currency)}</div>
              <div className="text-sm text-gray-600">of {formatAmount(goalAmount, currency)} goal</div>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded bg-neutral-200">
              <div className="h-2 bg-green-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100">👥</span>
                <span>{campaign.totals?.donationCount ?? 0} supporters</span>
              </div>
            </div>

            <Link
              href={`/campaigns/${campaign.slug}/donate`}
              className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-800"
            >
              Donate Now
            </Link>
          </div>
        </aside>
      </div>

      <div className="mt-6">
        <Link href="/campaigns" className="text-sm text-gray-900 underline">
          Back to campaigns
        </Link>
      </div>
    </main>
  );
}


