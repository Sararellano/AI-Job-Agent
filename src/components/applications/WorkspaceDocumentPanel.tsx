"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ChevronDown, Pencil, Save } from "lucide-react";
import type {
  UserProfile,
  DocumentFormat,
  CvDocument,
  CoverLetterDocument,
} from "@/types/documents";
import { CV_TEMPLATES, COVER_LETTER_TEMPLATES } from "@/types/documents";
import { CvTemplateRenderer } from "@/components/documents/CvTemplates";
import { CoverLetterTemplateRenderer } from "@/components/documents/CoverLetterTemplates";
import { DocumentEditor } from "@/components/applications/DocumentEditor";
import { downloadDocument } from "@/lib/export/download-document";
import { useT } from "@/contexts/LocaleProvider";
import { cn } from "@/lib/utils";
import type { JobApplication } from "@/types/database";

interface WorkspaceDocumentPanelProps {
  type: "cv" | "cover_letter";
  data: CvDocument | CoverLetterDocument;
  profile: UserProfile;
  photoUrl?: string | null;
  jobTitle: string;
  company: string;
  jobId: string;
  onSaved: (application: JobApplication) => void;
  onRegenerate: () => void;
}

/**
 * Document panel with edit mode, prominent PDF download and preview.
 */
export function WorkspaceDocumentPanel({
  type,
  data: initialData,
  profile,
  photoUrl,
  jobTitle,
  company,
  jobId,
  onSaved,
  onRegenerate,
}: WorkspaceDocumentPanelProps) {
  const t = useT();
  const [data, setData] = useState(initialData);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState<DocumentFormat | null>(null);
  const [showFormats, setShowFormats] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const templates = type === "cv" ? CV_TEMPLATES : COVER_LETTER_TEMPLATES;
  const templateId = data.templateId;

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/applications/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, type, content: data }),
    });
    setSaving(false);

    if (res.ok) {
      const result = (await res.json()) as { application: JobApplication };
      onSaved(result.application);
      setEditing(false);
      setMessage(t("workspace.saved"));
    } else {
      setMessage(t("workspace.saveFailed"));
    }
  }

  async function handleTemplateChange(newId: string) {
    const updated = { ...data, templateId: newId };
    setData(updated);

    const res = await fetch("/api/applications/template", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, type, templateId: newId }),
    });

    if (res.ok) {
      const result = (await res.json()) as { application: JobApplication };
      onSaved(result.application);
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
        data as CvDocument & CoverLetterDocument,
        profile,
        previewRef.current,
        safeName
      );
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="flex flex-col rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card)] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-card-border)] p-3">
        <h3 className="text-sm font-semibold">
          {type === "cv" ? t("workspace.cvSection") : t("workspace.coverSection")}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={templateId}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-background)] px-2 py-1.5 text-xs outline-none"
            aria-label={t("preview.template")}
          >
            {templates.map((tmpl) => (
              <option key={tmpl.id} value={tmpl.id}>
                {tmpl.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => (editing ? handleSave() : setEditing(true))}
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-card-border)] px-3 py-1.5 text-xs font-medium hover:border-[var(--color-accent)]"
          >
            {editing ? (
              <>
                <Save className="h-3.5 w-3.5" />
                {saving ? t("workspace.saving") : t("workspace.save")}
              </>
            ) : (
              <>
                <Pencil className="h-3.5 w-3.5" />
                {t("workspace.edit")}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleDownload("pdf")}
            disabled={!!downloading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
          >
            <Download className="h-3.5 w-3.5" />
            {downloading === "pdf"
              ? t("preview.downloading", { format: "PDF" })
              : t("workspace.downloadPdf")}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFormats(!showFormats)}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-card-border)] px-2 py-1.5 text-xs"
            >
              {t("workspace.moreFormats")}
              <ChevronDown className="h-3 w-3" />
            </button>
            {showFormats && (
              <div className="absolute right-0 z-10 mt-1 min-w-[100px] rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card)] py-1 shadow-lg">
                {(["docx", "txt"] as DocumentFormat[]).map((fmt) => (
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

          <button
            type="button"
            onClick={onRegenerate}
            className="text-xs text-[var(--color-accent)] hover:underline"
          >
            {t("workspace.regenerate")}
          </button>
        </div>
      </div>

      {message && (
        <p className={cn("px-3 pt-2 text-xs", message === t("workspace.saved") ? "text-[var(--color-success)]" : "text-[var(--color-danger)]")}>
          {message}
        </p>
      )}

      <div className="flex-1 overflow-auto p-4">
        {editing ? (
          <DocumentEditor
            type={type}
            data={data}
            onChange={(d) => setData(d as typeof data)}
          />
        ) : (
          <div className="overflow-auto bg-slate-200/50 p-4">
            <div
              ref={previewRef}
              className="mx-auto max-w-[210mm] shadow-lg ring-1 ring-slate-200"
            >
              {type === "cv" ? (
                <CvTemplateRenderer
                  data={data as CvDocument}
                  profile={profile}
                  photoUrl={photoUrl}
                  jobTitle={jobTitle}
                  company={company}
                />
              ) : (
                <CoverLetterTemplateRenderer
                  data={data as CoverLetterDocument}
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
    </div>
  );
}
