import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";
import { campaignCommentRepository } from "@/repositories/CampaignCommentRepository";
import { campaignRepository } from "@/repositories/CampaignRepository";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return new Response("Invalid campaign id", { status: 400 });
  }

  await connectDB();

  const campaign = await campaignRepository.findById(id);
  if (!campaign) {
    return new Response("Campaign not found", { status: 404 });
  }
  const campaignTitle =
    campaign.beneficiary?.name || campaign.details || "Campaign";

  const comments = await campaignCommentRepository.listByCampaign(
    new mongoose.Types.ObjectId(id),
    20
  );

  const items = comments.map((c) => ({
    author: c.authorName || "Anonymous",
    content: c.content,
  }));

  const count = items.length;

  const mid = Math.ceil(items.length / 2);
  const leftCol = items.slice(0, mid);
  const rightCol = items.slice(mid);

  const pastelBg = "#faf8f5";
  const lineColor = "#e8e0d8";
  const textColor = "#2d2d2d";
  const mutedColor = "#8a8a8a";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: pastelBg,
          display: "flex",
          flexDirection: "column",
          fontFamily: "serif",
          padding: "40px 48px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "28px",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <span
              style={{ fontSize: "28px", fontWeight: "700", color: textColor }}
            >
              Words of support
            </span>
            <span style={{ fontSize: "22px", color: mutedColor }}>
              ({count})
            </span>
          </div>
          <span style={{ fontSize: "14px", color: mutedColor }}>
            {campaignTitle}
          </span>
        </div>

        {/* Divider */}
        <div
          style={{ height: "1px", background: lineColor, marginBottom: "28px" }}
        />

        {/* Book body — two columns */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left page */}
          <div
            style={{
              flex: 1,
              paddingRight: "32px",
              borderRight: `2px solid ${lineColor}`,
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              overflow: "hidden",
            }}
          >
            {leftCol.slice(0, 5).map((item, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: i % 3 === 0 ? "17px" : "14px",
                    color: textColor,
                    fontStyle: i % 2 === 0 ? "italic" : "normal",
                    fontWeight: i % 3 === 0 ? "600" : "400",
                    lineHeight: "1.4",
                  }}
                >
                  {item.content.length > 80
                    ? item.content.slice(0, 80) + "…"
                    : item.content}
                </span>
                <span
                  style={{ fontSize: "12px", color: mutedColor, marginTop: "3px" }}
                >
                  — {item.author}
                </span>
              </div>
            ))}
          </div>

          {/* Right page */}
          <div
            style={{
              flex: 1,
              paddingLeft: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              overflow: "hidden",
            }}
          >
            {rightCol.slice(0, 5).map((item, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: i % 3 === 1 ? "17px" : "14px",
                    color: textColor,
                    fontStyle: i % 2 === 1 ? "italic" : "normal",
                    fontWeight: i % 3 === 1 ? "600" : "400",
                    lineHeight: "1.4",
                  }}
                >
                  {item.content.length > 80
                    ? item.content.slice(0, 80) + "…"
                    : item.content}
                </span>
                <span
                  style={{ fontSize: "12px", color: mutedColor, marginTop: "3px" }}
                >
                  — {item.author}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "20px",
            paddingTop: "12px",
            borderTop: `1px solid ${lineColor}`,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <span style={{ fontSize: "13px", color: mutedColor }}>ib4me.org</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
