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
  { number: 2, label: "Beneficiary" },
  { number: 3, label: "Goal" },
  { number: 4, label: "Story" },
  { number: 5, label: "Documents" },
  { number: 6, label: "Review" },
] as const;

export type CampaignFormSubmitPayload = {
  title: string;
  campaignType: string;
  urgency: "low" | "medium" | "high";
  details: string;
  description: string;
  category: string;
  beneficiary: {
    name: string;
    age?: number;
    photo?: File;
    removePhoto?: boolean;  // Flag to remove existing photo
  };
  institution: { name: string };
  goal: { currency: string; amountMajor: number };
  story: string;
  documents?: File[];
  removedDocumentIds?: string[];  // IDs of documents to remove
};

export type CampaignFormInitialValues = Partial<{
  title: string;
  campaignType: string;
  urgency: "low" | "medium" | "high";
  details: string;
  description: string;
  category: string;
  beneficiary: {
    name: string;
    age?: number;
    photo?: SelectedImage;  // Can be existing (with URL) or new
  };
  institution: { name: string };
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

interface CategoryOption {
  _id: string;
  name: string;
  slug: string;
}

const CampaignFormWizard: React.FC<CampaignFormWizardProps> = ({
  mode,
  isOpen,
  initialValues,
  onSubmit,
  submitLabel,
}) => {
  const [currentStep, setCurrentStep] = React.useState<number>(1);
  const [title, setTitle] = React.useState("");
  const [availableCategories, setAvailableCategories] = React.useState<CategoryOption[]>([]);
  const [campaignType, setCampaignType] = React.useState("");
  const [urgency, setUrgency] = React.useState<"low" | "medium" | "high">("medium");
  const [details, setDetails] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [beneficiaryName, setBeneficiaryName] = React.useState("");
  const [beneficiaryAge, setBeneficiaryAge] = React.useState<string>("");
  const [beneficiaryPhoto, setBeneficiaryPhoto] = React.useState<SelectedImage | null>(null);
  const [institution, setInstitution] = React.useState<{ name: string }>({ name: "" });
  const [goalAmount, setGoalAmount] = React.useState<string>("");
  const [story, setStory] = React.useState("");
  const [documents, setDocuments] = React.useState<SelectedFile[]>([]);
  const [removedDocumentIds, setRemovedDocumentIds] = React.useState<string[]>([]);
  const [removeBeneficiaryPhoto, setRemoveBeneficiaryPhoto] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const resetState = React.useCallback(() => {
    setCurrentStep(1);
    setTitle("");
    setCampaignType("");
    setUrgency("medium");
    setDetails("");
    setDescription("");
    setCategory("");
    setBeneficiaryName("");
    setBeneficiaryAge("");
    setBeneficiaryPhoto(null);
    setInstitution({ name: "" });
    setGoalAmount("");
    setStory("");
    setDocuments([]);
    setRemovedDocumentIds([]);
    setRemoveBeneficiaryPhoto(false);
    setErrors({});
  }, []);

  // Fetch categories on mount
  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            setAvailableCategories(data.data);
          }
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  React.useEffect(() => {
    if (!isOpen) {
      if (mode === "create") resetState();
      return;
    }
    if (initialValues) {
      setTitle(initialValues.title ?? "");
      setCampaignType(initialValues.campaignType ?? "");
      setUrgency(initialValues.urgency ?? "medium");
      setDetails(initialValues.details ?? "");
      setDescription(initialValues.description ?? "");
      setCategory(initialValues.category ?? "");
      setBeneficiaryName(initialValues.beneficiary?.name ?? "");
      setBeneficiaryAge(
        initialValues.beneficiary?.age !== undefined && initialValues.beneficiary?.age !== null
          ? String(initialValues.beneficiary?.age)
          : "",
      );
      setBeneficiaryPhoto(initialValues.beneficiary?.photo ?? null);
      setInstitution({
        name: initialValues.institution?.name ?? "",
      });
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
        if (!beneficiaryName.trim()) nextErrors.beneficiaryName = "Beneficiary name is required";
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
    [category, goalAmount, beneficiaryName, story, title],
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
    const trimmedAge = beneficiaryAge.trim();
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
        campaignType: campaignType.trim(),
        urgency,
        details: details.trim(),
        description: description.trim(),
        category: category.trim(),
        beneficiary: {
          name: beneficiaryName.trim(),
          ...(Number.isFinite(parsedAge as number) ? { age: parsedAge } : {}),
          // Only include photo file if it's a new upload
          ...(beneficiaryPhoto && !beneficiaryPhoto.isExisting && beneficiaryPhoto.file
            ? { photo: beneficiaryPhoto.file }
            : {}),
          // Include removePhoto flag if we're removing an existing photo
          ...(removeBeneficiaryPhoto ? { removePhoto: true } : {}),
        },
        institution: {
          name: institution.name.trim(),
        },
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
    details,
    documents,
    goalAmount,
    institution,
    mode,
    onSubmit,
    beneficiaryAge,
    beneficiaryName,
    beneficiaryPhoto,
    resetState,
    story,
    title,
    campaignType,
    urgency,
    validate,
    currentStep,
    category,
    description,
    removeBeneficiaryPhoto,
    removedDocumentIds,
  ]);

  const reviewItems = [
    { label: "Title", value: title || "-", key: "title" as const },
    { label: "Campaign Type", value: campaignType || "-", key: "emergency" as const },
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
    { label: "Key Details", value: details || "-", key: "details" as const },
    { label: "Beneficiary Details", value: description || "-", key: "description" as const },
    {
      label: "Beneficiary",
      value: `${beneficiaryName} ${beneficiaryAge ? `(${beneficiaryAge})` : ""}`.trim() || "—",
      key: "beneficiary" as const,
    },
    {
      label: "Beneficiary Photo",
      value: beneficiaryPhoto
        ? beneficiaryPhoto.isExisting
          ? "Current photo (existing)"
          : beneficiaryPhoto.file?.name || "Photo selected"
        : "No photo",
      key: "beneficiaryPhoto" as const,
    },
    { label: "Institution/Organization", value: institution.name || "—", key: "institution" as const },
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
                placeholder="e.g. Help fund education for 20 students"
                className="rounded-2xl my-2"
                disabled={mode === "edit"}
              />
              {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
            </div>

            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="emergency">Campaign Type</Label>
                <Input
                  id="emergency"
                  value={campaignType}
                  onChange={(e) => setCampaignType(e.target.value)}
                  placeholder="Education, Medical, Community..."
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
                <Label htmlFor="details">Key Details (Optional)</Label>
                <Input
                  id="details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="e.g. Condition, cause, goal"
                  className="rounded-2xl my-2"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="beneficiary-name">Beneficiary Name</Label>
              <Input
                id="beneficiary-name"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                placeholder="Full name"
                className="rounded-2xl my-2"
              />
              {errors.beneficiaryName && <p className="text-sm text-destructive mt-1">{errors.beneficiaryName}</p>}
            </div>

            <PatientImageUpload
              value={beneficiaryPhoto}
              onChange={(image, removeExisting) => {
                setBeneficiaryPhoto(image);
                if (removeExisting) {
                  setRemoveBeneficiaryPhoto(true);
                }
              }}
              label="Beneficiary Photo (Optional)"
            />

            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="beneficiary-age">Age</Label>
                <Input
                  id="beneficiary-age"
                  type="number"
                  value={beneficiaryAge}
                  onChange={(e) => setBeneficiaryAge(e.target.value)}
                  placeholder="e.g. 42"
                  className="rounded-2xl my-2"
                />
              </div>
              <div className="sm:col-span-1 md:col-span-2 space-y-2">
                <Label>Institution / Organization (Optional)</Label>
                <Input
                  value={institution.name}
                  onChange={(e) => setInstitution({ name: e.target.value })}
                  placeholder="e.g. School, Hospital, Organization..."
                  className="rounded-2xl my-2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="beneficiary-description">Beneficiary Information</Label>
              <Textarea
                id="beneficiary-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about the beneficiary and their situation..."
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
                  {availableCategories.length > 0 ? (
                    availableCategories.map((cat) => (
                      <SelectItem key={cat._id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Community Development">Community Development</SelectItem>
                      <SelectItem value="Emergency Relief">Emergency Relief</SelectItem>
                      <SelectItem value="Health & Wellness">Health & Wellness</SelectItem>
                      <SelectItem value="Charity & Nonprofit">Charity & Nonprofit</SelectItem>
                      <SelectItem value="Children & Youth">Children & Youth</SelectItem>
                      <SelectItem value="Personal & Family">Personal & Family</SelectItem>
                      <SelectItem value="Environment">Environment</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </>
                  )}
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
                <p className="text-sm text-muted-foreground">Enter the total amount needed for your campaign</p>
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
              <Label>Upload Supporting Documents</Label>
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
