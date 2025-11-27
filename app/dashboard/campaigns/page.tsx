"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Plus, Trash2 } from "lucide-react";
import Card from "../_components/Card";
import ProgressBar from "../_components/ProgressBar";
import CampaignFormWizard, {
  type CampaignFormInitialValues,
  type CampaignFormSubmitPayload,
} from "../_components/CampaignFormWizard";
import DeleteCampaignDialog from "../_components/DeleteCampaignDialog";
import CampaignLimitBanner from "../_components/CampaignLimitBanner";
import VerificationRequiredBanner from "../_components/VerificationRequiredBanner";
import VerificationRequiredModal from "../_components/VerificationRequiredModal";
import { toast } from "sonner";

interface CampaignLimitInfo {
  allowed: boolean;
  currentCount: number;
  maxAllowed: number;
  userType: "individual" | "organization";
  remainingSlots: number | null;
  verification?: {
    verified: boolean;
    status?: "not_started" | "pending" | "under_review" | "approved" | "rejected";
    reason?: string;
    type: "kyc" | "kyb";
  };
}

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

type CreateCampaignResult = {
  id: string;
  slug: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  form: CampaignFormSubmitPayload;
};

type EditCampaignResult = {
  id: string;
  slug: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  form: CampaignFormSubmitPayload;
};

const toTitleCase = (value: string) =>
  value
    ? value
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
    : "Untitled campaign";

const generateSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

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
    goalCurrency: form.goal.currency || previous?.goalCurrency || "SLL",
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

const FALLBACK_CAMPAIGN_IMAGE = "/assets/Create-fundraiser.jpg";

const normalizeCampaignImageSrc = (value?: string): string => {
  if (!value) return FALLBACK_CAMPAIGN_IMAGE;
  const trimmed = value.trim();
  if (!trimmed) return FALLBACK_CAMPAIGN_IMAGE;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed.replace(/^\/+/, "")}`;
};

const isRemoteImageSrc = (src: string): boolean =>
  /^https?:\/\//i.test(src) || src.startsWith("data:");

export default function UserCampaignsPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<CampaignItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingCampaign, setEditingCampaign] = React.useState<CampaignItem | null>(null);
  const [editInitialValues, setEditInitialValues] = React.useState<CampaignFormInitialValues | undefined>();
  const [editLoading, setEditLoading] = React.useState(false);
  const [createSubmitting, setCreateSubmitting] = React.useState(false);
  const [editSubmitting, setEditSubmitting] = React.useState(false);
  const [deletingCampaign, setDeletingCampaign] = React.useState<CampaignItem | null>(null);
  const [limitInfo, setLimitInfo] = React.useState<CampaignLimitInfo | null>(null);
  const [showVerificationModal, setShowVerificationModal] = React.useState(false);

  const refreshLimitInfo = React.useCallback(async () => {
    try {
      const res = await fetch("/api/user/campaign-limits");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLimitInfo(data.data);
        }
      }
    } catch (error) {
      console.error("Failed to refresh campaign limits:", error);
    }
  }, []);

  React.useEffect(() => {
    Promise.all([
      fetch("/api/campaigns").then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setItems(Array.isArray(data) ? data.map(normalizeFromApi) : []);
        }
      }),
      fetch("/api/user/campaign-limits").then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          if (data.success) {
            setLimitInfo(data.data);
          }
        }
      })
    ])
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

  const handleCancelCreate = React.useCallback(() => {
    setIsCreateOpen(false);
    setCreateSubmitting(false);
  }, []);

  const handleCancelEdit = React.useCallback(() => {
    setEditingCampaign(null);
    setEditInitialValues(undefined);
    setEditLoading(false);
    setEditSubmitting(false);
  }, []);

  const submitCreateCampaign = React.useCallback(
    async (formValues: CampaignFormSubmitPayload) => {
      if (createSubmitting) return;
      setCreateSubmitting(true);
      const formData = new FormData();
      const slug = generateSlug(formValues.title || `campaign-${Date.now()}`);
      formData.set("slug", slug);
      if (formValues.diagnosis) formData.set("diagnosis", formValues.diagnosis);
      if (formValues.typeOfEmergency)
        formData.set("typeOfEmergency", formValues.typeOfEmergency);
      formData.set("urgency", formValues.urgency);
      formData.set("patient.name", formValues.patient.name);
      if (formValues.patient.age !== undefined) {
        formData.set("patient.age", String(formValues.patient.age));
      }
      if (formValues.patient.photo) {
        formData.set("patientPhoto", formValues.patient.photo);
      }
      if (formValues.hospital.hospitalId) {
        formData.set("hospital.hospitalId", formValues.hospital.hospitalId);
      }
      if (formValues.hospital.name) {
        formData.set("hospital.name", formValues.hospital.name);
      }
      if (formValues.description) {
        formData.set("description", formValues.description);
      }
      if (formValues.category) {
        formData.set("category", formValues.category);
      }
      const amountMinor = Math.max(0, Math.round(formValues.goal.amountMajor * 100));
      formData.set("goal.currency", formValues.goal.currency);
      formData.set("goal.amountMinor", String(amountMinor));
      formData.set("story", formValues.story);
      if (formValues.documents?.length) {
        formValues.documents.forEach((file, index) => {
          if (file) {
            formData.append(`documents[${index}]`, file);
          }
        });
      }

      try {
        const res = await fetch("/api/campaigns", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));

          // Handle campaign limit exceeded error specifically
          if (err.code === "CAMPAIGN_LIMIT_EXCEEDED") {
            toast.error(
              `Campaign limit reached. You can have up to ${limitInfo?.maxAllowed ?? "a limited number of"} active campaigns.`
            );
            await refreshLimitInfo();
            setIsCreateOpen(false);
            return;
          }

          throw new Error(err.error || "Failed to create campaign");
        }

        const data = await res.json().catch(() => ({}));
        toast.success("Campaign created successfully!");
        handleCreateCampaign({
          id: data.id ?? `campaign-${Date.now()}`,
          slug: data.slug ?? slug,
          status: data.status ?? "active",
          createdAt: data.createdAt ?? new Date().toISOString(),
          form: formValues,
        });
        setIsCreateOpen(false);

        // Show verification modal if user is not verified
        if (data.ownerVerification && !data.ownerVerification.verified) {
          setShowVerificationModal(true);
        }

        // Refresh limit info after successful creation
        await refreshLimitInfo();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create campaign",
        );
        throw error;
      } finally {
        setCreateSubmitting(false);
      }
    },
    [createSubmitting, handleCreateCampaign, limitInfo?.maxAllowed, refreshLimitInfo],
  );

  const submitEditCampaign = React.useCallback(
    async (values: CampaignFormSubmitPayload) => {
      if (!editingCampaign || editSubmitting) return;
      setEditSubmitting(true);

      const formData = new FormData();

      // Basic text fields
      if (values.diagnosis) formData.set("diagnosis", values.diagnosis);
      if (values.typeOfEmergency) formData.set("typeOfEmergency", values.typeOfEmergency);
      formData.set("urgency", values.urgency);
      if (values.category) formData.set("category", values.category);
      formData.set("patient.name", values.patient.name);
      if (values.patient.age !== undefined) {
        formData.set("patient.age", String(values.patient.age));
      }
      if (values.hospital.hospitalId) {
        formData.set("hospital.hospitalId", values.hospital.hospitalId);
      }
      if (values.hospital.name) {
        formData.set("hospital.name", values.hospital.name);
      }

      // Goal
      const amountMinor = Math.max(0, Math.round(values.goal.amountMajor * 100));
      formData.set("goal.currency", values.goal.currency);
      formData.set("goal.amountMinor", String(amountMinor));

      // Story
      if (values.story) formData.set("story", values.story);

      // Patient photo
      if (values.patient.photo) {
        formData.set("patientPhoto", values.patient.photo);
      }
      if (values.patient.removePhoto) {
        formData.set("removePatientPhoto", "true");
      }

      // New documents
      if (values.documents?.length) {
        values.documents.forEach((file, index) => {
          if (file) {
            formData.append(`documents[${index}]`, file);
          }
        });
      }

      // Removed documents
      if (values.removedDocumentIds?.length) {
        formData.set("removedDocumentIds", JSON.stringify(values.removedDocumentIds));
      }

      try {
        const res = await fetch(`/api/campaigns/${editingCampaign.id}`, {
          method: "PATCH",
          body: formData, // No Content-Type header - browser sets it with boundary
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to update campaign");
        }

        toast.success("Campaign updated successfully!");
        handleUpdateCampaign({
          id: editingCampaign.id,
          slug: editingCampaign.slug,
          status: editingCampaign.status,
          updatedAt: new Date().toISOString(),
          form: values,
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update campaign",
        );
        throw error;
      } finally {
        setEditSubmitting(false);
      }
    },
    [editSubmitting, editingCampaign, handleUpdateCampaign],
  );

  const handleOpenEdit = React.useCallback((campaign: CampaignItem) => {
    setIsCreateOpen(false);
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

        // Build existing patient photo if available
        let existingPatientPhoto;
        if (data?.patient?.photoUrl && data?.patient?.photoAssetId) {
          existingPatientPhoto = {
            id: "existing-patient-photo",
            previewUrl: data.patient.photoUrl,
            existingAssetId: data.patient.photoAssetId,
            isExisting: true,
          };
        }

        // Build existing documents with URLs
        const existingDocuments = (data?.documents || [])
          .filter((doc: { assetId?: string; url?: string }) => doc.assetId && doc.url)
          .map((doc: { type?: string; assetId: string; url: string }, i: number) => ({
            id: `existing-doc-${i}`,
            previewUrl: doc.url,
            existingAssetId: doc.assetId,
            isExisting: true,
            fileName: `Document ${i + 1}`,
            fileType: doc.type || "application/octet-stream",
          }));

        const initial: CampaignFormInitialValues = {
          title: campaign.title,
          typeOfEmergency: data?.typeOfEmergency ?? campaign.typeOfEmergency ?? "",
          urgency: resolveUrgency(data?.urgency) ?? resolveUrgency(campaign.urgency) ?? "medium",
          diagnosis: data?.diagnosis ?? campaign.diagnosis ?? "",
          description: campaign.description ?? "",
          category: data?.category ?? campaign.category ?? "",
          patient: {
            name: data?.patient?.name ?? campaign.patientName ?? "",
            ...(data?.patient?.age !== undefined ? { age: data.patient.age } : {}),
            ...(existingPatientPhoto ? { photo: existingPatientPhoto } : {}),
          },
          hospital: {
            hospitalId: data?.hospital?.hospitalId ?? undefined,
            name: data?.hospital?.name ?? campaign.hospitalName ?? "",
          },
          goal: {
            currency: data?.goal?.currency ?? campaign.goalCurrency ?? "SLE",
            amountMajor: goalAmountMinor > 0 ? goalAmountMinor / 100 : campaign.goalAmount,
          },
          story: data?.story ?? campaign.story ?? "",
          documents: existingDocuments,
        };
        setEditInitialValues(initial);
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to load campaign details",
        );
        handleCancelEdit();
      })
      .finally(() => setEditLoading(false));
  }, [handleCancelEdit]);

  const handleDeleteCampaign = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setDeletingCampaign(null);
  }, []);

  // Responsive Skeleton + List
  const SkeletonCard = () => (
    <Card className="p-4 sm:p-6 border-0 shadow-[var(--shadow-soft)] rounded-3xl overflow-hidden animate-pulse">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Image Placeholder */}
        <div className="h-48 sm:h-56 lg:h-48 w-full sm:w-64 lg:w-56 bg-muted rounded-2xl" />

        {/* Content */}
        <div className="flex-1 space-y-3 sm:space-y-4">
          {/* Title + Badge */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                <div className="h-7 sm:h-8 w-40 sm:w-56 bg-muted rounded" />
                <div className="h-5 sm:h-6 w-14 sm:w-16 bg-muted rounded" />
              </div>
              <div className="h-3.5 sm:h-4 w-full bg-muted rounded" />
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3.5 sm:h-4 w-14 sm:w-16 bg-muted rounded" />
              <div className="h-3.5 sm:h-4 w-8 bg-muted rounded" />
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 sm:h-3" />
            <div className="flex justify-between items-center">
              <div className="h-5 sm:h-6 w-24 sm:w-32 bg-muted rounded" />
              <div className="h-3.5 sm:h-4 w-16 sm:w-20 bg-muted rounded" />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
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

        <div className="grid grid-cols-1 gap-4">
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
        <Button
          className="rounded-2xl w-full sm:w-auto"
          disabled={!isCreateOpen && limitInfo !== null && !limitInfo.allowed}
          title={
            !isCreateOpen && limitInfo !== null && !limitInfo.allowed
              ? `You've reached your limit of ${limitInfo.maxAllowed} active campaigns`
              : undefined
          }
          onClick={() => {
            if (isCreateOpen) {
              handleCancelCreate();
            } else {
              // Check limit before opening form
              if (limitInfo && !limitInfo.allowed) {
                toast.error(
                  `Campaign limit reached. You can have up to ${limitInfo.maxAllowed} active campaigns.`
                );
                return;
              }
              handleCancelEdit();
              setIsCreateOpen(true);
            }
          }}
        >
          <span className="mr-2">
            <Plus />
          </span>
          {isCreateOpen ? "Close Form" : "Create Campaign"}
        </Button>
      </div>

      {/* Verification Required Banner */}
      {limitInfo?.verification && !limitInfo.verification.verified && limitInfo.verification.status !== "approved" && (
        <VerificationRequiredBanner
          verificationStatus={limitInfo.verification.status as "not_started" | "pending" | "under_review" | "rejected" ?? "not_started"}
          verificationType={limitInfo.verification.type}
          rejectionReason={
            limitInfo.verification.status === "rejected"
              ? limitInfo.verification.reason
              : undefined
          }
        />
      )}

      {/* Campaign Limit Banner - only shows when near or at limit */}
      {limitInfo && limitInfo.maxAllowed !== Infinity && (
        <CampaignLimitBanner
          currentCount={limitInfo.currentCount}
          maxAllowed={limitInfo.maxAllowed}
          userType={limitInfo.userType}
        />
      )}

      {isCreateOpen ? (
        <Card className="w-full overflow-hidden rounded-3xl border border-border/40 bg-card shadow-[0_25px_60px_-45px_rgba(15,23,42,0.35)]">
          <div className="flex flex-col gap-4 p-5 sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-foreground sm:text-2xl">Create Campaign</h3>
                <p className="text-sm text-muted-foreground">
                  Provide accurate details to help donors understand the need.
                </p>
              </div>
              <Button
                variant="ghost"
                className="self-start sm:self-auto rounded-2xl"
                onClick={handleCancelCreate}
                disabled={createSubmitting}
              >
                Cancel
              </Button>
            </div>
            <CampaignFormWizard
              mode="create"
              isOpen={isCreateOpen}
              onSubmit={submitCreateCampaign}
              submitLabel="Create Campaign"
            />
          </div>
        </Card>
      ) : null}

      {editingCampaign ? (
        <Card className="w-full overflow-hidden rounded-3xl border border-border/40 bg-card shadow-[0_25px_60px_-45px_rgba(15,23,42,0.35)]">
          <div className="flex flex-col gap-4 p-5 sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-foreground sm:text-2xl">
                  Edit Campaign: {editingCampaign.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Adjust campaign details and keep supporters up to date.
                </p>
              </div>
              <Button
                variant="ghost"
                className="self-start sm:self-auto rounded-2xl"
                onClick={handleCancelEdit}
                disabled={editSubmitting}
              >
                Cancel
              </Button>
            </div>
            {editLoading ? (
              <div className="rounded-2xl border border-border/40 bg-muted/30 p-6 animate-pulse text-sm text-muted-foreground">
                Loading campaign...
              </div>
            ) : (
              <CampaignFormWizard
                mode="edit"
                isOpen={Boolean(editingCampaign)}
                initialValues={editInitialValues}
                onSubmit={submitEditCampaign}
                submitLabel="Save Changes"
              />
            )}
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6">
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
            const imageSrc = normalizeCampaignImageSrc(campaign.imageUrl);
            const isRemoteImage = isRemoteImageSrc(imageSrc);

            return (

              <Card
                key={campaign.id}
                className="p-4 sm:p-6 border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all rounded-3xl overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 overflow-hidden">
                  {/* Image */}
                  <div className="flex-shrink-0 w-full sm:w-64 lg:w-56">
                    <Image
                      src={imageSrc}
                      alt={campaign.title}
                      width={224}
                      height={224}
                      unoptimized={isRemoteImage}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="w-full h-48 sm:h-56 lg:h-48 rounded-2xl object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-between space-y-3 sm:space-y-4 overflow-hidden">
                    {/* Title and Description */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 overflow-hidden">
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2 overflow-hidden">
                          <h3 className="font-bold text-xs sm:text-sm lg:text-lg text-foreground truncate max-w-full">
                            {campaign.title}
                          </h3>
                          <Badge className="bg-primary/10 text-primary border-primary flex-shrink-0 whitespace-nowrap hover:bg-primary/20">
                            {statusLabel}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 break-words">
                          {campaign.description}
                        </p>
                      </div>
                    </div>

                    {/* Progress Section */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold text-foreground">{progress}%</span>
                      </div>
                      <ProgressBar value={progress} className="w-full h-2.5 sm:h-3 rounded-full" />

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-base sm:text-lg lg:text-xl font-bold text-primary whitespace-nowrap">
                            {campaign.goalCurrency} {raisedAmount.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground whitespace-nowrap">
                            raised of {formattedGoal}
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                          {campaign.donors} donors
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="rounded-xl flex-1 sm:flex-none min-w-[90px]"
                        onClick={() => handleOpenEdit(campaign)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>

                      <Link href={`/dashboard/campaigns/${campaign.id}`} className="flex-1 sm:flex-none min-w-[130px]">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl w-full justify-center"
                        >
                          View Campaign
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-destructive hover:text-destructive flex-1 sm:flex-none min-w-[90px]"
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

      {/* Verification Required Modal - shown after campaign creation for unverified users */}
      <VerificationRequiredModal
        open={showVerificationModal}
        onOpenChange={setShowVerificationModal}
        verificationStatus={(limitInfo?.verification?.status === "approved" ? "not_started" : limitInfo?.verification?.status) ?? "not_started"}
        verificationType={limitInfo?.verification?.type ?? "kyc"}
        onGoToVerification={() => {
          setShowVerificationModal(false);
          router.push("/dashboard/verification");
        }}
      />
    </div>
  );
}
