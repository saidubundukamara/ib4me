"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Share2,
  Pencil,
  Settings,
  Loader2,
  Download,
  Trash2,
  TrendingUp,
  BookOpen,
  Megaphone,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Card from "../../_components/Card";
import ProgressBar from "../../_components/ProgressBar";
import DocumentUpload, {
  SelectedFile,
} from "../../_components/DocumentUpload";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  generateCampaignImage,
  downloadImage,
  CampaignImageData,
} from "../../../../utils/imageGenerator";

type CampaignResponse = {
  id: string;
  slug: string;
  urgency: string;
  diagnosis?: string;
  patient?: { name?: string; age?: number; photoUrl?: string | null };
  hospital?: { name?: string };
  goal?: { currency?: string; amountMinor?: number };
  story?: string;
  status: string;
  totals?: { raisedMinor?: number; donationCount?: number };
  verification?: {
    status: "pending" | "under_review" | "approved" | "rejected";
    hospitalVerified?: boolean;
  };
  financial_account?: { uvan?: string };
  imageUrl?: string | null;
};

const ALLOWED_STATUSES = ["draft", "active", "paused", "completed", "archived"] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

// helpers
function compactCurrency(value?: number, currency = "SLL") {
  if (value == null) return `${currency} 0`;
  const n = Math.trunc(value); // assume major units
  const abs = Math.abs(n);

  if (abs >= 1_000_000_000) return `${currency} ${Math.round(n / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${currency} ${Math.round(n / 1_000_000)}M`;
  if (abs >= 1_000) return `${currency} ${Math.round(n / 1_000)}K`;
  return `${currency} ${n.toLocaleString()}`;
}

function compactNumber(value?: number) {
  if (value == null) return "0";
  const n = Math.trunc(value);
  const abs = Math.abs(n);

  if (abs >= 1_000_000_000) return `${Math.round(n / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${Math.round(n / 1_000_000)}M`;
  if (abs >= 1_000) return `${Math.round(n / 1_000)}K`;
  return n.toLocaleString();
}

const CAMPAIGN_TABS = [
  { value: "overview", label: "Overview", icon: TrendingUp },
  { value: "story", label: "Story", icon: BookOpen },
  { value: "updates", label: "Updates", icon: Megaphone },
  { value: "documents", label: "Documents", icon: FolderOpen },
  { value: "actions", label: "Actions", icon: Settings },
] as const;

type CampaignTabValue = (typeof CAMPAIGN_TABS)[number]["value"];

export default function UserCampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [documents, setDocuments] = useState<SelectedFile[]>([]);
  const [updates, setUpdates] = useState<
    { id: string; content: string; createdAt: string }[]
  >([]);
  const [newUpdate, setNewUpdate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [campaign, setCampaign] = useState<CampaignResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [storyDialogOpen, setStoryDialogOpen] = useState(false);
  const [storyDraft, setStoryDraft] = useState("");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusValue, setStatusValue] = useState<AllowedStatus | "">("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<CampaignTabValue>("overview");

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const fetchCampaign = async () => {
      try {
        const [campaignRes, updatesRes] = await Promise.all([
          fetch(`/api/campaigns/${id}`),
          fetch(`/api/campaigns/${id}/updates`),
        ]);

        if (!cancelled) {
          if (campaignRes.ok) {
            const data = (await campaignRes.json()) as CampaignResponse;
            setCampaign(data);
          }

          if (updatesRes.ok) {
            const data = (await updatesRes.json()) as {
              id: string;
              content: string;
              createdAt: string;
            }[];
            setUpdates(data);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCampaign();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const progress = useMemo(() => {
    if (!campaign?.goal?.amountMinor) return 0;
    const raised = campaign?.totals?.raisedMinor ?? 0;
    return Math.min(
      100,
      Math.round((raised / campaign.goal.amountMinor) * 100),
    );
  }, [campaign]);

  const shareUrl = useMemo(() => {
    if (!campaign?.slug) return "";
    if (typeof window !== "undefined" && window.location?.origin) {
      return new URL(`/campaigns/${campaign.slug}`, window.location.origin).toString();
    }
    const fallbackOrigin = process.env.NEXT_PUBLIC_APP_URL;
    if (fallbackOrigin) {
      try {
        return new URL(`/campaigns/${campaign.slug}`, fallbackOrigin).toString();
      } catch {
        const trimmed = fallbackOrigin.endsWith("/") ? fallbackOrigin.slice(0, -1) : fallbackOrigin;
        return `${trimmed}/campaigns/${campaign.slug}`;
      }
    }
    return `/campaigns/${campaign.slug}`;
  }, [campaign?.slug]);

  const copyToClipboard = async (value: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch {
      // fall back to manual copy below
    }

    if (typeof window === "undefined") return false;

    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    const selection = document.getSelection();
    const selected = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (selected && selection) {
      selection.removeAllRanges();
      selection.addRange(selected);
    }
    return copied;
  };

  async function postUpdate() {
    const content = newUpdate.trim();
    if (!content || !id) return;
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

    const url =
      shareUrl ||
      (typeof window !== "undefined" && window.location?.origin
        ? new URL(`/campaigns/${campaign.slug}`, window.location.origin).toString()
        : `/campaigns/${campaign.slug}`);

    setShareLoading(true);
    try {
      const sharePayload: ShareData = {
        title: campaign.patient?.name || campaign.slug,
        text: campaign.story ? campaign.story.slice(0, 140) : "Support this campaign",
        url,
      };

      if (navigator.share && (!navigator.canShare || navigator.canShare(sharePayload))) {
        await navigator.share(sharePayload);
        toast.success("Share dialog opened");
      } else {
        const copied = await copyToClipboard(url);
        if (copied) {
          toast.success("Link copied to clipboard");
        } else {
          toast.info("Copy this link to share the campaign.");
          if (typeof window !== "undefined") {
            window.open(url, "_blank", "noopener,noreferrer");
          }
        }
      }
    } catch (error) {
      const abort = error instanceof DOMException && error.name === "AbortError";
      if (abort) {
        toast.info("Share cancelled.");
      } else {
        console.error("Failed to share campaign", error);
        toast.error("Unable to share this campaign. Please try again.");
      }
    } finally {
      setShareLoading(false);
    }
  }

  async function handlePreview() {
    if (!campaign?.slug || previewLoading) return;
    setPreviewLoading(true);

    try {
      if (typeof window === "undefined" || typeof document === "undefined") {
        toast.error("Image generation not supported in this environment");
        return;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        const url = `/campaigns/${campaign.slug}`;
        window.open(url, "_blank", "noopener,noreferrer");
        toast.error("Canvas not supported in this browser");
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
        financial_account: campaign.financial_account,
        isVerified: campaign.verification?.status === "approved",
        imageUrl: campaign.imageUrl ?? campaign.patient?.photoUrl ?? undefined,
      };

      const baseUrl = window.location.origin;
      const imageBlob = await generateCampaignImage(campaignData, baseUrl);
      downloadImage(imageBlob, `${campaign.slug}-share.png`);
      toast.dismiss(loadingToast);
      toast.success("Shareable image downloaded!");
    } catch (error) {
      toast.dismiss();
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to generate image: ${errorMessage}`);
    } finally {
      setPreviewLoading(false);
    }
  }

  function handleEditStory() {
    if (!campaign || editLoading) return;
    setStoryDraft(campaign.story ?? "");
    setStoryDialogOpen(true);
  }

  async function submitStoryUpdate() {
    if (!campaign || editLoading || !id) return;
    setEditLoading(true);
    try {
      const nextStory = storyDraft.trim();
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story: nextStory }),
      });
      if (!res.ok) throw new Error("Failed to update story");
      setCampaign((prev) => (prev ? { ...prev, story: nextStory } : prev));
      toast.success("Story updated");
      setStoryDialogOpen(false);
    } catch {
      toast.error("Could not update story");
    } finally {
      setEditLoading(false);
    }
  }

  function handleSettings() {
    if (!campaign || settingsLoading) return;
    const fallback = ALLOWED_STATUSES.includes(campaign.status as AllowedStatus)
      ? (campaign.status as AllowedStatus)
      : "draft";
    setStatusValue(fallback);
    setStatusDialogOpen(true);
  }

  async function submitStatusUpdate() {
    if (!campaign || settingsLoading || !id || !statusValue) return;
    if (!ALLOWED_STATUSES.includes(statusValue as AllowedStatus)) {
      toast.error("Invalid status");
      return;
    }
    setSettingsLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusValue }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setCampaign((prev) => (prev ? { ...prev, status: statusValue } : prev));
      toast.success("Status updated");
      setStatusDialogOpen(false);
    } catch {
      toast.error("Could not update status");
    } finally {
      setSettingsLoading(false);
    }
  }

  function handleDelete() {
    if (!campaign || deleteLoading) return;
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (!campaign || deleteLoading || !id) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Campaign deleted");
        setDeleteDialogOpen(false);
        router.push("/dashboard/campaigns");
      } else {
        toast.error("Failed to delete campaign");
      }
    } catch {
      toast.error("Network error deleting campaign");
    } finally {
      setDeleteLoading(false);
    }
  }




  if (!campaign && loading) {
    return (
      <div className="font-Sora">
        <div className="animate-pulse space-y-6">
          <div className="h-16 rounded-3xl bg-muted/50" />
          <div className="grid gap-4 sm:gap-6 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
            <div className="h-60 rounded-3xl bg-muted/50" />
            <div className="h-60 rounded-3xl bg-muted/50" />
            <div className="h-60 rounded-3xl bg-muted/50" />
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="font-Sora">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Campaign not found.</p>
          <Button asChild variant="outline">
            <Link href="/dashboard/campaigns">Back to campaigns</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-Sora mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-border/40  shadow-lg">
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full" />
        <div className="relative flex flex-col gap-6 p-4 sm:p-6 md:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] sm:text-xs font-semibold text-primary">
              Dashboard · Campaign Overview
            </div>
            <div className="space-y-3">
              <h1 className="text-balance text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                {campaign.patient?.name ?? campaign.slug}
              </h1>
              <p className="text-pretty text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Manage every detail of your campaign, update stories, review progress, and keep supporters engaged.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
              <Badge variant="secondary" className="rounded-full border border-border/50 bg-background/80">
                Status: {campaign.status}
              </Badge>
              <Badge variant="outline" className="rounded-full border border-blaze-orange bg-blaze-orange/10  text-blaze-orange">
                Urgency: {campaign.urgency || "n/a"}
              </Badge>
              {campaign.verification?.status ? (
                <Badge variant="outline" className="rounded-full border border-chartereuse bg-chartereuse/10 ">
                  Verification: {campaign.verification.status}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button asChild>
              <Link href="/dashboard/campaigns">Back to campaigns</Link>
            </Button>
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (CAMPAIGN_TABS.some((tab) => tab.value === value)) {
            setActiveTab(value as CampaignTabValue);
          }
        }}
        className="mt-8 space-y-24 sm:space-y-12 lg:space-y-16"
      >
        <TabsList className="grid w-full grid-cols-2 gap-2 rounded-2xl bg-muted/50 p-1 sm:flex sm:flex-wrap sm:gap-2 md:flex-nowrap md:overflow-x-auto lg:overflow-visible">
          {CAMPAIGN_TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex w-full items-center gap-2 whitespace-nowrap rounded-2xl px-3 py-2 text-xs font-medium transition focus-visible:outline-none data-[state=active]:bg-blaze-orange data-[state=active]:text-white data-[state=active]:shadow sm:flex-auto sm:px-4 sm:py-2 sm:text-sm md:w-auto"
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="focus-visible:outline-none">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              <Card className="w-full overflow-hidden rounded-3xl border border-border/40 bg-card p-4 sm:p-6 lg:p-8 shadow-[0_25px_60px_-45px_rgba(15,23,42,0.35)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 lg:gap-6 rounded-2xl border border-border/50 bg-background/70 p-3 sm:p-4">
                    <div className="text-center break-words">
                      <p className="text-xs sm:text-sm text-muted-foreground">Raised</p>
                      <p className="text-base sm:text-lg font-semibold text-primary tabular-nums break-words">
                        {compactCurrency(campaign.totals?.raisedMinor, campaign.goal?.currency || "SLL")}
                      </p>
                    </div>
                    <div className="text-center break-words">
                      <p className="text-xs sm:text-sm text-muted-foreground">Goal</p>
                      <p className="text-base sm:text-lg font-semibold text-foreground tabular-nums break-words">
                        {compactCurrency(campaign.goal?.amountMinor, campaign.goal?.currency || "SLL")}
                      </p>
                    </div>
                    <div className="text-center break-words">
                      <p className="text-xs sm:text-sm text-muted-foreground">Supporters</p>
                      <p className="text-base sm:text-lg font-semibold text-foreground tabular-nums break-words">
                        {compactNumber(campaign.totals?.donationCount ?? 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3 sm:space-y-4">
                  <ProgressBar value={progress} className="h-2 sm:h-3" />
                  <div className="flex flex-col gap-1.5 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:text-sm text-muted-foreground">
                    <span className="break-words">{progress}% of goal reached</span>
                    <span className="break-words">
                      {compactCurrency(campaign.goal?.amountMinor, campaign.goal?.currency || "SLL")} goal
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="w-full overflow-hidden rounded-3xl border border-border/40 bg-card p-4 sm:p-6 shadow-[0_25px_60px_-45px_rgba(15,23,42,0.35)]">
                <h3 className="mb-3 text-base sm:text-lg font-semibold">Campaign Details</h3>
                <dl className="grid grid-cols-1 gap-3 text-xs sm:text-sm sm:grid-cols-2">
                  <div className="min-w-0">
                    <dt className="text-blaze-orange">Patient</dt>
                    <dd className="font-medium text-sm sm:text-xs text-foreground break-words">
                      {campaign.patient?.name || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-blaze-orange">Age</dt>
                    <dd className="font-medium text-foreground text-sm sm:text-xs break-words">
                      {campaign.patient?.age ?? "-"}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-blaze-orange">Hospital</dt>
                    <dd className="font-medium text-foreground break-words sm:text-xs text-sm">
                      {campaign.hospital?.name || "-"}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-blaze-orange">Diagnosis</dt>
                    <dd className="font-medium text-foreground text-sm sm:text-xs break-words">
                      {campaign.diagnosis || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-blaze-orange">Goal amount</dt>
                    <dd className="font-medium text-foreground text-sm sm:text-xs break-words">
                      {compactCurrency(campaign.goal?.amountMinor, campaign.goal?.currency || "SLL")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-blaze-orange">Urgency</dt>
                    <dd className="font-medium text-foreground sm:text-xs text-sm break-words">
                      {campaign.urgency || "Not set"}
                    </dd>
                  </div>
                </dl>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="story" className="focus-visible:outline-none">
          <Card className="w-full overflow-hidden rounded-3xl border border-border/40 bg-card p-4 sm:p-6 md:p-8 shadow-[0_25px_60px_-45px_rgba(15,23,42,0.35)]">
            <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">Campaign Story</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Share the journey to keep supporters connected with your cause.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-2xl sm:w-auto"
                onClick={handleEditStory}
                disabled={editLoading}
              >
                {editLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit story
                  </>
                )}
              </Button>
            </div>
            <p className="whitespace-pre-wrap text-pretty text-xs sm:text-sm leading-relaxed text-muted-foreground break-words">
              {campaign.story || "You haven't added a story yet. Sharing the journey helps supporters connect with your cause."}
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="updates" className="focus-visible:outline-none">
          <Card className="w-full overflow-hidden rounded-3xl border border-border/40 bg-card p-4 sm:p-6 md:p-8 shadow-[0_25px_60px_-45px_rgba(15,23,42,0.35)]">
            <div className="mb-2 sm:mb-4 space-y-1 sm:space-y-2">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Updates</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Keep your community informed about milestones and progress.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2 rounded-2xl border border-border/40 bg-muted/30 p-3 sm:p-4">
                <Label htmlFor="new-update" className="text-sm font-medium text-foreground">
                  Share a new update
                </Label>
                <Textarea
                  id="new-update"
                  value={newUpdate}
                  onChange={(event) => setNewUpdate(event.target.value)}
                  rows={3}
                  placeholder="Celebrate milestones, thank supporters, or share important news"
                  className="rounded-2xl border-border/50"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={postUpdate}
                    disabled={submitting || !newUpdate.trim()}
                    className="rounded-full"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      "Post update"
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {updates.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground break-words">
                    You haven&apos;t posted any updates yet.
                  </p>
                ) : (
                  updates.map((update) => (
                    <div
                      key={update.id}
                      className="rounded-2xl border border-border/40 bg-card/80 p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground break-words"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] sm:text-xs text-muted-foreground">
                        <span className="break-words">{new Date(update.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-foreground break-words">
                        {update.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="focus-visible:outline-none">
          <Card className="w-full overflow-hidden rounded-3xl border border-border/40 bg-card p-4 sm:p-6 md:p-8 shadow-[0_25px_60px_-45px_rgba(15,23,42,0.35)]">
            <div className="mb-2 sm:mb-4 space-y-1 sm:space-y-2">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Supporting Documents</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Upload medical records, photos, or proof for trust.
              </p>
            </div>
            <DocumentUpload value={documents} onChange={setDocuments} />
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="focus-visible:outline-none">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="w-full overflow-hidden rounded-3xl border border-border/40 bg-card p-3 sm:p-4 shadow-[0_25px_60px_-45px_rgba(15,23,42,0.35)]">
              <h3 className="mb-2 text-base sm:text-lg font-semibold">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="secondary"
                  className="w-full justify-start rounded-2xl text-xs sm:text-sm"
                  onClick={handleShare}
                  disabled={shareLoading}
                >
                  {shareLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Share2 className="mr-2 h-4 w-4" />
                  )}
                  Share campaign
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start rounded-2xl text-xs sm:text-sm"
                  onClick={handleEditStory}
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Pencil className="mr-2 h-4 w-4" />
                  )}
                  Edit story
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start rounded-2xl text-xs sm:text-sm"
                  onClick={handlePreview}
                  disabled={previewLoading}
                >
                  {previewLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download share image
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start rounded-2xl text-xs sm:text-sm"
                  onClick={handleSettings}
                  disabled={settingsLoading}
                >
                  {settingsLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Settings className="mr-2 h-4 w-4" />
                  )}
                  Update status
                </Button>
              </div>
            </Card>

            <Card className="w-full overflow-hidden rounded-3xl border border-border/40 bg-card p-4 sm:p-6 shadow-[0_25px_60px_-45px_rgba(15,23,42,0.35)]">
              <h3 className="mb-2 text-base sm:text-lg font-semibold">Withdraw Funds</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Manage payouts securely through your withdrawal dashboard.
              </p>
              <Button variant="outline" className="mt-3 w-full rounded-2xl" asChild>
                <Link href="/dashboard/withdrawals">Go to withdrawals</Link>
              </Button>
            </Card>

            <Card className="w-full overflow-hidden rounded-3xl border border-border/40 bg-card p-4 sm:p-6 shadow-[0_25px_60px_-45px_rgba(15,23,42,0.35)] md:col-span-2">
              <h3 className="mb-2 text-base sm:text-lg font-semibold text-red-600">Danger zone</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Deleting your campaign is permanent and cannot be undone.
              </p>
              <Button
                variant="destructive"
                className="mt-3 w-full rounded-2xl"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete campaign
              </Button>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog
        open={storyDialogOpen}
        onOpenChange={(open) => {
          if (!editLoading) {
            setStoryDialogOpen(open);
            if (!open && campaign) {
              setStoryDraft(campaign.story ?? "");
            }
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit campaign story</DialogTitle>
            <DialogDescription>
              Refresh your story to keep supporters connected to your progress.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={storyDraft}
            onChange={(event) => setStoryDraft(event.target.value)}
            rows={6}
            className="min-h-[160px] rounded-2xl border-border/40"
            placeholder="Share updates, milestones, and heartfelt thanks."
            disabled={editLoading}
          />
          <DialogFooter className="gap-2 sm:gap-3">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={editLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={submitStoryUpdate}
              disabled={editLoading || (campaign?.story ?? "").trim() === storyDraft.trim()}
              className="rounded-2xl"
            >
              {editLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save story"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={statusDialogOpen}
        onOpenChange={(open) => {
          if (!settingsLoading) {
            setStatusDialogOpen(open);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update campaign status</DialogTitle>
            <DialogDescription>
              Choose the stage that best represents where your campaign is right now.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Status</Label>
            <Select
              value={statusValue}
              onValueChange={(value) => setStatusValue(value as AllowedStatus)}
              disabled={settingsLoading}
            >
              <SelectTrigger className="rounded-2xl border-border/40">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {ALLOWED_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:gap-3">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={settingsLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={submitStatusUpdate}
              disabled={settingsLoading || !statusValue}
              className="rounded-2xl"
            >
              {settingsLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save status"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!deleteLoading) {
            setDeleteDialogOpen(open);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this campaign?</DialogTitle>
            <DialogDescription>
              This will permanently remove the campaign and all of its updates. Supporters will no longer be able to
              donate.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-3">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={deleteLoading}>
                Keep campaign
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              className="rounded-2xl"
              onClick={confirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete campaign
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}




