"use client";

import { useRef, useState } from "react";
import { Download, ChevronDown, ChevronUp } from "lucide-react";
import type { UserProfile, DocumentFormat, CvDocument, CoverLetterDocument } from "@/types/documents";
import { CV_TEMPLATES, COVER_LETTER_TEMPLATES } from "@/types/documents";
import { CvTemplateRenderer } from "@/components/documents/CvTemplates";
import { CoverLetterTemplateRenderer } from "@/components/documents/CoverLetterTemplates";
import { downloadDocument } from "@/lib/export/download-document";
import { cn } from "@/lib/utils";

interface DocumentPreviewPanelProps {
  type: "cv" | "cover_letter";
  title: string;
  data: CvDocument | CoverLetterDocument;
  profile: UserProfile;
  photoUrl?: string | null;
  jobTitle: string;
  company: string;
  jobId: string;
  onApplicationUpdate?: (application: import("@/types/database").JobApplication) => void;
}

/**
 * Styled document preview with template selector and PDF/DOCX/TXT download.
 */
export function DocumentPreviewPanel({
  type,
  title,
  data,
  profile,
  photoUrl,
  jobTitle,
  company,
  jobId,
  onApplicationUpdate,
}: DocumentPreviewPanelProps) {
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState(data.templateId);
  const [downloading, setDownloading] = useState<DocumentFormat | null>(null);
  const [showFormats, setShowFormats] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const templates = type === "cv" ? CV_TEMPLATES : COVER_LETTER_TEMPLATES;
  const displayData = { ...data, templateId } as CvDocument & CoverLetterDocument;

  async function handleTemplateChange(newId: string) {
    setTemplateId(newId);

    const res = await fetch("/api/applications/template", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, type, templateId: newId }),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        application: import("@/types/database").JobApplication;
      };
      onApplicationUpdate?.(data.application);
    }
  }

  async function handleDownload(format: DocumentFormat) {
    setDownloading(format);
    setShowFormats(false);
    try {
      const safeName = `${type}-${company}-${jobTitle}`
        .replace(/[^a-z0-9-_]/gi, "_")
        .slice(0, 60);
      await downloadDocument(
        format,
        type,
        displayData,
        profile,
        previewRef.current,
        safeName
      );
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-background)] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-card-border)] p-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-sm font-medium text-[var(--color-accent)]"
        >
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {open ? "Hide" : "View"} {title}
        </button>

        {open && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={templateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card)] px-2 py-1.5 text-xs outline-none"
              aria-label="Template"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFormats(!showFormats)}
                disabled={!!downloading}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-accent-hover)]",
                  downloading && "opacity-60"
                )}
              >
                <Download className="h-3.5 w-3.5" />
                {downloading ? `Downloading ${downloading.toUpperCase()}…` : "Download"}
              </button>
              {showFormats && (
                <div className="absolute right-0 z-10 mt-1 min-w-[120px] rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card)] py-1 shadow-lg">
                  {(["pdf", "docx", "txt"] as DocumentFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => handleDownload(fmt)}
                      className="block w-full px-4 py-2 text-left text-xs hover:bg-[var(--color-background)]"
                    >
                      .{fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {open && (
        <div className="overflow-auto bg-slate-200/50 p-4">
          <div
            ref={previewRef}
            className="mx-auto max-w-[210mm] shadow-lg ring-1 ring-slate-200"
          >
            {type === "cv" ? (
              <CvTemplateRenderer
                data={displayData as CvDocument}
                profile={profile}
                photoUrl={photoUrl}
                jobTitle={jobTitle}
                company={company}
              />
            ) : (
              <CoverLetterTemplateRenderer
                data={displayData as CoverLetterDocument}
                profile={profile}
                photoUrl={photoUrl}
                company={company}
                jobTitle={jobTitle}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
