"use client";

import Image from "next/image";
import React from "react";
import { Button } from "@/components/ui/button";

export type SelectedImage = {
  id: string;
  file?: File;           // For new uploads
  previewUrl: string;    // URL for display (blob for new, actual URL for existing)
  existingAssetId?: string;  // For existing photo from DB
  isExisting?: boolean;  // Flag to distinguish existing vs new
};

type PatientImageUploadProps = {
  onChange?: (image: SelectedImage | null, removeExisting: boolean) => void;
  value?: SelectedImage | null;
  label?: string;
};

export default function PatientImageUpload({
  onChange,
  value,
  label = "Beneficiary Photo",
}: PatientImageUploadProps) {
  const [image, setImage] = React.useState<SelectedImage | null>(value || null);
  const [removedExisting, setRemovedExisting] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const onChangeRef = React.useRef<PatientImageUploadProps["onChange"] | undefined>(undefined);

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  React.useEffect(() => {
    onChangeRef.current?.(image, removedExisting);
  }, [image, removedExisting]);

  React.useEffect(() => {
    if (value === undefined) return;
    setImage((prev) => (prev === value ? prev : value));
  }, [value]);

  function pick() {
    inputRef.current?.click();
  }

  function handleFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    // Revoke previous preview URL if it was a blob URL (new upload)
    if (image?.previewUrl && !image.isExisting) {
      URL.revokeObjectURL(image.previewUrl);
    }

    // If we're replacing an existing image, mark it as removed
    if (image?.isExisting && image.existingAssetId) {
      setRemovedExisting(true);
    }

    const newImage: SelectedImage = {
      id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      isExisting: false,
    };
    setImage(newImage);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }

  function remove() {
    // If removing an existing image, track it
    if (image?.isExisting && image.existingAssetId) {
      setRemovedExisting(true);
    }

    // Revoke blob URL if it's a new upload
    if (image?.previewUrl && !image.isExisting) {
      URL.revokeObjectURL(image.previewUrl);
    }
    setImage(null);
  }

  const displayName = image?.file?.name || (image?.isExisting ? "Current beneficiary photo" : "");
  const displaySize = image?.file ? `${(image.file.size / 1024).toFixed(1)} KB` : null;

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
      </label>

      {!image ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="rounded-2xl border border-dashed bg-white/70 p-5 text-center"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
            <svg
              className="w-8 h-8 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">Add a photo of the beneficiary</p>
          <p className="text-xs text-muted-foreground mt-1">
            Drag & drop an image, or click to browse
          </p>
          <Button type="button" onClick={pick} className="mt-3">
            Choose Image
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
        </div>
      ) : (
        <div className="rounded-2xl border bg-white/70 p-4">
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
              <Image
                src={image.previewUrl}
                alt="Beneficiary photo preview"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {displayName}
                {image.isExisting && <span className="ml-2 text-xs text-muted-foreground">(existing)</span>}
              </p>
              {displaySize && (
                <p className="text-xs text-muted-foreground mt-1">{displaySize}</p>
              )}
              <div className="flex gap-2 mt-3">
                <Button type="button" variant="outline" size="sm" onClick={pick}>
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={remove}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
        </div>
      )}
    </div>
  );
}
