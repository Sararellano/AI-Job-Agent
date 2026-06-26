"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Job, JobApplication } from "@/types/database";
import type { DocumentLanguage } from "@/types/documents";
import { PhotoUploadField } from "@/components/dashboard/PhotoUploadField";
import {
  COVER_LETTER_TEMPLATES,
  DEFAULT_COVER_TEMPLATE,
} from "@/types/documents";
import { useLocale, useT } from "@/contexts/LocaleProvider";
import { inputClassName, textareaClassName } from "@/lib/ui/input-styles";
import { cn } from "@/lib/utils";

interface GenerateDocumentModalProps {
  type: "cv" | "cover_letter";
  job: Job;
  initialInstructions: string;
  initialPhotoUrl?: string | null;
  initialTemplateId?: string;
  initialDocumentLanguage?: DocumentLanguage | null;
  onClose: () => void;
  onGenerated: (
    content: string,
    instructions: string,
    application: JobApplication
  ) => void;
}

/**
 * Modal to customize instructions, photo and generate documents.
 */
export function GenerateDocumentModal({
  type,
  job,
  initialInstructions,
  initialPhotoUrl = null,
  initialTemplateId,
  initialDocumentLanguage,
  onClose,
  onGenerated,
}: GenerateDocumentModalProps) {
  const t = useT();
  const { locale } = useLocale();
  const [instructions, setInstructions] = useState(initialInstructions);
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl);
  const [coverTemplateId, setCoverTemplateId] = useState(
    initialTemplateId ?? DEFAULT_COVER_TEMPLATE
  );
  const [documentLanguage, setDocumentLanguage] = useState<DocumentLanguage>(
    initialDocumentLanguage ?? locale
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = type === "cv" ? t("generate.createCv") : t("generate.createCover");
  const label =
    type === "cv" ? t("generate.cvInstructions") : t("generate.coverInstructions");
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
        templateId: type === "cover_letter" ? coverTemplateId : undefined,
        documentLanguage,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? t("generate.failed"));
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="generate-modal-title"
    >
      <div className="surface-card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 id="generate-modal-title" className="text-lg font-semibold">
              {title}
            </h2>
            <p className="text-sm text-[var(--color-muted)]">
              {job.title} {t("generate.at")} {job.company}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label={t("generate.close")}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {type === "cover_letter" && (
          <>
            <label className="mb-2 block text-sm font-medium">{t("generate.template")}</label>
            <select
              value={coverTemplateId}
              onChange={(e) => setCoverTemplateId(e.target.value)}
              className={cn("mb-4", inputClassName)}
            >
              {COVER_LETTER_TEMPLATES.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </>
        )}

        <label className="mb-2 block text-sm font-medium">
          {t("generate.documentLanguage")}
        </label>
        <select
          value={documentLanguage}
          onChange={(e) => setDocumentLanguage(e.target.value as DocumentLanguage)}
          className={cn("mb-4", inputClassName)}
        >
          <option value="en">{t("generate.langEn")}</option>
          <option value="es">{t("generate.langEs")}</option>
        </select>

        <label htmlFor="offer-instructions" className="mb-2 block text-sm font-medium">
          {label}
        </label>
        <textarea
          id="offer-instructions"
          rows={6}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className={textareaClassName}
        />

        <PhotoUploadField
          label={type === "cv" ? t("generate.cvPhoto") : t("generate.coverPhoto")}
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
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !instructions.trim()}
            className="flex-1"
          >
            {loading
              ? t("generate.generating")
              : type === "cv"
                ? t("generate.generateCv")
                : t("generate.generateCover")}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("generate.cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}
