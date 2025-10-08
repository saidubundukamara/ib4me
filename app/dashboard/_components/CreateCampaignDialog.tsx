"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import CampaignFormWizard, {
  CampaignFormSubmitPayload,
} from "./CampaignFormWizard";

function generateSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export type CreateCampaignResult = {
  id: string;
  slug: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  form: CampaignFormSubmitPayload;
};

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (result: CreateCampaignResult) => void;
}

const CreateCampaignDialog: React.FC<CreateCampaignDialogProps> = ({
  open,
  onOpenChange,
  onSave,
}) => {
  const handleSubmit = React.useCallback(
    async (formValues: CampaignFormSubmitPayload) => {
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
      formData.set(
        "goal.amountMinor",
        String(amountMinor),
      );
      formData.set("story", formValues.story);

      try {
        const res = await fetch("/api/campaigns", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to create campaign");
        }

        const data = await res.json().catch(() => ({}));
        toast.success("Campaign created successfully!");
        onSave({
          id: data.id ?? `campaign-${Date.now()}`,
          slug: data.slug ?? slug,
          status: "active",
          createdAt: new Date().toISOString(),
          form: formValues,
        });
        onOpenChange(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create campaign",
        );
        throw error;
      }
    },
    [onOpenChange, onSave],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Start a Campaign</DialogTitle>
          <DialogDescription>
            Provide accurate details to help donors understand the need.
          </DialogDescription>
        </DialogHeader>
        <CampaignFormWizard
          mode="create"
          isOpen={open}
          onSubmit={handleSubmit}
          submitLabel="Create Campaign"
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateCampaignDialog;
