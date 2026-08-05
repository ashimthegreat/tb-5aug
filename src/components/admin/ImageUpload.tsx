"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { GhostButton } from "./ui";

export default function ImageUpload({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error || "Upload failed");
        return;
      }
      const body = (await res.json()) as { url: string };
      onChange(body.url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
          <Image
            src={value}
            alt=""
            width={80}
            height={48}
            className="h-12 w-auto max-w-[120px] object-contain"
          />
          <div className="flex flex-col gap-2">
            <GhostButton
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading…" : "Replace"}
            </GhostButton>
            <GhostButton type="button" onClick={() => onChange("")}>
              Remove
            </GhostButton>
          </div>
        </div>
      ) : (
        <GhostButton
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : "Upload image"}
        </GhostButton>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
