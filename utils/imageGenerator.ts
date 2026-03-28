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

/** Draws the beautiful minimal logo representation for 'ib4me' */
function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, color: string = BRAND.funGreen) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 32px 'Sora', sans-serif";
  ctx.fillStyle = color;
  ctx.fillText("ib4me", x, y);
  
  // A tiny accent dot to make the brand stand out
  ctx.fillStyle = BRAND.blazeOrange;
  ctx.beginPath();
  ctx.arc(x + 48, y + 8, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Watermark Function ───
function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((-35 * Math.PI) / 180); // Diagonal tilt

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 140px 'Sora', sans-serif";
  ctx.fillStyle = "rgba(0, 113, 45, 0.035)"; // Super faint Fun Green
  
  // Draw repeating grid
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

  // Load fonts (simulated, as canvas uses system native if Sora isn't strictly loaded)
  // Ensure your global css imports 'Sora' for web context.
  
  // ── 1. Background (Minimal White) ───────────────────────────────
  ctx.fillStyle = BRAND.whiteDark;
  ctx.fillRect(0, 0, W, H);

  // Soft glowing ambient orbs (Blaze Orange and Chartereuse)
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  
  // Top-left orange glow
  const grad1 = ctx.createRadialGradient(100, 100, 0, 100, 100, 500);
  grad1.addColorStop(0, "rgba(255, 96, 0, 0.08)");
  grad1.addColorStop(1, "rgba(255, 96, 0, 0)");
  ctx.fillStyle = grad1;
  ctx.fillRect(0, 0, W, H);

  // Bottom-right green glow
  const grad2 = ctx.createRadialGradient(W - 100, H - 100, 0, W - 100, H - 100, 600);
  grad2.addColorStop(0, "rgba(0, 113, 45, 0.06)");
  grad2.addColorStop(1, "rgba(0, 113, 45, 0)");
  ctx.fillStyle = grad2;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // ── 2. Decorative Watermark ──────────────────────────────────────────────────
  drawWatermark(ctx, W, H);

  // ── 3. Main Central Card ─────────────────────────────────────────────────────
  const CARD_M = 48; // Margin
  const CW = W - CARD_M * 2;
  const CH = H - CARD_M * 2;
  const CR = 40; // High border-radius for modern feel

  // Soft drop shadow for elevation
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.06)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = BRAND.white;
  roundRect(ctx, CARD_M, CARD_M, CW, CH, CR);
  ctx.fill();
  ctx.restore();

  // Outer border to card
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(0,0,0,0.05)";
  ctx.stroke();

  // ── 4. Card Header & Logo ──────────────────────────────────────────────────
  drawLogo(ctx, CARD_M + 80, CARD_M + 60, BRAND.funGreen);

  ctx.save();
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.font = "600 16px 'Sora', sans-serif";
  ctx.fillStyle = BRAND.textLight;
  ctx.fillText("ib4me.org", CARD_M + CW - 40, CARD_M + 60);
  ctx.restore();

  // ── 5. Primary Beneficiary Image ──────────────────────────────────────────
  const IMG_Y = CARD_M + 110;
  const IMG_H = 340;
  const IMG_R = 30;
  const IMG_X = CARD_M + 40;
  const IMG_W = CW - 80;

  const photoImg = campaign.imageUrl ? await loadImage(campaign.imageUrl) : null;

  if (photoImg) {
    ctx.save();
    roundRect(ctx, IMG_X, IMG_Y, IMG_W, IMG_H, IMG_R);
    ctx.clip();

    const scale = Math.max(IMG_W / photoImg.width, IMG_H / photoImg.height);
    const sw = IMG_W / scale;
    const sh = IMG_H / scale;
    const sx = (photoImg.width - sw) / 2;
    const sy = (photoImg.height - sh) / 2;
    ctx.drawImage(photoImg, sx, sy, sw, sh, IMG_X, IMG_Y, IMG_W, IMG_H);
    ctx.restore();
  } else {
    // Beautiful placeholder grid pattern
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

  // ── 6. Verification Badge (Floating on image) ─────────────────────────────
  if (campaign.isVerified) {
    const badgeW = 160;
    const badgeH = 36;
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.shadowColor = "rgba(0,0,0,0.1)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    roundRect(ctx, IMG_X + 20, IMG_Y + 20, badgeW, badgeH, 18);
    ctx.fill();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 14px 'Sora', sans-serif";
    ctx.fillStyle = BRAND.funGreen;
    ctx.fillText("✓ Verified", IMG_X + 20 + badgeW / 2, IMG_Y + 20 + badgeH / 2);
    ctx.restore();
  }

  // ── 7. Title & Description Section ──────────────────────────────────────────
  const CONTENT_Y = IMG_Y + IMG_H + 40;
  const beneficiaryName = campaign.beneficiary?.name || campaign.slug || "Campaign Help";
  
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  
  // Clean minimal "HELP SUPPORT" tag
  ctx.font = "bold 14px 'Sora', sans-serif";
  ctx.fillStyle = BRAND.blazeOrange;
  ctx.letterSpacing = "2px";
  ctx.fillText("HELP SUPPORT", IMG_X, CONTENT_Y);

  // Large Bold Title
  let titleFontSize = 48;
  ctx.font = `bold ${titleFontSize}px 'Sora', sans-serif`;
  while (ctx.measureText(beneficiaryName).width > IMG_W && titleFontSize > 28) {
    titleFontSize -= 2;
    ctx.font = `bold ${titleFontSize}px 'Sora', sans-serif`;
  }
  ctx.fillStyle = BRAND.textDark;
  ctx.letterSpacing = "0px";
  ctx.fillText(beneficiaryName, IMG_X, CONTENT_Y + 24);

  // Sub-details (Context agnostic, uses details/institution if provided but graceful if missing)
  const yOffset = CONTENT_Y + 24 + titleFontSize + 16;
  ctx.font = "18px 'Sora', sans-serif";
  ctx.fillStyle = BRAND.textMid;
  
  if (campaign.details || campaign.institution?.name) {
    const detailParts = [];
    if (campaign.details) detailParts.push(campaign.details);
    if (campaign.institution?.name) detailParts.push(`At ${campaign.institution.name}`);
    
    wrapText(ctx, detailParts.join(" • "), IMG_X, yOffset, IMG_W * 0.65, 26);
  } else if (campaign.story) {
    // If no explicit fields, show a snippet of the story
    const shortStory = campaign.story.slice(0, 90).replace(/\s\S+$/, '...'); 
    wrapText(ctx, shortStory, IMG_X, yOffset, IMG_W * 0.65, 26);
  }
  ctx.restore();


  // ── 8. Progress / Goal Section (Right Side) ──────────────────────────────
  const RIGHT_COL_W = 300;
  const RIGHT_COL_X = CARD_M + CW - 40 - RIGHT_COL_W;
  
  // Progress Ring
  const goal = (campaign.goal?.amountMinor ?? 0) / 100;
  const raised = (campaign.totals?.raisedMinor ?? 0) / 100;
  const currency = campaign.goal?.currency || "SLE"; // SLE is Sierra Leone Leones
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  
  const RING_CY = CONTENT_Y + 50;
  const RING_CX = RIGHT_COL_X + RIGHT_COL_W - 60;
  const RING_R = 40;
  const RING_THICKNESS = 8;
  
  // Track
  ctx.save();
  ctx.beginPath();
  ctx.arc(RING_CX, RING_CY, RING_R, 0, Math.PI * 2);
  ctx.lineWidth = RING_THICKNESS;
  ctx.strokeStyle = BRAND.whiteDark;
  ctx.stroke();

  // Progress Arc
  if (pct > 0) {
    ctx.beginPath();
    ctx.arc(RING_CX, RING_CY, RING_R, -Math.PI / 2, (-Math.PI / 2) + ((Math.PI * 2) * (pct / 100)));
    ctx.lineCap = "round";
    ctx.lineWidth = RING_THICKNESS;
    ctx.strokeStyle = BRAND.chartereuse;
    ctx.stroke();
  }
  
  // Percent Text (Centered)
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 20px 'Sora', sans-serif";
  ctx.fillStyle = BRAND.textDark;
  ctx.fillText(`${pct}%`, RING_CX, RING_CY);
  ctx.restore();

  // Text details under ring
  ctx.save();
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  
  ctx.font = "bold 24px 'Sora', sans-serif";
  ctx.fillStyle = BRAND.funGreen;
  ctx.fillText(`${currency} ${raised.toLocaleString()}`, RIGHT_COL_X + RIGHT_COL_W, RING_CY + 60);
  
  ctx.font = "16px 'Sora', sans-serif";
  ctx.fillStyle = BRAND.textLight;
  ctx.fillText(`raised of ${currency} ${goal.toLocaleString()}`, RIGHT_COL_X + RIGHT_COL_W, RING_CY + 90);
  ctx.restore();


  // ── 9. Footer: Call to action & QR Code ─────────────────────────────────────
  const FOOTER_Y = CH + CARD_M - 180;
  
  // Divider
  ctx.strokeStyle = BRAND.divider;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(IMG_X, FOOTER_Y - 30);
  ctx.lineTo(IMG_X + IMG_W, FOOTER_Y - 30);
  ctx.stroke();

  // Scan text CTA
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = "bold 22px 'Sora', sans-serif";
  ctx.fillStyle = BRAND.textDark;
  ctx.fillText("Scan to contribute via Mobile Money", IMG_X, FOOTER_Y + 10);
  
  ctx.font = "16px 'Sora', sans-serif";
  ctx.fillStyle = BRAND.textMid;
  ctx.fillText("Every contribution makes an impact ✨", IMG_X, FOOTER_Y + 44);
  
  // Modern general tagline
  ctx.font = "500 13px 'Sora', sans-serif";
  ctx.fillStyle = BRAND.textLight;
  ctx.fillText("Powered by ib4me — Sierra Leone's Premier Crowdfunding Platform", IMG_X, FOOTER_Y + 110);
  ctx.restore();

  // Draw QR Code
  const QR_SIZE = 140;
  const QR_X = CARD_M + CW - 40 - QR_SIZE;
  const QR_Y = FOOTER_Y - 10;
  
  // Backing for QR Code
  ctx.save();
  ctx.fillStyle = BRAND.white;
  ctx.shadowColor = "rgba(0,0,0,0.05)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, QR_X - 10, QR_Y - 10, QR_SIZE + 20, QR_SIZE + 20, 16);
  ctx.fill();
  ctx.restore();

  const qrCodeUrl = `${baseUrl}/campaigns/${campaign.slug}/donate`;
  // Using pure white background and funGreen dots for a modern aesthetic
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
      1.0 // Maximum quality for beautiful results
    );
  });
}

/** Legacy signature alias - simply forwards to the new modern implementation */
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
