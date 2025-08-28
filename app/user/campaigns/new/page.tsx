"use client";

import React from "react";
import Card from "../../_components/Card";
import DocumentUpload, { SelectedFile } from "../../_components/DocumentUpload";

type Urgency = "low" | "medium" | "high";

type CampaignFormData = {
  title: string;
  typeOfEmergency: string;
  urgency: Urgency;
  diagnosis: string;
  patient: { name: string; age?: number | "" };
  hospital: { name: string };
  goal: { currency: string; amountMajor: number | "" };
  story: string;
  documents: SelectedFile[];
};

const defaultForm: CampaignFormData = {
  title: "",
  typeOfEmergency: "",
  urgency: "medium",
  diagnosis: "",
  patient: { name: "", age: "" },
  hospital: { name: "" },
  goal: { currency: "SLE", amountMajor: "" },
  story: "",
  documents: [],
};

function generateSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const steps = [
  { key: "details", label: "Details" },
  { key: "patient", label: "Patient" },
  { key: "goal", label: "Goal" },
  { key: "story", label: "Story" },
  { key: "documents", label: "Documents" },
  { key: "review", label: "Review" },
] as const;

type StepKey = typeof steps[number]["key"];

export default function NewCampaignPage() {
  const [form, setForm] = React.useState<CampaignFormData>(defaultForm);
  const [stepIndex, setStepIndex] = React.useState<number>(0);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const step: StepKey = steps[stepIndex].key;

  function update<K extends keyof CampaignFormData>(key: K, value: CampaignFormData[K]) {
    setForm((prev) => {
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
  }

  function validate(currentStep: StepKey): boolean {
    const nextErrors: Record<string, string> = {};
    if (currentStep === "details") {
      if (!form.title.trim()) nextErrors.title = "Title is required";
    }
    if (currentStep === "patient") {
      if (!form.patient.name.trim()) nextErrors.patientName = "Patient name required";
    }
    if (currentStep === "goal") {
      if (!form.goal.currency) nextErrors.currency = "Currency required";
      if (form.goal.amountMajor === "" || Number(form.goal.amountMajor) <= 0) nextErrors.amount = "Enter a valid amount";
    }
    if (currentStep === "story") {
      if (!form.story.trim()) nextErrors.story = "Story is required";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function next() {
    if (!validate(step)) return;
    setStepIndex((x) => Math.min(x + 1, steps.length - 1));
  }

  function back() {
    setStepIndex((x) => Math.max(x - 1, 0));
  }

  function handleTitleChange(value: string) {
    update("title", value);
  }

  function submit() {
    if (!validate("review")) return;
    const fd = new FormData();
    fd.set("slug", generateSlug(form.title));
    if (form.diagnosis) fd.set("diagnosis", form.diagnosis);
    if (form.typeOfEmergency) fd.set("typeOfEmergency", form.typeOfEmergency);
    fd.set("urgency", form.urgency);
    fd.set("patient.name", form.patient.name);
    if (form.patient.age !== "" && form.patient.age !== undefined) fd.set("patient.age", String(form.patient.age));
    if (form.hospital.name) fd.set("hospital.name", form.hospital.name);
    fd.set("goal.currency", form.goal.currency);
    fd.set("goal.amountMinor", String(form.goal.amountMajor === "" ? 0 : Math.round(Number(form.goal.amountMajor) * 100)));
    fd.set("story", form.story);
    for (const f of form.documents) {
      fd.append("documents", f.file);
    }
    fetch("/api/campaigns", {
      method: "POST",
      body: fd,
    }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        window.location.href = `/user/campaigns/${data.id}`;
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to create campaign");
      }
    }).catch(() => alert("Network error creating campaign"));
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-semibold">Start a Campaign</h2>
        <p className="text-sm text-gray-600 mt-1">Provide accurate details to help donors understand the need.</p>
      </div>

      <Card className="p-4">
        <ol className="grid grid-cols-6 gap-2 text-xs">
          {steps.map((s, i) => (
            <li key={s.key} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${i === stepIndex ? "bg-indigo-50 border-indigo-200 text-indigo-700" : i < stepIndex ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white/80"}`}>
              <span className={`h-5 w-5 grid place-items-center rounded-full text-[10px] ${i <= stepIndex ? "bg-indigo-600 text-white" : "bg-gray-200"}`}>{i + 1}</span>
              <span className="font-medium">{s.label}</span>
            </li>
          ))}
        </ol>
      </Card>

      {step === "details" && (
        <Card className="p-5 space-y-4">
          <div>
            <label className="text-sm">Title</label>
            <input
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 bg-white/80 dark:bg-white/5"
              placeholder="e.g. Help with surgery"
            />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm">Emergency Type</label>
              <input
                value={form.typeOfEmergency}
                onChange={(e) => update("typeOfEmergency", e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2 bg-white/80 dark:bg-white/5"
                placeholder="Surgery, Accident, etc"
              />
            </div>
            <div>
              <label className="text-sm">Urgency</label>
              <select
                value={form.urgency}
                onChange={(e) => update("urgency", e.target.value as Urgency)}
                className="mt-1 w-full rounded-xl border px-3 py-2 bg-white/80 dark:bg-white/5"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Diagnosis</label>
              <input
                value={form.diagnosis}
                onChange={(e) => update("diagnosis", e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2 bg-white/80 dark:bg-white/5"
                placeholder="Condition"
              />
            </div>
          </div>
        </Card>
      )}

      {step === "patient" && (
        <Card className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-sm">Patient Name</label>
              <input
                value={form.patient.name}
                onChange={(e) => update("patient", { ...form.patient, name: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3 py-2 bg-white/80 dark:bg-white/5"
                placeholder="Full name"
              />
              {errors.patientName && <p className="text-xs text-red-600 mt-1">{errors.patientName}</p>}
            </div>
            <div>
              <label className="text-sm">Age</label>
              <input
                type="number"
                value={form.patient.age ?? ""}
                onChange={(e) => update("patient", { ...form.patient, age: e.target.value === "" ? "" : Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border px-3 py-2 bg-white/80 dark:bg-white/5"
                placeholder="e.g. 42"
              />
            </div>
          </div>
          <div>
            <label className="text-sm">Hospital Name</label>
            <input
              value={form.hospital.name}
              onChange={(e) => update("hospital", { name: e.target.value })}
              className="mt-1 w-full rounded-xl border px-3 py-2 bg-white/80 dark:bg-white/5"
              placeholder="Hospital"
            />
          </div>
        </Card>
      )}

      {step === "goal" && (
        <Card className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm">Currency</label>
              <input value="SLE" readOnly className="mt-1 w-full rounded-xl border px-3 py-2 bg-gray-50 text-gray-600" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm">Goal Amount</label>
              <input
                type="number"
                value={form.goal.amountMajor}
                onChange={(e) => update("goal", { ...form.goal, amountMajor: e.target.value === "" ? "" : Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border px-3 py-2 bg-white/80 dark:bg-white/5"
                placeholder="5000"
              />
              {errors.amount && <p className="text-xs text-red-600 mt-1">{errors.amount}</p>}
            </div>
          </div>
        </Card>
      )}

      {step === "story" && (
        <Card className="p-5 space-y-4">
          <div>
            <label className="text-sm">Story</label>
            <textarea
              value={form.story}
              onChange={(e) => update("story", e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2 bg-white/80 dark:bg-white/5"
              rows={8}
              placeholder="Explain the situation, how funds will be used, and timelines."
            />
            {errors.story && <p className="text-xs text-red-600 mt-1">{errors.story}</p>}
          </div>
          <div className="text-xs text-gray-500">You can add medical documents and images below.</div>
        </Card>
      )}

      {step === "documents" && (
        <Card className="p-5 space-y-4">
          <div>
            <label className="text-sm">Upload Medical Documents</label>
            <DocumentUpload value={form.documents} onChange={(files) => update("documents", files)} />
            <p className="text-xs text-gray-500 mt-2">Supported: images and PDFs. Max 10 files.</p>
          </div>
        </Card>
      )}

      {step === "review" && (
        <Card className="p-5 space-y-3">
          <h3 className="font-medium">Review</h3>
          <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-200">
            <li><strong>Title:</strong> {form.title}</li>
            <li><strong>Emergency:</strong> {form.typeOfEmergency || "—"}</li>
            <li><strong>Urgency:</strong> {form.urgency}</li>
            <li><strong>Diagnosis:</strong> {form.diagnosis || "—"}</li>
            <li><strong>Patient:</strong> {form.patient.name} {form.patient.age ? `(${form.patient.age})` : ""}</li>
            <li><strong>Hospital:</strong> {form.hospital.name || "—"}</li>
            <li><strong>Goal:</strong> {form.goal.currency} {form.goal.amountMajor || 0}</li>
            <li><strong>Documents:</strong> {form.documents.length} file(s)</li>
          </ul>
        </Card>
      )}

      

      <div className="flex items-center justify-between">
        <button onClick={back} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50" disabled={stepIndex === 0}>Back</button>
        {stepIndex < steps.length - 1 ? (
          <button onClick={next} className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm shadow hover:bg-indigo-700">Continue</button>
        ) : (
          <button onClick={submit} className="rounded-xl bg-indigo-700 text-white px-4 py-2 text-sm shadow hover:bg-indigo-800">Create Campaign</button>
        )}
      </div>
    </div>
  );
}


