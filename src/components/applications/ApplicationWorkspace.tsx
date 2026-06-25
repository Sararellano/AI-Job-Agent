"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import type { JobWithApplication } from "@/types/database";
import type { UserProfile } from "@/types/documents";
import {
  DEFAULT_CV_TEMPLATE,
  DEFAULT_COVER_TEMPLATE,
} from "@/types/documents";
import { parseCvContent, parseCoverLetterContent } from "@/lib/documents/parse-content";
import { GenerateDocumentModal } from "@/components/dashboard/GenerateDocumentModal";
import { WorkspaceDocumentPanel } from "@/components/applications/WorkspaceDocumentPanel";
import { useT } from "@/contexts/LocaleProvider";
import type { DocumentLanguage } from "@/types/documents";

interface ApplicationWorkspaceProps {
  job: JobWithApplication;
  profile: UserProfile;
  defaultCvInstructions: string;
  defaultCoverLetterInstructions: string;
  defaultCvPhotoUrl: string | null;
  defaultCoverLetterPhotoUrl: string | null;
  defaultCvTemplateId: string;
  defaultCoverTemplateId: string;
}

/**
 * Full application workspace: CV + cover letter side by side with edit and PDF.
 */
export function ApplicationWorkspace({
  job: initialJob,
  profile,
  defaultCvInstructions,
  defaultCoverLetterInstructions,
  defaultCvPhotoUrl,
  defaultCoverLetterPhotoUrl,
  defaultCvTemplateId,
  defaultCoverTemplateId,
}: ApplicationWorkspaceProps) {
  const t = useT();
  const [job, setJob] = useState(initialJob);
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

  function handleApplicationUpdate(application: JobWithApplication["application"]) {
    setJob((prev) => ({ ...prev, application }));
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href="/applications"
        className="mb-4 inline-block text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-accent)]"
      >
        {t("workspace.back")}
      </Link>

      <ScrollReveal>
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {job.title}{" "}
              <span className="text-[var(--color-muted)]">@ {job.company}</span>
            </h1>
            {job.salary && (
              <p className="mt-1 text-sm text-[var(--color-success)]">{job.salary}</p>
            )}
          </div>
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card)] px-4 py-2 text-sm shadow-sm transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-accent)] hover:shadow-md"
            >
              {t("job.openPosting")}
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </header>
      </ScrollReveal>

      <div className="grid gap-6 lg:grid-cols-2">
        <ScrollReveal delay={80}>
          <div>
            {cvData ? (
              <WorkspaceDocumentPanel
                type="cv"
                data={cvData}
                profile={profile}
                photoUrl={cvPhotoUrl}
                jobTitle={job.title}
                company={job.company}
                jobId={job.id}
                onSaved={(app) => handleApplicationUpdate(app)}
                onRegenerate={() => setModalType("cv")}
              />
            ) : (
              <EmptyDocPanel
                label={t("workspace.noCv")}
                createLabel={t("job.createCv")}
                onCreate={() => setModalType("cv")}
              />
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={160}>
          <div>
            {coverData ? (
              <WorkspaceDocumentPanel
                type="cover_letter"
                data={coverData}
                profile={profile}
                photoUrl={coverPhotoUrl}
                jobTitle={job.title}
                company={job.company}
                jobId={job.id}
                onSaved={(app) => handleApplicationUpdate(app)}
                onRegenerate={() => setModalType("cover_letter")}
              />
            ) : (
              <EmptyDocPanel
                label={t("workspace.noCover")}
                createLabel={t("job.createCover")}
                onCreate={() => setModalType("cover_letter")}
              />
            )}
          </div>
        </ScrollReveal>
      </div>

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
          onGenerated={(_content, _instructions, application) => {
            handleApplicationUpdate(application);
            setModalType(null);
          }}
        />
      )}
    </div>
  );
}

function EmptyDocPanel({
  label,
  createLabel,
  onCreate,
}: {
  label: string;
  createLabel: string;
  onCreate: () => void;
}) {
  return (
    <div className="surface-card flex min-h-[300px] flex-col items-center justify-center border-dashed p-8 text-center">
      <p className="mb-4 text-sm text-[var(--color-muted)]">{label}</p>
      <Button type="button" onClick={onCreate}>
        {createLabel}
      </Button>
    </div>
  );
}
