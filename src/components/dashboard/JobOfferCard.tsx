"use client";

import { useState } from "react";
import { FileText, Mail, ExternalLink, ChevronDown, ChevronUp, Send } from "lucide-react";
import type { JobWithApplication } from "@/types/database";
import type { UserProfile } from "@/types/documents";
import {
  DEFAULT_CV_TEMPLATE,
  DEFAULT_COVER_TEMPLATE,
} from "@/types/documents";
import { parseCvContent, parseCoverLetterContent } from "@/lib/documents/parse-content";
import { GenerateDocumentModal } from "@/components/dashboard/GenerateDocumentModal";
import { DocumentPreviewPanel } from "@/components/documents/DocumentPreviewPanel";
import { useT } from "@/contexts/LocaleProvider";
import type { DocumentLanguage } from "@/types/documents";

interface JobOfferCardProps {
  job: JobWithApplication;
  profile: UserProfile;
  defaultCvInstructions: string;
  defaultCoverLetterInstructions: string;
  defaultCvPhotoUrl: string | null;
  defaultCoverLetterPhotoUrl: string | null;
  defaultCvTemplateId: string;
  defaultCoverTemplateId: string;
  onApplicationUpdate: (jobId: string, application: JobWithApplication["application"]) => void;
}

const STATUS_KEYS = [
  { value: "pending", key: "job.status.pending" as const },
  { value: "applied", key: "job.status.applied" as const },
  { value: "interview", key: "job.status.interview" as const },
  { value: "rejected", key: "job.status.rejected" as const },
] as const;

export function JobOfferCard({
  job,
  profile,
  defaultCvInstructions,
  defaultCoverLetterInstructions,
  defaultCvPhotoUrl,
  defaultCoverLetterPhotoUrl,
  defaultCvTemplateId,
  defaultCoverTemplateId,
  onApplicationUpdate,
}: JobOfferCardProps) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const [modalType, setModalType] = useState<"cv" | "cover_letter" | null>(null);

  const cvInstructions =
    job.application?.cv_instructions ?? defaultCvInstructions;
  const coverLetterInstructions =
    job.application?.cover_letter_instructions ?? defaultCoverLetterInstructions;
  const cvPhotoUrl = job.application?.cv_photo_url ?? defaultCvPhotoUrl;
  const coverPhotoUrl =
    job.application?.cover_letter_photo_url ?? defaultCoverLetterPhotoUrl;
  const cvTemplateId =
    job.application?.cv_template_id ?? defaultCvTemplateId ?? DEFAULT_CV_TEMPLATE;
  const coverTemplateId =
    job.application?.cover_letter_template_id ??
    defaultCoverTemplateId ??
    DEFAULT_COVER_TEMPLATE;

  const cvData = parseCvContent(job.application?.custom_cv_content ?? null);
  const coverData = parseCoverLetterContent(
    job.application?.cover_letter_content ?? null
  );
  const documentsReady = Boolean(cvData && coverData);

  async function handleStatusChange(status: string) {
    const res = await fetch("/api/applications/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id, status }),
    });

    if (res.ok) {
      const data = (await res.json()) as { application: JobWithApplication["application"] };
      onApplicationUpdate(job.id, data.application);
    }
  }

  function handleGenerated(application: JobWithApplication["application"]) {
    onApplicationUpdate(job.id, application);
    setModalType(null);
  }

  return (
    <>
      <article className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--color-accent)]">
              {job.company}
            </p>
            <h3 className="text-lg font-semibold">{job.title}</h3>
            {job.salary && (
              <p className="mt-1 text-sm text-[var(--color-success)]">{job.salary}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={job.application?.status ?? "pending"}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-background)] px-2 py-1.5 text-xs outline-none"
              aria-label="Application status"
            >
              {STATUS_KEYS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.key)}
                </option>
              ))}
            </select>
            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-[var(--color-card-border)] p-2 hover:border-[var(--color-accent)]"
                aria-label={t("job.openPosting")}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {job.summary && (
          <p className="mt-3 text-sm text-[var(--color-muted)]">{job.summary}</p>
        )}

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-sm text-[var(--color-accent)] hover:underline"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" /> {t("job.hideDescription")}
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" /> {t("job.viewDescription")}
            </>
          )}
        </button>

        {expanded && (
          <div className="mt-3 rounded-lg bg-[var(--color-background)] p-4 text-sm leading-relaxed text-[var(--color-muted)]">
            {job.description}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setModalType("cv")}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-card-border)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            <FileText className="h-4 w-4" />
            {cvData ? t("job.regenerateCv") : t("job.createCv")}
          </button>
          <button
            type="button"
            onClick={() => setModalType("cover_letter")}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-card-border)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            <Mail className="h-4 w-4" />
            {coverData ? t("job.regenerateCover") : t("job.createCover")}
          </button>
        </div>

        {(cvData || coverData) && (
          <div className="mt-4 space-y-4">
            {job.url && (
              <div className="rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 p-4">
                <p className="text-sm text-[var(--color-muted)]">
                  {documentsReady ? t("job.applyReady") : t("job.applyMissingDocs")}
                </p>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  <Send className="h-4 w-4" />
                  {t("job.applyOnPortal")}
                  <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                </a>
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  {t("job.applyHint")}
                </p>
              </div>
            )}
            {cvData && (
              <DocumentPreviewPanel
                type="cv"
                title={t("preview.generatedCv")}
                data={cvData}
                profile={profile}
                photoUrl={cvPhotoUrl}
                jobTitle={job.title}
                company={job.company}
                jobId={job.id}
                onApplicationUpdate={(app) => onApplicationUpdate(job.id, app)}
              />
            )}
            {coverData && (
              <DocumentPreviewPanel
                type="cover_letter"
                title={t("preview.generatedCover")}
                data={coverData}
                profile={profile}
                photoUrl={coverPhotoUrl}
                jobTitle={job.title}
                company={job.company}
                jobId={job.id}
                onApplicationUpdate={(app) => onApplicationUpdate(job.id, app)}
              />
            )}
          </div>
        )}
      </article>

      {modalType && (
        <GenerateDocumentModal
          type={modalType}
          job={job}
          initialInstructions={
            modalType === "cv" ? cvInstructions : coverLetterInstructions
          }
          initialPhotoUrl={modalType === "cv" ? cvPhotoUrl : coverPhotoUrl}
          initialTemplateId={
            modalType === "cv" ? cvTemplateId : coverTemplateId
          }
          initialDocumentLanguage={
            (job.application?.document_language as DocumentLanguage | null) ?? null
          }
          onClose={() => setModalType(null)}
          onGenerated={(_content, _instructions, application) =>
            handleGenerated(application)
          }
        />
      )}
    </>
  );
}
