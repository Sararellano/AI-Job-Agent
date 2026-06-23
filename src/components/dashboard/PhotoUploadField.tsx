"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2, Loader2 } from "lucide-react";
import { uploadPhoto, deletePhotoByUrl } from "@/lib/supabase/upload-photo";
import { cn } from "@/lib/utils";

interface PhotoUploadFieldProps {
  label?: string;
  hint?: string;
  storagePath: string;
  photoUrl: string | null;
  onPhotoChange: (url: string | null) => void;
  disabled?: boolean;
}

/**
 * File picker to upload a photo from the user's computer to Supabase Storage.
 */
export function PhotoUploadField({
  label = "Photo",
  hint = "JPG, PNG, WebP or GIF — max 5MB",
  storagePath,
  photoUrl,
  onPhotoChange,
  disabled = false,
}: PhotoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const result = await uploadPhoto(file, storagePath);

    setUploading(false);
    e.target.value = "";

    if ("error" in result) {
      setError(result.error);
      return;
    }

    onPhotoChange(result.url);
  }

  async function handleRemove() {
    if (!photoUrl) return;

    setUploading(true);
    setError(null);

    const { error: deleteError } = await deletePhotoByUrl(photoUrl);

    setUploading(false);

    if (deleteError) {
      setError(deleteError);
      return;
    }

    onPhotoChange(null);
  }

  return (
    <div className="mt-3 rounded-lg border border-dashed border-[var(--color-card-border)] bg-[var(--color-background)] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        {photoUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || uploading}
            className="inline-flex items-center gap-1 text-xs text-[var(--color-danger)] hover:underline disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        )}
      </div>

      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card)]",
            !photoUrl && "text-[var(--color-muted)]"
          )}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt="Uploaded preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <ImagePlus className="h-6 w-6" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            disabled={disabled || uploading}
            className="hidden"
            id={`photo-${storagePath}`}
          />
          <label
            htmlFor={`photo-${storagePath}`}
            className={cn(
              "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-card-border)] px-3 py-2 text-xs font-medium transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
              (disabled || uploading) && "pointer-events-none opacity-50"
            )}
          >
            <ImagePlus className="h-4 w-4" />
            {photoUrl ? "Change photo" : "Upload from computer"}
          </label>
          <p className="mt-1.5 text-xs text-[var(--color-muted)]">{hint}</p>
          {error && (
            <p className="mt-1 text-xs text-[var(--color-danger)]" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
