"use client";

import { useRef, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import type { ParsedCvLocal, SkillEvidence } from "@/types/skills";
import { useT } from "@/contexts/LocaleProvider";
import { cn } from "@/lib/utils";

interface CvUploadStepProps {
  existingFileName?: string | null;
  onUploaded: (data: {
    parsed: ParsedCvLocal;
    skillProfile: SkillEvidence[];
    cvFileName: string;
  }) => void;
}

/**
 * Step 1: Upload CV (PDF/DOCX) and run local parser.
 */
export function CvUploadStep({ existingFileName, onUploaded }: CvUploadStepProps) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState(existingFileName ?? "");

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/cv/upload", {
      method: "POST",
      body: formData,
    });

    setUploading(false);

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? t("onboarding.uploadFailed"));
      return;
    }

    const data = (await res.json()) as {
      parsed: ParsedCvLocal;
      skillProfile: SkillEvidence[];
      cvFileName: string;
    };

    setFileName(data.cvFileName);
    onUploaded(data);
  }

  return (
    <div className="surface-card p-6">
      <h2 className="mb-1 text-lg font-semibold">{t("onboarding.step1Title")}</h2>
      <p className="mb-4 text-sm text-[var(--color-muted)]">
        {t("onboarding.step1Subtitle")}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[var(--color-card-border)] bg-[var(--color-background)] p-8 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:shadow-sm",
          uploading && "opacity-60"
        )}
      >
        {uploading ? (
          <Loader2 className="h-10 w-10 animate-spin text-[var(--color-accent)]" />
        ) : fileName ? (
          <FileText className="h-10 w-10 text-[var(--color-success)]" />
        ) : (
          <Upload className="h-10 w-10 text-[var(--color-muted)]" />
        )}
        <span className="text-sm font-medium">
          {uploading
            ? t("onboarding.parsing")
            : fileName
              ? t("onboarding.uploaded", { name: fileName })
              : t("onboarding.uploadClick")}
        </span>
      </button>

      {error && (
        <p className="mt-3 text-sm text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
