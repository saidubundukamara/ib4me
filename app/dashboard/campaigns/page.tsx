"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Plus, Trash2 } from "lucide-react";
import Card from "../_components/Card";
import ProgressBar from "../_components/ProgressBar";
import EditCampaignDialog, { type EditCampaignResult } from "../_components/EditCampaignDialog";
import DeleteCampaignDialog from "../_components/DeleteCampaignDialog";
import CreateCampaignDialog, { type CreateCampaignResult } from "../_components/CreateCampaignDialog";
import { type CampaignFormInitialValues } from "../_components/CampaignFormWizard";
import Image from "next/image";
import { toast } from "sonner";

type UrgencyValue = "low" | "medium" | "high";

type CampaignItem = {
  id: string;
  slug: string;
  title: string;
  status: string;
  urgency?: UrgencyValue | null;
  goalAmount: number;
  goalCurrency: string;
  createdAt: string;
  imageUrl?: string;
  description?: string;
  raised: number;
  donors: number;
  typeOfEmergency?: string;
  diagnosis?: string;
  story?: string;
  patientName?: string;
  hospitalName?: string;
  category?: string;
};

const toTitleCase = (value: string) =>
  value
    ? value
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "Untitled campaign";

const resolveUrgency = (value: unknown): UrgencyValue | undefined => {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }
  return undefined;
};

interface ApiCampaign {
  id?: string;
  _id?: string;
  slug?: string;
  status?: string;
  urgency?: UrgencyValue | string | null;
  goal?: {
    amountMinor?: number | string | null;
    currency?: string;
  };
  totals?: {
    raisedMinor?: number | string | null;
    donationCount?: number | string | null;
  };
  createdAt?: string;
  imageUrl?: string;
  coverImageUrl?: string;
  description?: string;
  story?: string;
  raised?: number | string | null;
  donors?: number | string | null;
  typeOfEmergency?: string;
  diagnosis?: string;
  patient?: {
    name?: string;
  };
  hospital?: {
    name?: string;
  };
  category?: string;
}

const normalizeFromApi = (campaign: ApiCampaign): CampaignItem => {
  const goalAmountMinor = Number(campaign?.goal?.amountMinor ?? 0);
  const goalCurrency = campaign?.goal?.currency ?? "SLE";
  const raisedMinor = Number(campaign?.totals?.raisedMinor ?? 0);
  return {
    id: String(campaign?.id ?? campaign?._id ?? `campaign-${Date.now()}`),
    slug: campaign?.slug ?? `campaign-${Date.now()}`,
    title: toTitleCase(campaign?.slug ?? "untitled-campaign"),
    status: campaign?.status ?? "draft",
    urgency: resolveUrgency(campaign?.urgency) ?? null,
    goalAmount: goalAmountMinor > 0 ? goalAmountMinor / 100 : 0,
    goalCurrency,
    createdAt: campaign?.createdAt ?? new Date().toISOString(),
    imageUrl: campaign?.imageUrl ?? campaign?.coverImageUrl,
    description: campaign?.description ?? campaign?.story ?? "",
    raised: raisedMinor > 0 ? raisedMinor / 100 : Number(campaign?.raised ?? 0),
    donors: Number(campaign?.totals?.donationCount ?? campaign?.donors ?? 0),
    typeOfEmergency: campaign?.typeOfEmergency,
    diagnosis: campaign?.diagnosis,
    story: campaign?.story,
    patientName: campaign?.patient?.name,
    hospitalName: campaign?.hospital?.name,
    category: campaign?.category,
  };
};

const fromFormResult = (
  result: CreateCampaignResult | EditCampaignResult,
  previous?: CampaignItem,
): CampaignItem => {
  const form = result.form;
  const safeGoalAmount = Number.isFinite(form.goal.amountMajor) ? form.goal.amountMajor : 0;
  const title =
    form.title?.trim() ||
    previous?.title ||
    (result.slug ? toTitleCase(result.slug) : "Untitled campaign");

  return {
    id: result.id,
    slug: result.slug,
    title,
    status: result.status ?? previous?.status ?? "active",
    urgency: form.urgency ?? previous?.urgency ?? null,
    goalAmount: safeGoalAmount >= 0 ? safeGoalAmount : previous?.goalAmount ?? 0,
    goalCurrency: form.goal.currency || previous?.goalCurrency || "SLE",
    createdAt: result.createdAt ?? previous?.createdAt ?? result.updatedAt ?? new Date().toISOString(),
    imageUrl: previous?.imageUrl,
    description: form.description || form.story || previous?.description || "",
    raised: previous?.raised ?? 0,
    donors: previous?.donors ?? 0,
    typeOfEmergency: form.typeOfEmergency || previous?.typeOfEmergency,
    diagnosis: form.diagnosis || previous?.diagnosis,
    story: form.story || previous?.story,
    patientName: form.patient.name || previous?.patientName,
    hospitalName: form.hospital.name || previous?.hospitalName,
    category: form.category || previous?.category,
  };
};

export default function UserCampaignsPage() {
  const [items, setItems] = React.useState<CampaignItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingCampaign, setEditingCampaign] = React.useState<CampaignItem | null>(null);
  const [editInitialValues, setEditInitialValues] = React.useState<CampaignFormInitialValues | undefined>();
  const [editLoading, setEditLoading] = React.useState(false);
  const [deletingCampaign, setDeletingCampaign] = React.useState<CampaignItem | null>(null);

  React.useEffect(() => {
    fetch("/api/campaigns")
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setItems(Array.isArray(data) ? data.map(normalizeFromApi) : []);
        }
      })
      .catch(() => {
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreateCampaign = React.useCallback((result: CreateCampaignResult) => {
    setItems((prev) => [fromFormResult(result), ...prev]);
  }, []);

  const handleUpdateCampaign = React.useCallback(
    (result: EditCampaignResult) => {
      setItems((prev) =>
        prev.map((item) => (item.id === result.id ? fromFormResult(result, item) : item)),
      );
      setEditingCampaign(null);
      setEditInitialValues(undefined);
    },
    [],
  );

  const handleOpenEdit = React.useCallback((campaign: CampaignItem) => {
    setEditingCampaign(campaign);
    setEditInitialValues(undefined);
    setEditLoading(true);
    fetch(`/api/campaigns/${campaign.id}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to load campaign details");
        }
        const data = await res.json();
        const goalAmountMinor = Number(data?.goal?.amountMinor ?? 0);
        const initial: CampaignFormInitialValues = {
          title: campaign.title,
          typeOfEmergency: data?.typeOfEmergency ?? campaign.typeOfEmergency ?? "",
          urgency: resolveUrgency(data?.urgency) ?? resolveUrgency(campaign.urgency) ?? "medium",
          diagnosis: data?.diagnosis ?? campaign.diagnosis ?? "",
          description: campaign.description ?? "",
          category: campaign.category ?? "",
          patient: {
            name: data?.patient?.name ?? campaign.patientName ?? "",
            ...(data?.patient?.age !== undefined ? { age: data.patient.age } : {}),
          },
          hospital: {
            name: data?.hospital?.name ?? campaign.hospitalName ?? "",
          },
          goal: {
            currency: data?.goal?.currency ?? campaign.goalCurrency ?? "SLE",
            amountMajor: goalAmountMinor > 0 ? goalAmountMinor / 100 : campaign.goalAmount,
          },
          story: data?.story ?? campaign.story ?? "",
        };
        setEditInitialValues(initial);
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to load campaign details",
        );
        setEditingCampaign(null);
        setEditInitialValues(undefined);
      })
      .finally(() => setEditLoading(false));
  }, []);

  const handleDeleteCampaign = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setDeletingCampaign(null);
  }, []);

  // Responsive Skeleton + List
  const SkeletonCard = () => (
    <Card className="p-4 sm:p-6 border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all rounded-3xl overflow-hidden animate-pulse">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        <div className="w-full h-40 sm:h-48 lg:w-48 lg:h-48 bg-muted rounded-2xl" />
        <div className="flex-1 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                <div className="h-7 sm:h-8 w-40 sm:w-48 bg-muted rounded" />
                <div className="h-5 sm:h-6 w-14 sm:w-16 bg-muted rounded" />
              </div>
              <div className="h-3.5 sm:h-4 w-full bg-muted rounded" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3.5 sm:h-4 w-14 sm:w-16 bg-muted rounded" />
              <div className="h-3.5 sm:h-4 w-8 bg-muted rounded" />
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 sm:h-3" />
            <div className="flex justify-between items-center">
              <div className="h-5 sm:h-6 w-20 sm:w-24 bg-muted rounded" />
              <div className="h-3.5 sm:h-4 w-14 sm:w-16 bg-muted rounded" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="h-9 w-24 bg-muted rounded-xl" />
            <div className="h-9 w-32 bg-muted rounded-xl" />
            <div className="h-9 w-24 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">My Campaigns</h2>
          <Button className="rounded-2xl w-full sm:w-auto" disabled>
            <span className="mr-2">+</span> Create Campaign
          </Button>
        </div>

        <div className="grid gap-4 sm:gap-6 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">My Campaigns</h2>
        <Button className="rounded-2xl w-full sm:w-auto" onClick={() => setIsCreateOpen(true)}>
          <span className="mr-2">
            <Plus />
          </span>
          Create Campaign
        </Button>
      </div>

      <div className="grid gap-4 sm:gap-6 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
        {items.length === 0 ? (
          <Card className="p-4 sm:p-6 border-0 shadow-[var(--shadow-soft)] rounded-3xl col-span-full">
            <div className="text-sm text-muted-foreground">No campaigns yet. Create your first campaign.</div>
          </Card>
        ) : (
          items.map((campaign) => {
            const goalAmount = campaign.goalAmount;
            const raisedAmount = Number.isFinite(campaign.raised) ? campaign.raised : 0;
            const progress =
              goalAmount > 0 ? Math.min(100, Math.round((raisedAmount / goalAmount) * 100)) : 0;
            const formattedGoal =
              goalAmount > 0
                ? `${campaign.goalCurrency} ${goalAmount.toLocaleString()}`
                : "No goal";
            const statusLabel = campaign.status
              ? campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)
              : "Unknown";

            return (
              <Card
                key={campaign.id}
                className="p-4 sm:p-6 border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all rounded-3xl overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                  <Image
                    src={campaign.imageUrl || "/placeholder.png"}
                    alt={campaign.title}
                    width={192}
                    height={192}
                    className="w-full h-40 sm:h-48 lg:w-48 lg:h-48 object-cover rounded-2xl"
                  />

                  <div className="flex-1 space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                          <h3 className="font-bold text-foreground text-xl sm:text-2xl truncate">
                            {campaign.title}
                          </h3>
                          <Badge className="bg-success/10 text-success border-success">{statusLabel}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold text-foreground">{progress}%</span>
                      </div>
                      <ProgressBar value={progress} className="w-full h-2.5 sm:h-3 rounded-full" />
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <span className="text-xl sm:text-2xl font-bold text-primary">
                            {campaign.goalCurrency} {raisedAmount.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground"> raised of {formattedGoal}</span>
                        </div>
                        <span className="text-xs sm:text-sm text-muted-foreground">{campaign.donors} donors</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => handleOpenEdit(campaign)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Link href={`/user/campaigns/${campaign.id}`}>
                        <Button variant="outline" size="sm" className="rounded-xl">
                          View Campaign
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-destructive hover:text-destructive"
                        onClick={() => setDeletingCampaign(campaign)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <CreateCampaignDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSave={handleCreateCampaign}
      />

      {editingCampaign && (
        <EditCampaignDialog
          open={Boolean(editingCampaign)}
          onOpenChange={(open) => {
            if (!open) {
              setEditingCampaign(null);
              setEditInitialValues(undefined);
              setEditLoading(false);
            }
          }}
          campaignId={editingCampaign.id}
          slug={editingCampaign.slug}
          status={editingCampaign.status}
          initialValues={editInitialValues}
          loading={editLoading}
          onSave={handleUpdateCampaign}
        />
      )}

      {deletingCampaign && (
        <DeleteCampaignDialog
          open={Boolean(deletingCampaign)}
          onOpenChange={(open) => {
            if (!open) setDeletingCampaign(null);
          }}
          campaignTitle={deletingCampaign.title}
          onConfirm={() => handleDeleteCampaign(deletingCampaign.id)}
        />
      )}
    </div>
  );
}
