export interface CampaignImageData {
  slug: string;
  patient?: { name?: string; age?: number };
  hospital?: { name?: string };
  diagnosis?: string;
  goal?: { currency?: string; amountMinor?: number };
  totals?: { raisedMinor?: number; donationCount?: number };
  story?: string;
  urgency?: string;
  financial_account?: { uvan?: string };
}

// Simple QR code generation using a service (fallback approach)
function generateQRCodeDataURL(text: string, size: number = 280): string {
  // Using QR Server API as a fallback
  const encodedText = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}&format=png&bgcolor=ffffff&color=000000&qzone=1`;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
}

export async function generateCampaignImageLegacy(
  campaign: CampaignImageData,
  baseUrl: string
): Promise<Blob> {
  // Ensure we're in the browser environment
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Image generation only works in browser environment");
  }

  console.log("Generating campaign image for campaign:", campaign);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Set canvas dimensions for mobile-friendly sharing (1080x1080 square)
  const width = 1080;
  const height = 1080;
  canvas.width = width;
  canvas.height = height;

  try {
    // Create gradient background (green theme inspired by sample)
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#065f46"); // Dark green
    gradient.addColorStop(1, "#10b981"); // Emerald green
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Load and draw IB4ME logo/title
    ctx.fillStyle = "white";
    ctx.font = "bold 64px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("IB4ME", width / 2, 120);

    // Add tagline
    ctx.font = "24px Arial, sans-serif";
    ctx.fillText("Medical Emergency Crowdfunding", width / 2, 160);

    // Create QR code container with white background and rounded corners
    const qrContainer = {
      x: (width - 320) / 2,
      y: 220,
      width: 320,
      height: 320,
      borderRadius: 20,
    };

    // Draw white rounded background for QR code
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.roundRect(
      qrContainer.x,
      qrContainer.y,
      qrContainer.width,
      qrContainer.height,
      qrContainer.borderRadius
    );
    ctx.fill();

    // Generate QR code URL - links directly to the donate page
    const qrCodeUrl = `${baseUrl}/campaigns/${campaign.slug}/donate`;
    const qrImageUrl = generateQRCodeDataURL(qrCodeUrl, 280);

    const qrImage = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load QR code"));
      img.src = qrImageUrl;
    });

    // Draw QR code centered in the container
    const qrX = qrContainer.x + (qrContainer.width - 280) / 2;
    const qrY = qrContainer.y + (qrContainer.height - 280) / 2;
    ctx.drawImage(qrImage, qrX, qrY, 280, 280);

    // Campaign information section
    const infoY = 580;

    ctx.fillStyle = "white";
    ctx.font = "32px Arial, sans-serif";
    ctx.textAlign = "center";

    // Different text based on whether we have payment URL or campaign URL
    const qrText = campaign.financial_account?.uvan
      ? "Scan to donate directly via mobile money:"
      : "Scan to view and donate to this campaign:";
    ctx.fillText(qrText, width / 2, infoY);

    // Campaign title (patient name or slug)
    const campaignTitle = campaign.patient?.name
      ? `${campaign.patient.name}'s Medical Treatment`
      : campaign.slug;

    ctx.font = "bold 36px Arial, sans-serif";

    // Handle long titles by wrapping text
    if (campaignTitle.length > 30) {
      ctx.font = "bold 28px Arial, sans-serif";
      wrapText(
        ctx,
        `"${campaignTitle}"`,
        width / 2,
        infoY + 50,
        width - 100,
        35
      );
    } else {
      ctx.fillText(`"${campaignTitle}"`, width / 2, infoY + 50);
    }

    // Progress information
    const raised = (campaign.totals?.raisedMinor ?? 0) / 100;
    const goal = (campaign.goal?.amountMinor ?? 0) / 100;
    const currency = campaign.goal?.currency || "SLE";
    const percentage =
      goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

    ctx.font = "28px Arial, sans-serif";
    ctx.fillText(
      `${currency} ${raised.toLocaleString()} raised of ${currency} ${goal.toLocaleString()} goal`,
      width / 2,
      infoY + 120
    );
    ctx.fillText(
      `${percentage}% funded • ${campaign.totals?.donationCount ?? 0} donors`,
      width / 2,
      infoY + 160
    );

    // Additional details if available
    let detailY = infoY + 200;
    if (campaign.hospital?.name) {
      ctx.font = "24px Arial, sans-serif";
      ctx.fillText(`Hospital: ${campaign.hospital.name}`, width / 2, detailY);
      detailY += 35;
    }

    if (campaign.diagnosis) {
      ctx.font = "24px Arial, sans-serif";
      // Handle long diagnosis text
      if (campaign.diagnosis.length > 40) {
        const lines = campaign.diagnosis.match(/.{1,40}(\s|$)/g) || [
          campaign.diagnosis,
        ];
        lines.forEach((line, index) => {
          ctx.fillText(
            `${index === 0 ? "Diagnosis: " : ""}${line.trim()}`,
            width / 2,
            detailY + index * 30
          );
        });
        detailY += lines.length * 30 + 5;
      } else {
        ctx.fillText(`Diagnosis: ${campaign.diagnosis}`, width / 2, detailY);
        detailY += 35;
      }
    }

    if (campaign.urgency) {
      ctx.font = "24px Arial, sans-serif";
      ctx.fillText(`Urgency: ${campaign.urgency}`, width / 2, detailY);
      detailY += 35;
    }

    // Call to action at bottom
    ctx.font = "bold 28px Arial, sans-serif";
    ctx.fillStyle = "#fbbf24"; // Amber color for emphasis
    ctx.fillText(
      "Every donation makes a difference! 💚",
      width / 2,
      height - 80
    );

    ctx.fillStyle = "white";
    ctx.font = "20px Arial, sans-serif";
    ctx.fillText(
      "Powered by IB4ME - Sierra Leone's Medical Crowdfunding Platform",
      width / 2,
      height - 40
    );

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to generate image"));
          }
        },
        "image/png",
        0.9
      );
    });
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}

// Base template image path
const BASE_TEMPLATE_PATH = "/assets/campaign_base.png";

export async function generateCampaignImage(
  campaign: CampaignImageData,
  baseUrl: string
): Promise<Blob> {
  // Ensure we're in the browser environment
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Image generation only works in browser environment");
  }

  console.log("Generating campaign image for campaign:", campaign);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Set canvas dimensions for mobile-friendly sharing (1080x1080 square)
  const width = 1080;
  const height = 1080;
  canvas.width = width;
  canvas.height = height;

  try {
    // Load and draw the base template image
    const templateImage = await new Promise<HTMLImageElement>(
      (resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load base template"));
        img.src = BASE_TEMPLATE_PATH;
      }
    );

    // Draw the template as background
    ctx.drawImage(templateImage, 0, 0, width, height);

    // Campaign information section (top area)
    // Based on reference image: labels left-aligned, values aligned after labels
    const contentStartY = 140; // Moved down from 100
    const labelX = 165; // Left margin for labels
    const valueX = 470; // X position where values start (aligned for all rows)

    // Name row
    ctx.font = "bold 36px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = "#047857"; // Green for label
    ctx.fillText("Name:", labelX, contentStartY);
    ctx.fillStyle = "#1F2937"; // Dark gray for value
    const patientName = campaign.patient?.name || "Patient";
    ctx.fillText(patientName, valueX, contentStartY);

    // Diagnosis row
    ctx.fillStyle = "#047857";
    ctx.fillText("Diagnosis:", labelX, contentStartY + 60);
    ctx.fillStyle = "#1F2937";
    const diagnosis = campaign.diagnosis || "Medical Treatment";
    if (diagnosis.length > 25) {
      ctx.font = "bold 32px Arial, sans-serif";
    }
    ctx.fillText(diagnosis, valueX, contentStartY + 60);
    ctx.font = "bold 36px Arial, sans-serif";

    // Campaign Goal row
    ctx.fillStyle = "#047857";
    ctx.fillText("Campaign Goal:", labelX, contentStartY + 120);
    ctx.fillStyle = "#1F2937";
    const goal = (campaign.goal?.amountMinor ?? 0) / 100;
    const goalFormatted = `LE ${goal.toLocaleString()}`;
    ctx.fillText(goalFormatted, valueX, contentStartY + 120);

    // Call to action - single line, centered
    const ctaY = contentStartY + 210;
    ctx.font = "bold 26px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#1F2937";
    ctx.fillText("Scan To Donate Directly Via", width / 2 - 90, ctaY);

    // "Mobile Money" in orange - on same line
    ctx.fillStyle = "#F97316";
    ctx.fillText("Mobile Money", width / 2 + 175, ctaY);

    // QR Code section
    const qrContainerSize = 320;
    const qrContainer = {
      x: (width - qrContainerSize) / 2,
      y: ctaY + 60, // Space below CTA text
      width: qrContainerSize,
      height: qrContainerSize,
      borderRadius: 24,
    };

    // Draw green rounded background for QR code
    ctx.fillStyle = "#047857";
    ctx.beginPath();
    ctx.roundRect(
      qrContainer.x,
      qrContainer.y,
      qrContainer.width,
      qrContainer.height,
      qrContainer.borderRadius
    );
    ctx.fill();

    // Generate QR code URL - links directly to the donate page
    const qrCodeUrl = `${baseUrl}/campaigns/${campaign.slug}/donate`;

    // Generate QR with white background and green color
    const qrSize = 280;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrCodeUrl)}&format=png&bgcolor=ffffff&color=047857&qzone=2`;

    const qrImage = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load QR code"));
      img.src = qrImageUrl;
    });

    // Draw QR code centered in the container
    const qrX = qrContainer.x + (qrContainer.width - qrSize) / 2;
    const qrY = qrContainer.y + (qrContainer.height - qrSize) / 2;
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to generate image"));
          }
        },
        "image/png",
        0.9
      );
    });
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}

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
