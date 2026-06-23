"use client";

import { useState } from "react";
import { FileText, Mail, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import type { JobWithApplication } from "@/types/database";
import type { UserProfile } from "@/types/documents";
import {
  DEFAULT_CV_TEMPLATE,
  DEFAULT_COVER_TEMPLATE,
} from "@/types/documents";
import { parseCvContent, parseCoverLetterContent } from "@/lib/documents/parse-content";
import { GenerateDocumentModal } from "@/components/dashboard/GenerateDocumentModal";
import { DocumentPreviewPanel } from "@/components/documents/DocumentPreviewPanel";

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

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "rejected", label: "Rejected" },
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
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-[var(--color-card-border)] p-2 hover:border-[var(--color-accent)]"
                aria-label="Open job posting"
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
              <ChevronUp className="h-4 w-4" /> Hide full description
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" /> View full description
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
            {cvData ? "Regenerate CV" : "Create CV"}
          </button>
          <button
            type="button"
            onClick={() => setModalType("cover_letter")}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-card-border)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            <Mail className="h-4 w-4" />
            {coverData ? "Regenerate cover letter" : "Create cover letter"}
          </button>
        </div>

        {(cvData || coverData) && (
          <div className="mt-4 space-y-4">
            {cvData && (
              <DocumentPreviewPanel
                type="cv"
                title="Generated CV"
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
                title="Generated cover letter"
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
          onClose={() => setModalType(null)}
          onGenerated={(_content, _instructions, application) =>
            handleGenerated(application)
          }
        />
      )}
    </>
  );
}
