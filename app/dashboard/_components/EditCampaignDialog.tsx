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
  CampaignFormInitialValues,
  CampaignFormSubmitPayload,
} from "./CampaignFormWizard";

export type EditCampaignResult = {
  id: string;
  slug: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  form: CampaignFormSubmitPayload;
};

interface EditCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string | null;
  slug: string;
  status?: string;
  initialValues?: CampaignFormInitialValues;
  loading?: boolean;
  onSave: (result: EditCampaignResult) => void;
}

const EditCampaignDialog: React.FC<EditCampaignDialogProps> = ({
  open,
  onOpenChange,
  campaignId,
  slug,
  status,
  initialValues,
  loading,
  onSave,
}) => {
  const handleSubmit = React.useCallback(
    async (values: CampaignFormSubmitPayload) => {
      if (!campaignId) return;
      const amountMinor = Math.max(0, Math.round(values.goal.amountMajor * 100));
      const payload: Record<string, unknown> = {
        diagnosis: values.diagnosis,
        typeOfEmergency: values.typeOfEmergency,
        urgency: values.urgency,
        patient: {
          name: values.patient.name,
          ...(values.patient.age !== undefined
            ? { age: values.patient.age }
            : {}),
        },
        hospital: { name: values.hospital.name },
        goal: {
          currency: values.goal.currency,
          amountMinor,
        },
        story: values.story,
      };

      try {
        const res = await fetch(`/api/campaigns/${campaignId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to update campaign");
        }

        toast.success("Campaign updated successfully!");
        onSave({
          id: campaignId,
          slug,
          status,
          updatedAt: new Date().toISOString(),
          form: values,
        });
        onOpenChange(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update campaign",
        );
        throw error;
      }
    },
    [campaignId, onOpenChange, onSave, slug, status],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Campaign</DialogTitle>
          <DialogDescription>
            Update your campaign details below.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading campaign...</div>
        ) : (
          <CampaignFormWizard
            mode="edit"
            isOpen={open}
            initialValues={initialValues}
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditCampaignDialog;
