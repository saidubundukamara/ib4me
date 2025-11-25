"use client";

import Image from "next/image";
import React from "react";
import {Button} from "@/components/ui/button";

export type SelectedFile = {
  id: string;
  file: File;
  previewUrl?: string;
};

type DocumentUploadProps = {
  accept?: string[]; // e.g. ["image/*","application/pdf"]
  maxFiles?: number;
  onChange?: (files: SelectedFile[]) => void;
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

export default function DocumentUpload({ accept = ["image/*", "application/pdf"], maxFiles = 10, onChange, value, label = "Add documents" }: DocumentUploadProps) {
  const [files, setFiles] = React.useState<SelectedFile[]>(value || []);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const onChangeRef = React.useRef<DocumentUploadProps["onChange"] | undefined>(undefined);

  // Keep a stable reference to onChange to avoid effect loops when parent passes new function each render
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Notify parent only when files actually change
  React.useEffect(() => {
    onChangeRef.current?.(files);
  }, [files]);

  // Sync internal state if controlled value prop changes
  React.useEffect(() => {
    if (!value) return;
    setFiles((prev) => (prev === value ? prev : value));
  }, [value]);

  function pick() {
    inputRef.current?.click();
  }

  function handleFiles(list: FileList | null) {
    if (!list) return;
    const arr = Array.from(list).slice(0, Math.max(0, maxFiles - files.length));
    const mapped = arr.map((file): SelectedFile => ({ id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`, file, previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined }));
    setFiles((prev) => [...prev, ...mapped]);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  function remove(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="rounded-2xl border border-dashed bg-white/70 p-5 text-center"
      >
        <p className="text-sm">{label}</p>
        <p className="text-xs text-gray-500 mt-1">Drag & drop images or PDFs, or</p>
        <Button type="button" onClick={pick} className="mt-3">Browse</Button>
        <input ref={inputRef} type="file" multiple accept={accept.join(",")} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {files.length > 0 && (
        <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 rounded-xl border p-3 bg-white/70 ">
              {f.previewUrl ? (
                <Image src={f.previewUrl} alt={f.file.name} width={48} height={48}  className="h-12 w-12 rounded-md object-cover" />
              ) : (
                <div className="h-12 w-12 grid place-items-center rounded-md bg-gray-100 ">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-medium">{f.file.name}</div>
                <div className="text-xs text-gray-500">{f.file.type || "file"} • {formatBytes(f.file.size)}</div>
              </div>
              <Button type="button" onClick={() => remove(f.id)} variant="destructive">Remove</Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


