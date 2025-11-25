"use client";

import React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import DocumentUpload, { SelectedFile } from "./DocumentUpload";
import PatientImageUpload, { SelectedImage } from "./PatientImageUpload";

const steps = [
  { number: 1, label: "Details" },
  { number: 2, label: "Patient" },
  { number: 3, label: "Goal" },
  { number: 4, label: "Story" },
  { number: 5, label: "Documents" },
  { number: 6, label: "Review" },
] as const;

export type CampaignFormSubmitPayload = {
  title: string;
  typeOfEmergency: string;
  urgency: "low" | "medium" | "high";
  diagnosis: string;
  description: string;
  category: string;
  patient: {
    name: string;
    age?: number;
    photo?: File;
    removePhoto?: boolean;  // Flag to remove existing photo
  };
  hospital: { name: string };
  goal: { currency: string; amountMajor: number };
  story: string;
  documents?: File[];
  removedDocumentIds?: string[];  // IDs of documents to remove
};

export type CampaignFormInitialValues = Partial<{
  title: string;
  typeOfEmergency: string;
  urgency: "low" | "medium" | "high";
  diagnosis: string;
  description: string;
  category: string;
  patient: {
    name: string;
    age?: number;
    photo?: SelectedImage;  // Can be existing (with URL) or new
  };
  hospital: { name: string };
  goal: { currency: string; amountMajor: number };
  story: string;
  documents?: SelectedFile[];  // Can include existing docs
}>;

interface CampaignFormWizardProps {
  mode: "create" | "edit";
  isOpen: boolean;
  initialValues?: CampaignFormInitialValues;
  onSubmit: (values: CampaignFormSubmitPayload) => Promise<void>;
  submitLabel?: string;
}

const defaultCurrency = "SLE";

const CampaignFormWizard: React.FC<CampaignFormWizardProps> = ({
  mode,
  isOpen,
  initialValues,
  onSubmit,
  submitLabel,
}) => {
  const [currentStep, setCurrentStep] = React.useState<number>(1);
  const [title, setTitle] = React.useState("");
  const [typeOfEmergency, setTypeOfEmergency] = React.useState("");
  const [urgency, setUrgency] = React.useState<"low" | "medium" | "high">("medium");
  const [diagnosis, setDiagnosis] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [patientName, setPatientName] = React.useState("");
  const [patientAge, setPatientAge] = React.useState<string>("");
  const [patientPhoto, setPatientPhoto] = React.useState<SelectedImage | null>(null);
  const [hospitalName, setHospitalName] = React.useState("");
  const [goalAmount, setGoalAmount] = React.useState<string>("");
  const [story, setStory] = React.useState("");
  const [documents, setDocuments] = React.useState<SelectedFile[]>([]);
  const [removedDocumentIds, setRemovedDocumentIds] = React.useState<string[]>([]);
  const [removePatientPhoto, setRemovePatientPhoto] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const resetState = React.useCallback(() => {
    setCurrentStep(1);
    setTitle("");
    setTypeOfEmergency("");
    setUrgency("medium");
    setDiagnosis("");
    setDescription("");
    setCategory("");
    setPatientName("");
    setPatientAge("");
    setPatientPhoto(null);
    setHospitalName("");
    setGoalAmount("");
    setStory("");
    setDocuments([]);
    setRemovedDocumentIds([]);
    setRemovePatientPhoto(false);
    setErrors({});
  }, []);

  React.useEffect(() => {
    if (!isOpen) {
      if (mode === "create") resetState();
      return;
    }
    if (initialValues) {
      setTitle(initialValues.title ?? "");
      setTypeOfEmergency(initialValues.typeOfEmergency ?? "");
      setUrgency(initialValues.urgency ?? "medium");
      setDiagnosis(initialValues.diagnosis ?? "");
      setDescription(initialValues.description ?? "");
      setCategory(initialValues.category ?? "");
      setPatientName(initialValues.patient?.name ?? "");
      setPatientAge(
        initialValues.patient?.age !== undefined && initialValues.patient?.age !== null
          ? String(initialValues.patient?.age)
          : "",
      );
      setPatientPhoto(initialValues.patient?.photo ?? null);
      setHospitalName(initialValues.hospital?.name ?? "");
      setGoalAmount(
        initialValues.goal?.amountMajor !== undefined && initialValues.goal?.amountMajor !== null
          ? String(initialValues.goal.amountMajor)
          : "",
      );
      setStory(initialValues.story ?? "");
      setDocuments(initialValues.documents ?? []);
    } else if (mode === "create") {
      resetState();
    }
  }, [initialValues, isOpen, mode, resetState]);

  const validate = React.useCallback(
    (step: number) => {
      const nextErrors: Record<string, string> = {};
      if (step === 1) {
        if (!title.trim()) nextErrors.title = "Title is required";
      }
      if (step === 2) {
        if (!patientName.trim()) nextErrors.patientName = "Patient name is required";
        if (!category.trim()) nextErrors.category = "Category is required";
      }
      if (step === 3) {
        if (!goalAmount.trim()) nextErrors.goalAmount = "Goal amount is required";
        else if (Number.parseFloat(goalAmount) <= 0)
          nextErrors.goalAmount = "Enter a valid goal amount";
      }
      if (step === 4) {
        if (!story.trim()) nextErrors.story = "Story is required";
      }
      setErrors(nextErrors);
      return Object.keys(nextErrors).length === 0;
    },
    [category, goalAmount, patientName, story, title],
  );

  const handleNext = React.useCallback(() => {
    if (!validate(currentStep)) return;
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  }, [currentStep, validate]);

  const handleBack = React.useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (!validate(currentStep)) return;
    const amountMajor = Number.parseFloat(goalAmount);
    const trimmedAge = patientAge.trim();
    const parsedAge =
      trimmedAge.length > 0 ? Number.parseInt(trimmedAge, 10) : undefined;
    setIsSubmitting(true);
    try {
      // Extract only new document files (not existing ones)
      const newDocumentFiles = documents
        .filter((d) => !d.isExisting && d.file)
        .map((d) => d.file as File);

      await onSubmit({
        title: title.trim(),
        typeOfEmergency: typeOfEmergency.trim(),
        urgency,
        diagnosis: diagnosis.trim(),
        description: description.trim(),
        category: category.trim(),
        patient: {
          name: patientName.trim(),
          ...(Number.isFinite(parsedAge as number) ? { age: parsedAge } : {}),
          // Only include photo file if it's a new upload
          ...(patientPhoto && !patientPhoto.isExisting && patientPhoto.file
            ? { photo: patientPhoto.file }
            : {}),
          // Include removePhoto flag if we're removing an existing photo
          ...(removePatientPhoto ? { removePhoto: true } : {}),
        },
        hospital: { name: hospitalName.trim() },
        goal: {
          currency: defaultCurrency,
          amountMajor: Number.isFinite(amountMajor) && amountMajor > 0 ? amountMajor : 0,
        },
        story: story.trim(),
        documents: newDocumentFiles,
        removedDocumentIds: removedDocumentIds.length > 0 ? removedDocumentIds : undefined,
      });
      if (mode === "create") {
        resetState();
      }
    } catch (error) {
      console.error("Failed to submit campaign form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    diagnosis,
    documents,
    goalAmount,
    hospitalName,
    mode,
    onSubmit,
    patientAge,
    patientName,
    patientPhoto,
    resetState,
    story,
    title,
    typeOfEmergency,
    urgency,
    validate,
    currentStep,
    category,
    description,
    removePatientPhoto,
    removedDocumentIds,
  ]);

  const reviewItems = [
    { label: "Title", value: title || "-", key: "title" as const },
    { label: "Emergency Type", value: typeOfEmergency || "-", key: "emergency" as const },
    { label: "Category", value: category || "-", key: "category" as const },
    {
      label: "Urgency",
      value: (
        <Badge variant={urgency === "high" ? "destructive" : "outline"}>
          {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
        </Badge>
      ),
      key: "urgency" as const,
    },
    { label: "Diagnosis", value: diagnosis || "-", key: "diagnosis" as const },
    { label: "Patient Details", value: description || "-", key: "description" as const },
    {
      label: "Patient",
      value: `${patientName} ${patientAge ? `(${patientAge})` : ""}`.trim() || "—",
      key: "patient" as const,
    },
    {
      label: "Patient Photo",
      value: patientPhoto
        ? patientPhoto.isExisting
          ? "Current photo (existing)"
          : patientPhoto.file?.name || "Photo selected"
        : "No photo",
      key: "patientPhoto" as const,
    },
    { label: "Hospital", value: hospitalName || "—", key: "hospital" as const },
    {
      label: "Goal",
      value: `${defaultCurrency} ${goalAmount || 0}`,
      key: "goal" as const,
    },
    { label: "Documents", value: `${documents.length} file(s)`, key: "documents" as const },
  ];

  return (
    <div className="py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Stepper */}
      <div className="px-3 sm:px-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-3 sm:mx-0 px-3 sm:px-0">
          {steps.map((step) => (
            <div key={step.number} className="flex items-center flex-none sm:flex-1 min-w-[84px]">
              <div className="flex flex-col items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold transition-all ${currentStep > step.number
                    ? "bg-primary text-primary-foreground"
                    : currentStep === step.number
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                    }`}
                  aria-current={currentStep === step.number ? "step" : undefined}
                  aria-label={`Step ${step.number}`}
                >
                  {currentStep > step.number ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : step.number}
                </div>
                <span
                  className={`text-[11px] sm:text-xs font-medium hidden md:block ${currentStep >= step.number ? "text-foreground" : "text-muted-foreground"
                    }`}
                >
                  {step.label}
                </span>
              </div>

              {step.number < steps.length && (
                <div
                  className={`h-0.5 mx-2 w-6 sm:w-auto flex-none sm:flex-1 ${currentStep > step.number ? "bg-primary" : "bg-muted"
                    }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="min-h-[280px] sm:min-h-[300px] space-y-4">
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Help with surgery"
                className="rounded-2xl my-2"
                disabled={mode === "edit"}
              />
              {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
            </div>

            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="emergency">Emergency Type</Label>
                <Input
                  id="emergency"
                  value={typeOfEmergency}
                  onChange={(e) => setTypeOfEmergency(e.target.value)}
                  placeholder="Surgery, Accident, etc"
                  className="rounded-2xl my-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency</Label>
                <Select value={urgency} onValueChange={(value) => setUrgency(value as typeof urgency)}>
                  <SelectTrigger className="rounded-2xl my-2">
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Input
                  id="diagnosis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Condition"
                  className="rounded-2xl my-2"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="patient-name">Patient Name</Label>
              <Input
                id="patient-name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Full name"
                className="rounded-2xl my-2"
              />
              {errors.patientName && <p className="text-sm text-destructive mt-1">{errors.patientName}</p>}
            </div>

            <PatientImageUpload
              value={patientPhoto}
              onChange={(image, removeExisting) => {
                setPatientPhoto(image);
                if (removeExisting) {
                  setRemovePatientPhoto(true);
                }
              }}
              label="Patient Photo (Optional)"
            />

            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="patient-age">Age</Label>
                <Input
                  id="patient-age"
                  type="number"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder="e.g. 42"
                  className="rounded-2xl my-2"
                />
              </div>
              <div className="sm:col-span-1 md:col-span-2 space-y-2">
                <Label htmlFor="hospital-name">Hospital Name</Label>
                <Input
                  id="hospital-name"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="Hospital"
                  className="rounded-2xl my-2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient-description">Patient Information</Label>
              <Textarea
                id="patient-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about the patient and their condition..."
                className="rounded-2xl min-h-[140px] my-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="rounded-2xl my-2">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Medical Emergency">Medical Emergency</SelectItem>
                  <SelectItem value="Heart Surgery">Heart Surgery</SelectItem>
                  <SelectItem value="Cancer Treatment">Cancer Treatment</SelectItem>
                  <SelectItem value="Medical Support">Medical Support</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive mt-1">{errors.category}</p>}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="goal-currency">Currency</Label>
                <Input
                  id="goal-currency"
                  value={defaultCurrency}
                  readOnly
                  className="rounded-2xl my-2 bg-muted text-muted-foreground"
                />
              </div>
              <div className="sm:col-span-1 md:col-span-2 space-y-2">
                <Label htmlFor="goal">Goal Amount</Label>
                <Input
                  id="goal"
                  type="number"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  placeholder="5000"
                  className="rounded-2xl text-xl sm:text-2xl font-semibold my-2"
                />
                {errors.goalAmount && <p className="text-sm text-destructive mt-1">{errors.goalAmount}</p>}
                <p className="text-sm text-muted-foreground">Enter the total amount needed for treatment</p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="story">Story</Label>
              <Textarea
                id="story"
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Explain the situation, how funds will be used, and timelines."
                className="rounded-2xl min-h-[180px] sm:min-h-[200px] my-2"
              />
              {errors.story && <p className="text-sm text-destructive mt-1">{errors.story}</p>}
              <p className="text-sm text-muted-foreground">
                A compelling story helps donors understand and connect with your campaign
              </p>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Medical Documents</Label>
              <DocumentUpload
                value={documents}
                onChange={(files, removedIds) => {
                  setDocuments(files);
                  setRemovedDocumentIds(removedIds);
                }}
              />
              <p className="text-xs text-muted-foreground mt-2">Supported: images and PDFs. Max 5 files.</p>
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-base sm:text-lg">Review</h3>
            <div className="space-y-3 p-3 sm:p-4 bg-muted/30 rounded-2xl">
              {reviewItems.map((item) => (
                <div key={item.key}>
                  <p className="text-sm text-muted-foreground">{item.label}:</p>
                  <p className="font-semibold text-foreground">
                    {typeof item.value === "string" ? item.value : item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-3 sm:pt-4 border-t px-3 sm:px-0">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className="rounded-2xl w-full sm:w-auto"
          >
            Back
          </Button>

          {currentStep < steps.length ? (
            <Button onClick={handleNext} className="rounded-2xl w-full sm:w-auto" disabled={isSubmitting}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="rounded-2xl w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting
                ? mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : submitLabel ?? (mode === "create" ? "Create Campaign" : "Save Changes")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignFormWizard;
