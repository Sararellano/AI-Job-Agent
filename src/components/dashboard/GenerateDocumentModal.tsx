"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Job, JobApplication } from "@/types/database";
import { PhotoUploadField } from "@/components/dashboard/PhotoUploadField";
import {
  CV_TEMPLATES,
  COVER_LETTER_TEMPLATES,
  DEFAULT_CV_TEMPLATE,
  DEFAULT_COVER_TEMPLATE,
} from "@/types/documents";
import { cn } from "@/lib/utils";

interface GenerateDocumentModalProps {
  type: "cv" | "cover_letter";
  job: Job;
  initialInstructions: string;
  initialPhotoUrl?: string | null;
  initialTemplateId?: string;
  onClose: () => void;
  onGenerated: (
    content: string,
    instructions: string,
    application: JobApplication
  ) => void;
}

/**
 * Modal to customize instructions, template, photo and generate documents.
 */
export function GenerateDocumentModal({
  type,
  job,
  initialInstructions,
  initialPhotoUrl = null,
  initialTemplateId,
  onClose,
  onGenerated,
}: GenerateDocumentModalProps) {
  const [instructions, setInstructions] = useState(initialInstructions);
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl);
  const [templateId, setTemplateId] = useState(
    initialTemplateId ??
      (type === "cv" ? DEFAULT_CV_TEMPLATE : DEFAULT_COVER_TEMPLATE)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = type === "cv" ? "Create CV" : "Create cover letter";
  const label =
    type === "cv"
      ? "Instructions for this CV"
      : "Instructions for this cover letter";
  const templates = type === "cv" ? CV_TEMPLATES : COVER_LETTER_TEMPLATES;
  const photoStoragePath =
    type === "cv" ? `offers/${job.id}-cv` : `offers/${job.id}-cover`;

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/documents/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: job.id,
        type,
        instructions,
        photoUrl,
        templateId,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Generation failed.");
      return;
    }

    const data = (await res.json()) as {
      content: string;
      application: JobApplication;
    };

    onGenerated(data.content, instructions, data.application);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="generate-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 id="generate-modal-title" className="text-lg font-semibold">
              {title}
            </h2>
            <p className="text-sm text-[var(--color-muted)]">
              {job.title} at {job.company}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-[var(--color-background)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mb-2 block text-sm font-medium">Design template</label>
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="mb-4 w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none"
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <label htmlFor="offer-instructions" className="mb-2 block text-sm font-medium">
          {label}
        </label>
        <textarea
          id="offer-instructions"
          rows={6}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="w-full resize-y rounded-lg border border-[var(--color-card-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
        />

        <PhotoUploadField
          label={type === "cv" ? "Photo for this CV" : "Photo for this letter"}
          storagePath={photoStoragePath}
          photoUrl={photoUrl}
          onPhotoChange={setPhotoUrl}
          disabled={loading}
        />

        {error && (
          <p className="mt-3 text-sm text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !instructions.trim()}
            className={cn(
              "flex-1 rounded-lg bg-[var(--color-accent)] py-2.5 text-sm font-medium hover:bg-[var(--color-accent-hover)]",
              (loading || !instructions.trim()) && "opacity-60"
            )}
          >
            {loading ? "Generating…" : `Generate ${type === "cv" ? "CV" : "cover letter"}`}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--color-card-border)] px-4 py-2.5 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
