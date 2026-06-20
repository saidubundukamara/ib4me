import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";
import { campaignService, mediaAssetService } from "@/services";
import { CloudinaryService } from "@/lib/cloudinary";
import mongoose from "mongoose";

export const alt = "Campaign on ib4me";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Params = { params: Promise<{ slug: string }> };

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function Image({ params }: Params) {
  const { slug } = await params;

  // White logo for the green panel
  let logoSrc = "";
  try {
    const buf = readFileSync(join(process.cwd(), "public/assets/ib4melogowhite.png"));
    logoSrc = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    // text fallback below
  }

  // Load Inter Bold — resolve the actual woff2 URL via Google Fonts CSS API
  let fontData: ArrayBuffer | null = null;
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      },
    ).then((r) => r.text());

    const woff2Url = css.match(/url\(([^)]+\.woff2)\)/)?.[1];
    if (woff2Url) {
      fontData = await fetch(woff2Url).then((r) => r.arrayBuffer());
    }
  } catch {
    // satori falls back to system sans-serif
  }

  // Campaign data
  let photoUrl = "";
  let name = "a cause";
  let details = "";
  let raisedMajor = 0;
  let goalMajor = 0;
  let currency = "SLE";

  try {
    const campaign = await campaignService.getBySlug(slug);

    if (campaign) {
      name = campaign.beneficiary?.name || "a cause";
      details = campaign.details || "";
      currency = campaign.goal?.currency || "SLE";
      raisedMajor = (campaign.totals?.raisedMinor ?? 0) / 100;
      goalMajor = (campaign.goal?.amountMinor ?? 0) / 100;

      // Get the best available photo asset
      const assetIds: mongoose.Types.ObjectId[] = [];
      if (campaign.beneficiary?.photoAssetId) {
        assetIds.push(campaign.beneficiary.photoAssetId as mongoose.Types.ObjectId);
      }
      const firstDocImage = (campaign.documents ?? []).find((d) =>
        d.type?.startsWith("image/"),
      );
      if (firstDocImage?.assetId) {
        assetIds.push(firstDocImage.assetId as unknown as mongoose.Types.ObjectId);
      }

      if (assetIds.length > 0) {
        const assets = await mediaAssetService.listByIds(assetIds);
        const asset = assets[0];
        if (asset?.storage?.key) {
          // Portrait crop: 560×630 for left panel
          photoUrl = CloudinaryService.generateTransformationUrl(asset.storage.key, {
            width: 560,
            aspect_ratio: "8:9",
            crop: "fill",
            gravity: "face",
            fetch_format: "jpg",
            quality: "auto",
          });
        } else if (asset?.url) {
          photoUrl = asset.url;
        }
      }
    }
  } catch {
    // render with defaults
  }

  const percent = goalMajor > 0 ? Math.min(100, Math.round((raisedMajor / goalMajor) * 100)) : 0;
  const titleSize = name.length > 22 ? "34px" : name.length > 14 ? "40px" : "46px";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* ── Left panel: campaign photo ── */}
        <div style={{ width: "560px", height: "630px", flexShrink: 0, display: "flex" }}>
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt=""
              width={560}
              height={630}
              style={{ width: "560px", height: "630px", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "560px",
                height: "630px",
                background: "linear-gradient(160deg, #14532d 0%, #166534 55%, #15803d 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Heart placeholder */}
              <svg width="120" height="120" viewBox="0 0 24 24" fill="rgba(255,255,255,0.18)">
                <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
              </svg>
            </div>
          )}
        </div>

        {/* ── Right panel: brand ── */}
        <div
          style={{
            flex: 1,
            background: "#1A5C32",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "52px 56px 48px",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", height: "44px" }}>
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoSrc}
                alt="ib4me"
                height={38}
                style={{ height: "38px", width: "auto", objectFit: "contain" }}
              />
            ) : (
              <span style={{ color: "white", fontSize: "28px", fontWeight: "800", letterSpacing: "-1px" }}>
                ib4me
              </span>
            )}
          </div>

          {/* Beneficiary name + campaign details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div
              style={{
                fontSize: titleSize,
                fontWeight: "800",
                color: "white",
                lineHeight: "1.15",
                letterSpacing: "-0.5px",
              }}
            >
              Help {name}
            </div>
            {details ? (
              <div
                style={{
                  fontSize: "19px",
                  fontWeight: "400",
                  color: "rgba(255,255,255,0.72)",
                  lineHeight: "1.5",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {details}
              </div>
            ) : null}
          </div>

          {/* Progress section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Raised amount */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
              <span
                style={{
                  fontSize: "38px",
                  fontWeight: "800",
                  color: "#FB923C",
                  letterSpacing: "-1px",
                }}
              >
                {formatAmount(raisedMajor, currency)}
              </span>
              <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.55)", fontWeight: "400" }}>
                raised
              </span>
            </div>

            {/* Progress bar */}
            <div
              style={{
                width: "100%",
                height: "10px",
                background: "rgba(255,255,255,0.18)",
                borderRadius: "999px",
                display: "flex",
              }}
            >
              <div
                style={{
                  width: `${Math.max(2, percent)}%`,
                  height: "10px",
                  background: "#F97316",
                  borderRadius: "999px",
                }}
              />
            </div>

            {/* Goal + domain */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "15px", color: "rgba(255,255,255,0.55)" }}>
                {percent}% of {formatAmount(goalMajor, currency)} goal
              </span>
              <span
                style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.35)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                ib4me.org
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: "Inter", data: fontData, style: "normal", weight: 700 }]
        : [],
    },
  );
}
