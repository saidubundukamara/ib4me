
"use client";

type PageParams = {
  params: Promise<{ id: string }>;
};

import React from "react";
import Card from "../../_components/../_components/Card";
import ProgressBar from "../../_components/../_components/ProgressBar";
import DocumentUpload, { SelectedFile } from "../../_components/../_components/DocumentUpload";
import { toast } from "sonner";
import { generateCampaignImage, downloadImage, CampaignImageData } from "../../../../utils/imageGenerator";

export default function UserCampaignDetailPage({ params }: PageParams) {
  const [documents, setDocuments] = React.useState<SelectedFile[]>([]);
  const { id } = React.use(params);
  const [updates, setUpdates] = React.useState<{ id: string; content: string; createdAt: string }[]>([]);
  const [newUpdate, setNewUpdate] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [shareLoading, setShareLoading] = React.useState<boolean>(false);
  const [editLoading, setEditLoading] = React.useState<boolean>(false);
  const [previewLoading, setPreviewLoading] = React.useState<boolean>(false);
  const [settingsLoading, setSettingsLoading] = React.useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = React.useState<boolean>(false);
  const [campaign, setCampaign] = React.useState<null | {
    id: string;
    slug: string;
    urgency: string;
    diagnosis?: string;
    patient?: { name?: string; age?: number };
    hospital?: { name?: string };
    goal?: { currency?: string; amountMinor?: number };
    story?: string;
    status: string;
    totals?: { raisedMinor?: number; donationCount?: number };
    verification?: { status: "pending" | "under_review" | "approved" | "rejected"; hospitalVerified?: boolean };
    financial_account?: { uvan?: string };
  }>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    fetch(`/api/campaigns/${id}`).then(async (r) => {
      if (r.ok) {
        const data = await r.json();
        setCampaign(data);
      }
    }).finally(() => setLoading(false));
    fetch(`/api/campaigns/${id}/updates`).then(async (r) => {
      if (r.ok) {
        const data = await r.json();
        setUpdates(data);
      }
    }).catch(() => undefined);
  }, [id]);

  

  async function postUpdate() {
    const content = newUpdate.trim();
    if (!content) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const created = await res.json();
        setUpdates((prev) => [created, ...prev]);
        setNewUpdate("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleShare() {
    if (!campaign?.slug || shareLoading) return;
    
    setShareLoading(true);
    try {
      const shareUrl = `${window.location.origin}/campaigns/${campaign.slug}`;
      const shareData = {
        title: campaign.slug,
        text: campaign.story ? campaign.story.slice(0, 140) : "Support this campaign",
        url: shareUrl,
      };
      
      if (navigator.share) {
        await navigator.share(shareData as ShareData);
        toast.success("Share dialog opened");
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard");
      }
    } catch {
      toast.error("Unable to share");
    } finally {
      setShareLoading(false);
    }
  }

  async function handlePreview() {
    if (!campaign?.slug || previewLoading) return;
    
    setPreviewLoading(true);

    try {
      // Check if we're in the browser environment
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        toast.error("Image generation not supported in this environment");
        return;
      }

      // Check for Canvas support
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        toast.error("Canvas not supported in this browser");
        // Fallback to original behavior
        const url = `/campaigns/${campaign.slug}`;
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      const loadingToast = toast.loading("Generating shareable image...");
      
      const campaignData: CampaignImageData = {
        slug: campaign.slug,
        patient: campaign.patient,
        hospital: campaign.hospital,
        diagnosis: campaign.diagnosis,
        goal: campaign.goal,
        totals: campaign.totals,
        story: campaign.story,
        urgency: campaign.urgency,
        financial_account: campaign.financial_account
      };
      
      const baseUrl = window.location.origin;
      const imageBlob = await generateCampaignImage(campaignData, baseUrl);
      const filename = `${campaign.slug}-share.png`;
      
      downloadImage(imageBlob, filename);
      toast.dismiss(loadingToast);
      toast.success("Shareable image downloaded!");
    } catch (error) {
      toast.dismiss();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to generate image: ${errorMessage}`);
      console.error("Image generation error:", error);
      
      // Fallback to original behavior
      const url = `/campaigns/${campaign.slug}`;
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleEditStory() {
    if (!campaign || editLoading) return;
    
    const current = campaign.story || "";
    const updated = window.prompt("Edit campaign story", current);
    if (updated === null) return; // cancelled
    
    setEditLoading(true);
    try {
      const nextStory = updated.trim();
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story: nextStory }),
      });
      if (!res.ok) throw new Error("Failed to update story");
      setCampaign((prev) => (prev ? { ...prev, story: nextStory } : prev));
      toast.success("Story updated");
    } catch {
      toast.error("Could not update story");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleSettings() {
    if (!campaign || settingsLoading) return;
    
    const current = campaign.status;
    const next = window.prompt(
      "Set campaign status (draft, active, paused, completed, archived)",
      current
    );
    if (next === null) return; // cancelled
    
    const allowed = ["draft", "active", "paused", "completed", "archived"] as const;
    if (!allowed.includes(next as typeof allowed[number])) {
      toast.error("Invalid status");
      return;
    }
    
    setSettingsLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setCampaign((prev) => (prev ? { ...prev, status: next } : prev));
      toast.success("Status updated");
    } catch {
      toast.error("Could not update status");
    } finally {
      setSettingsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">{campaign?.slug || `Campaign #${id}`}</h2>
            {campaign && <span className="text-xs rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5">{campaign.status}</span>}
            {campaign?.verification?.status && (
              <span className="text-xs rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">
                verification: {campaign.verification.status}
              </span>
            )}
            {campaign && <span className="text-xs rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">urgency: {campaign.urgency}</span>}
          </div>
          <p className="text-sm text-gray-600 mt-1">Manage details, documents, updates and withdrawals.</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/dashboard/withdrawals" className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm shadow hover:bg-indigo-700 transition">Withdraw</a>
          <button
            onClick={async () => {
              if (!confirm("Delete this campaign?") || deleteLoading) return;
              setDeleteLoading(true);
              try {
                const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
                if (res.ok) {
                  window.location.href = "/dashboard/campaigns";
                } else {
                  toast.error("Failed to delete campaign");
                }
              } catch {
                toast.error("Network error deleting campaign");
              } finally {
                setDeleteLoading(false);
              }
            }}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={deleteLoading}
          >{deleteLoading ? "Deleting..." : "Delete"}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4">
            <h3 className="font-medium">Overview</h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border p-3 bg-white/70 dark:bg-white/5">
                <div className="text-xs text-gray-500">Raised</div>
                <div className="text-xl font-semibold">
                  {(campaign?.goal?.currency || "SLE")} {((campaign?.totals?.raisedMinor ?? 0) / 100).toLocaleString()}
                </div>
              </div>
              <div className="rounded-xl border p-3 bg-white/70 dark:bg-white/5">
                <div className="text-xs text-gray-500">Target</div>
                <div className="text-xl font-semibold">
                  {(campaign?.goal?.currency || "SLE")} {((campaign?.goal?.amountMinor ?? 0) / 100).toLocaleString()}
                </div>
              </div>
              <div className="rounded-xl border p-3 bg-white/70 dark:bg-white/5">
                <div className="text-xs text-gray-500">Donors</div>
                <div className="text-xl font-semibold">{campaign?.totals?.donationCount ?? 0}</div>
              </div>
            </div>
            <div className="mt-4">
              {(() => {
                const raised = campaign?.totals?.raisedMinor ?? 0;
                const target = campaign?.goal?.amountMinor ?? 0;
                const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
                return (
                  <>
                    <ProgressBar value={pct} />
                    <div className="mt-1 text-xs text-gray-500">{pct}% of goal</div>
                  </>
                );
              })()}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-medium">Story</h3>
            <p className="text-sm text-gray-600 mt-2 leading-6 whitespace-pre-wrap">
              {loading ? "Loading..." : (campaign?.story || "No story provided.")}
            </p>
          </Card>

          <Card className="p-4">
            <h3 className="font-medium">Documents</h3>
            <div className="mt-3">
              <DocumentUpload value={documents} onChange={setDocuments} />
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-medium">Updates</h3>
            <div className="mt-3 space-y-3">
              <div className="rounded-xl border p-3 bg-white/70 dark:bg-white/5">
                <textarea
                  value={newUpdate}
                  onChange={(e) => setNewUpdate(e.target.value)}
                  rows={3}
                  placeholder="Share a progress note or milestone..."
                  className="w-full rounded-lg border px-3 py-2 text-sm bg-white/80 dark:bg-white/5"
                />
                <div className="mt-2 flex items-center justify-end">
                  <button onClick={postUpdate} disabled={submitting || !newUpdate.trim()} className="rounded-lg bg-indigo-600 disabled:opacity-50 text-white px-3 py-1.5 text-xs hover:bg-indigo-700">Post update</button>
                </div>
              </div>

              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                {updates.length === 0 && <li className="text-gray-500">No updates yet.</li>}
                {updates.map((u) => (
                  <li key={u.id} className="rounded-xl border p-3 bg-white/70 dark:bg-white/5">
                    <div className="text-xs text-gray-500">{new Date(u.createdAt).toLocaleString()}</div>
                    <div className="mt-1 whitespace-pre-wrap">{u.content}</div>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-medium">Campaign Details</h3>
            <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Patient</dt>
                <dd>{campaign?.patient?.name || "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Age</dt>
                <dd>{campaign?.patient?.age ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Hospital</dt>
                <dd>{campaign?.hospital?.name || "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Diagnosis</dt>
                <dd>{campaign?.diagnosis || "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Emergency</dt>
                <dd>{campaign?.slug || "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Goal</dt>
                <dd>{campaign?.goal?.currency || "SLE"} {(campaign?.goal?.amountMinor ?? 0) / 100}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-4">
            <h3 className="font-medium">Quick Actions</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <button 
                onClick={handleShare} 
                className="rounded-lg border px-3 py-2 hover:bg-indigo-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={shareLoading}
              >
                {shareLoading ? "Sharing..." : "Share"}
              </button>
              <button 
                onClick={handleEditStory} 
                className="rounded-lg border px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={editLoading}
              >
                {editLoading ? "Saving..." : "Edit"}
              </button>
              <button 
                onClick={handlePreview} 
                className="rounded-lg border px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={previewLoading}
              >
                {previewLoading ? "Generating..." : "Download Share Image"}
              </button>
              <button 
                onClick={handleSettings} 
                className="rounded-lg border px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={settingsLoading}
              >
                {settingsLoading ? "Saving..." : "Settings"}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


