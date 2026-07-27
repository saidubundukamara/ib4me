"use client";

import Image from "next/image";
import React from "react";
import { Button } from "@/components/ui/button";

export type SelectedFile = {
  id: string;
  file?: File;
  previewUrl?: string;
  existingAssetId?: string;
  isExisting?: boolean;
  fileName?: string;
  fileType?: string;
};

type DocumentUploadProps = {
  accept?: string[];
  maxFiles?: number;
  maxFileSizeMB?: number;
  onChange?: (files: SelectedFile[], removedAssetIds: string[]) => void;
  value?: SelectedFile[];
  label?: string;
};

function formatBytes(bytes: number): string {
  const sizes = ["B", "KB", "MB", "GB"];
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(1)} ${sizes[i]}`;
}

export default function DocumentUpload({
  accept = ["image/*", "application/pdf"],
  maxFiles = 5,
  maxFileSizeMB = 5,
  onChange,
  value,
  label = "Add documents",
}: DocumentUploadProps) {
  const [files, setFiles] = React.useState<SelectedFile[]>(value || []);
  const [removedAssetIds, setRemovedAssetIds] = React.useState<string[]>([]);
  const [sizeError, setSizeError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const onChangeRef = React.useRef<DocumentUploadProps["onChange"] | undefined>(undefined);

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  React.useEffect(() => {
    onChangeRef.current?.(files, removedAssetIds);
  }, [files, removedAssetIds]);

  React.useEffect(() => {
    if (!value) return;
    setFiles((prev) => (prev === value ? prev : value));
  }, [value]);

  const atLimit = files.length >= maxFiles;

  function pick() {
    if (atLimit) return;
    inputRef.current?.click();
  }

  function handleFiles(list: FileList | null) {
    if (!list) return;
    setSizeError(null);

    const maxBytes = maxFileSizeMB * 1024 * 1024;
    const oversized = Array.from(list).filter((f) => f.size > maxBytes);
    if (oversized.length > 0) {
      setSizeError(
        `${oversized.map((f) => f.name).join(", ")} ${oversized.length === 1 ? "exceeds" : "exceed"} the ${maxFileSizeMB} MB limit per file. Please compress or choose a smaller file.`
      );
      return;
    }

    const slots = Math.max(0, maxFiles - files.length);
    const arr = Array.from(list).slice(0, slots);
    if (arr.length === 0) return;

    const mapped = arr.map((file): SelectedFile => ({
      id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      isExisting: false,
    }));
    setFiles((prev) => [...prev, ...mapped]);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  function remove(id: string) {
    setSizeError(null);
    const fileToRemove = files.find((f) => f.id === id);
    if (fileToRemove?.isExisting && fileToRemove.existingAssetId) {
      setRemovedAssetIds((prev) => [...prev, fileToRemove.existingAssetId!]);
    }
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  const remaining = maxFiles - files.length;

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={atLimit ? undefined : onDrop}
        className={`rounded-2xl border border-dashed p-5 text-center transition-colors ${atLimit ? "bg-muted/30 opacity-60" : "bg-white/70"}`}
      >
        <p className="text-sm">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {atLimit
            ? `Maximum of ${maxFiles} files reached`
            : `Drag & drop images or PDFs, or browse. Max ${maxFileSizeMB} MB per file.`}
        </p>
        <Button
          type="button"
          onClick={pick}
          disabled={atLimit}
          className="mt-3"
        >
          Browse
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept.join(",")}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {sizeError && (
        <p className="text-sm text-destructive rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2">
          {sizeError}
        </p>
      )}

      {files.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">
            {files.length} of {maxFiles} files added
            {remaining > 0 ? ` — ${remaining} slot${remaining !== 1 ? "s" : ""} remaining` : ""}
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {files.map((f) => {
              const displayName = f.file?.name || f.fileName || "Document";
              const displayType = f.file?.type || f.fileType || "file";
              const displaySize = f.file ? formatBytes(f.file.size) : null;
              const isImage = displayType.startsWith("image/");

              return (
                <li key={f.id} className="flex items-center gap-3 rounded-xl border p-3 bg-white/70">
                  {f.previewUrl && isImage ? (
                    <Image src={f.previewUrl} alt={displayName} width={48} height={48} className="h-12 w-12 rounded-md object-cover" />
                  ) : (
                    <div className="h-12 w-12 grid place-items-center rounded-md bg-muted">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium">
                      {displayName}
                      {f.isExisting && <span className="ml-2 text-xs text-muted-foreground">(existing)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {displayType}
                      {displaySize && ` • ${displaySize}`}
                    </div>
                  </div>
                  <Button type="button" onClick={() => remove(f.id)} variant="destructive" size="sm">
                    Remove
                  </Button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
