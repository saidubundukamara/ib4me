export interface CampaignImageData {
  slug: string;
  beneficiary?: { name?: string; age?: number };
  institution?: { name?: string };
  details?: string;
  goal?: { currency?: string; amountMinor?: number };
  totals?: { raisedMinor?: number; donationCount?: number };
  story?: string;
  urgency?: string;
  financial_account?: { uvan?: string };
  isVerified?: boolean;
  imageUrl?: string;
}

const BRAND = {
  funGreen: "#00712D",
  blazeOrange: "#FF6000",
  chartereuse: "#80E10A",
  orangeBlaze: "#FBB03B",
  white: "#FFFFFF",
  whiteDark: "#F9FAFB",
  black: "#111827",
  textDark: "#1F2937",
  textMid: "#4B5563",
  textLight: "#9CA3AF",
  divider: "#E5E7EB",
  amber: "#D97706",
  amberLight: "#FEF3C7",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Load an image from a URL, returning null on failure */
async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.error("Failed to load image for canvas (possible CORS or network issue):", src);
      resolve(null);
    };

    // Bypass browser cache for canvas CORS requirements
    const isDataURL = src.startsWith("data:");
    const cacheBuster = `cb=${Date.now()}`;
    const divider = src.includes("?") ? "&" : "?";
    img.src = isDataURL ? src : `${src}${divider}${cacheBuster}`;
  });
}

/** Utility to draw text that wraps */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  if (!text) return y;
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
  return currentY + lineHeight;
}

/** Trace a rounded rectangle path */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Draws the logo text */
function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, color: string = BRAND.funGreen) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 30px 'Sora', sans-serif";
  ctx.fillStyle = color;
  ctx.fillText("ib4me", x, y);

  ctx.fillStyle = BRAND.blazeOrange;
  ctx.beginPath();
  ctx.arc(x + 44, y + 7, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Watermark Function ───
function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((-35 * Math.PI) / 180);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 140px 'Sora', sans-serif";
  ctx.fillStyle = "rgba(0, 113, 45, 0.035)";

  for (let i = -3; i <= 3; i++) {
    for (let j = -3; j <= 3; j++) {
      ctx.fillText("ib4me", i * 360, j * 220);
    }
  }
  ctx.restore();
}

export async function generateCampaignImage(
  campaign: CampaignImageData,
  baseUrl: string
): Promise<Blob> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Image generation only works in browser environment");
  }

  // ── Canvas setup (Instagram square friendly) ────────────────────────────────
  const W = 1080;
  const H = 1080;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  if (!ctx) throw new Error("Could not get canvas context");

  // ── 1. Background ───────────────────────────────────────────────────────────
  ctx.fillStyle = BRAND.whiteDark;
  ctx.fillRect(0, 0, W, H);

  // Soft glowing ambient orbs
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  const grad1 = ctx.createRadialGradient(100, 100, 0, 100, 100, 500);
  grad1.addColorStop(0, "rgba(255, 96, 0, 0.08)");
  grad1.addColorStop(1, "rgba(255, 96, 0, 0)");
  ctx.fillStyle = grad1;
  ctx.fillRect(0, 0, W, H);

  const grad2 = ctx.createRadialGradient(W - 100, H - 100, 0, W - 100, H - 100, 600);
  grad2.addColorStop(0, "rgba(0, 113, 45, 0.06)");
  grad2.addColorStop(1, "rgba(0, 113, 45, 0)");
  ctx.fillStyle = grad2;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // ── 2. Decorative Watermark ──────────────────────────────────────────────────
  drawWatermark(ctx, W, H);

  // ── 3. Main Central Card ─────────────────────────────────────────────────────
  const CARD_M = 48;
  const CW = W - CARD_M * 2;
  const CH = H - CARD_M * 2;
  const CR = 40;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.06)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = BRAND.white;
  roundRect(ctx, CARD_M, CARD_M, CW, CH, CR);
  ctx.fill();
  ctx.restore();

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(0,0,0,0.05)";
  ctx.stroke();

  // ── 4. Card Header & Logo ──────────────────────────────────────────────────
  const HEADER_CY = CARD_M + 52; // vertical center of header
  drawLogo(ctx, CARD_M + 76, HEADER_CY, BRAND.funGreen);

  ctx.save();
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.font = "600 15px 'Sora', sans-serif";
  ctx.fillStyle = BRAND.textLight;
  ctx.fillText("ib4me.org", CARD_M + CW - 40, HEADER_CY);
  ctx.restore();

  // ── 5. Campaign Image ──────────────────────────────────────────────────────
  const IMG_Y = CARD_M + 92;   // starts at y=140
  const IMG_H = 390;            // tall enough for good photo, leaves room for content
  const IMG_R = 28;
  const IMG_X = CARD_M + 40;
  const IMG_W = CW - 80;       // 904px wide

  const photoImg = campaign.imageUrl ? await loadImage(campaign.imageUrl) : null;

  if (photoImg) {
    ctx.save();
    roundRect(ctx, IMG_X, IMG_Y, IMG_W, IMG_H, IMG_R);
    ctx.clip();

    // Cover-fit: scale to fill the frame fully
    const scale = Math.max(IMG_W / photoImg.width, IMG_H / photoImg.height);
    const sw = IMG_W / scale;
    const sh = IMG_H / scale;
    const sx = Math.max(0, (photoImg.width - sw) / 2);
    // For portrait images, bias crop towards top (keeps subject's face visible)
    const sy = photoImg.height > photoImg.width
      ? Math.max(0, (photoImg.height - sh) / 3)
      : Math.max(0, (photoImg.height - sh) / 2);

    ctx.drawImage(photoImg, sx, sy, sw, sh, IMG_X, IMG_Y, IMG_W, IMG_H);

    // Subtle gradient overlay at bottom to improve text readability
    const imgGrad = ctx.createLinearGradient(0, IMG_Y + IMG_H - 80, 0, IMG_Y + IMG_H);
    imgGrad.addColorStop(0, "rgba(0,0,0,0)");
    imgGrad.addColorStop(1, "rgba(0,0,0,0.25)");
    ctx.fillStyle = imgGrad;
    ctx.fillRect(IMG_X, IMG_Y + IMG_H - 80, IMG_W, 80);

    ctx.restore();
  } else {
    // Placeholder when image is unavailable
    ctx.save();
    ctx.fillStyle = BRAND.whiteDark;
    roundRect(ctx, IMG_X, IMG_Y, IMG_W, IMG_H, IMG_R);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = BRAND.divider;
    ctx.setLineDash([8, 12]);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "60px 'Sora', sans-serif";
    ctx.fillStyle = BRAND.textLight;
    ctx.fillText("🤍", IMG_X + IMG_W / 2, IMG_Y + IMG_H / 2 - 10);

    ctx.font = "500 18px 'Sora', sans-serif";
    ctx.fillText("Support this campaign", IMG_X + IMG_W / 2, IMG_Y + IMG_H / 2 + 40);
    ctx.restore();
  }

  // ── 6. Verification Badge (floating on image) ─────────────────────────────
  if (campaign.isVerified) {
    // Green "Verified Campaign" badge
    const badgeW = 190;
    const badgeH = 38;
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
    ctx.shadowColor = "rgba(0,0,0,0.12)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    roundRect(ctx, IMG_X + 20, IMG_Y + 20, badgeW, badgeH, 19);
    ctx.fill();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 14px 'Sora', sans-serif";
    ctx.fillStyle = BRAND.funGreen;
    ctx.fillText("✓ Verified Campaign", IMG_X + 20 + badgeW / 2, IMG_Y + 20 + badgeH / 2);
    ctx.restore();
  } else {
    // Amber "Not Verified" badge
    const badgeW = 165;
    const badgeH = 38;
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
    ctx.shadowColor = "rgba(0,0,0,0.10)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    roundRect(ctx, IMG_X + 20, IMG_Y + 20, badgeW, badgeH, 19);
    ctx.fill();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 14px 'Sora', sans-serif";
    ctx.fillStyle = BRAND.amber;
    ctx.fillText("⚠ Not Verified", IMG_X + 20 + badgeW / 2, IMG_Y + 20 + badgeH / 2);
    ctx.restore();
  }

  // ── 7. Title — full card width so it never conflicts with the ring ──────────
  const CONTENT_Y = IMG_Y + IMG_H + 22; // y=552

  // Slug titles (hyphens, no spaces) → readable words so wrapText can break them
  const rawTitle = campaign.beneficiary?.name || campaign.details || campaign.slug || "Campaign";
  const displayTitle = (!rawTitle.includes(" ") && rawTitle.includes("-"))
    ? rawTitle.replace(/-/g, " ")
    : rawTitle;

  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // "HELP SUPPORT" orange label
  ctx.font = "bold 13px 'Sora', sans-serif";
  ctx.fillStyle = BRAND.blazeOrange;
  ctx.fillText("HELP SUPPORT", IMG_X, CONTENT_Y);

  // Shrink font until the widest single word fits full IMG_W, then wrap
  let titleFontSize = 42;
  ctx.font = `bold ${titleFontSize}px 'Sora', sans-serif`;
  const titleWordsArr = displayTitle.split(" ");
  const widestWord = titleWordsArr.reduce(
    (a, b) => (ctx.measureText(a).width >= ctx.measureText(b).width ? a : b),
    ""
  );
  while (ctx.measureText(widestWord).width > IMG_W && titleFontSize > 20) {
    titleFontSize -= 2;
    ctx.font = `bold ${titleFontSize}px 'Sora', sans-serif`;
  }
  const titleLineH = Math.round(titleFontSize * 1.25);
  ctx.fillStyle = BRAND.textDark;
  // Use full IMG_W — ring lives BELOW the title, not beside it
  const titleEndY = wrapText(ctx, displayTitle, IMG_X, CONTENT_Y + 22, IMG_W, titleLineH);
  ctx.restore();

  // ── 8. Sub-row below title: story (left) | progress ring (right) ─────────
  const SUB_Y = titleEndY + 14;
  const FOOTER_LINE_Y = CH + CARD_M - 170; // y=862 (where footer divider goes)
  const SUB_H = FOOTER_LINE_Y - 32 - SUB_Y; // available height for this sub-row

  // Left zone: story / details
  const STORY_W = Math.floor(IMG_W * 0.52); // 52% for text
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "16px 'Sora', sans-serif";
  ctx.fillStyle = BRAND.textMid;
  if (campaign.details || campaign.institution?.name) {
    const parts: string[] = [];
    if (campaign.details) parts.push(campaign.details);
    if (campaign.institution?.name) parts.push(`At ${campaign.institution.name}`);
    wrapText(ctx, parts.join(" • "), IMG_X, SUB_Y, STORY_W, 24);
  } else if (campaign.story) {
    wrapText(ctx, campaign.story.slice(0, 130).replace(/\s\S+$/, "..."), IMG_X, SUB_Y, STORY_W, 24);
  }
  ctx.restore();

  // Right zone: progress ring centered in its area
  const goal = (campaign.goal?.amountMinor ?? 0) / 100;
  const raised = (campaign.totals?.raisedMinor ?? 0) / 100;
  const currency = campaign.goal?.currency || "SLE";
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  const RING_ZONE_X = IMG_X + STORY_W + 16;
  const RING_ZONE_W = IMG_X + IMG_W - RING_ZONE_X;
  const RING_CX = RING_ZONE_X + Math.floor(RING_ZONE_W / 2);
  const RING_R = Math.min(50, Math.max(30, Math.floor(SUB_H / 2.8)));
  const RING_CY = SUB_Y + RING_R + 8;
  const RING_THICKNESS = Math.max(8, Math.floor(RING_R / 5.5));

  // Track
  ctx.save();
  ctx.beginPath();
  ctx.arc(RING_CX, RING_CY, RING_R, 0, Math.PI * 2);
  ctx.lineWidth = RING_THICKNESS;
  ctx.strokeStyle = BRAND.divider;
  ctx.stroke();

  // Progress arc
  if (pct > 0) {
    ctx.beginPath();
    ctx.arc(RING_CX, RING_CY, RING_R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (pct / 100));
    ctx.lineCap = "round";
    ctx.lineWidth = RING_THICKNESS;
    ctx.strokeStyle = BRAND.chartereuse;
    ctx.stroke();
  }

  // Percentage text inside ring
  const pctFont = Math.max(16, Math.floor(RING_R * 0.46));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${pctFont}px 'Sora', sans-serif`;
  ctx.fillStyle = BRAND.textDark;
  ctx.fillText(`${pct}%`, RING_CX, RING_CY);
  ctx.restore();

  // Raised / goal centered below ring
  const statsY = RING_CY + RING_R + 12;
  const raisedFmt = raised >= 1_000_000
    ? `${(raised / 1_000_000).toFixed(1)}M`
    : raised >= 1_000 ? `${(raised / 1_000).toFixed(1)}K`
    : raised.toLocaleString();
  const goalFmt = goal >= 1_000_000
    ? `${(goal / 1_000_000).toFixed(1)}M`
    : goal >= 1_000 ? `${(goal / 1_000).toFixed(1)}K`
    : goal.toLocaleString();

  const statFontSz = Math.max(13, Math.min(19, Math.floor(RING_R / 2.6)));
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `bold ${statFontSz}px 'Sora', sans-serif`;
  ctx.fillStyle = BRAND.funGreen;
  ctx.fillText(`${currency} ${raisedFmt} raised`, RING_CX, statsY);
  ctx.font = `${Math.max(11, statFontSz - 3)}px 'Sora', sans-serif`;
  ctx.fillStyle = BRAND.textLight;
  ctx.fillText(`of ${currency} ${goalFmt} goal`, RING_CX, statsY + statFontSz + 4);
  ctx.restore();

  // ── 9. Footer: CTA & QR Code ─────────────────────────────────────────────────
  const FOOTER_Y = FOOTER_LINE_Y;

  // Divider line
  ctx.strokeStyle = BRAND.divider;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(IMG_X, FOOTER_Y - 28);
  ctx.lineTo(IMG_X + IMG_W, FOOTER_Y - 28);
  ctx.stroke();

  // CTA text
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = "bold 20px 'Sora', sans-serif";
  ctx.fillStyle = BRAND.textDark;
  ctx.fillText("Scan to contribute via Mobile Money", IMG_X, FOOTER_Y + 10);

  ctx.font = "15px 'Sora', sans-serif";
  ctx.fillStyle = BRAND.textMid;
  ctx.fillText("Every contribution makes an impact ✨", IMG_X, FOOTER_Y + 40);

  ctx.font = "500 12px 'Sora', sans-serif";
  ctx.fillStyle = BRAND.textLight;
  ctx.fillText("Powered by ib4me — Sierra Leone's Premier Crowdfunding Platform", IMG_X, FOOTER_Y + 108);
  ctx.restore();

  // QR Code
  const QR_SIZE = 140;
  const QR_X = CARD_M + CW - 40 - QR_SIZE;
  const QR_Y = FOOTER_Y - 14;

  ctx.save();
  ctx.fillStyle = BRAND.white;
  ctx.shadowColor = "rgba(0,0,0,0.06)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, QR_X - 10, QR_Y - 10, QR_SIZE + 20, QR_SIZE + 20, 16);
  ctx.fill();
  ctx.restore();

  const qrCodeUrl = `${baseUrl}/campaigns/${campaign.slug}/donate`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${QR_SIZE}x${QR_SIZE}&data=${encodeURIComponent(qrCodeUrl)}&format=png&bgcolor=ffffff&color=00712D&qzone=1`;

  const qrImg = await loadImage(qrImageUrl);
  if (qrImg) {
    ctx.drawImage(qrImg, QR_X, QR_Y, QR_SIZE, QR_SIZE);
  }

  // ── Export ──────────────────────────────────────────────────────────────────
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to generate image"));
      },
      "image/png",
      1.0
    );
  });
}

/** Legacy signature alias */
export const generateCampaignImageLegacy = generateCampaignImage;

export function downloadImage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
