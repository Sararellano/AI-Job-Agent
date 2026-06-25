"use client";

import Link from "next/link";
import { ArrowRight, FileCheck, FileX } from "lucide-react";
import { useT } from "@/contexts/LocaleProvider";
import type { JobWithApplication } from "@/types/database";
import { parseCvContent, parseCoverLetterContent } from "@/lib/documents/parse-content";

interface ApplicationsClientProps {
  jobs: JobWithApplication[];
}

/**
 * List of user applications with status and document readiness.
 */
export function ApplicationsClient({ jobs }: ApplicationsClientProps) {
  const t = useT();

  return (
    <div className="mx-auto max-w-4xl">
      <header>
        <h1 className="text-2xl font-bold">{t("applications.title")}</h1>
        <p className="text-sm text-[var(--color-muted)]">{t("applications.subtitle")}</p>
      </header>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-card-border)] p-8 text-center">
          <p className="mb-4 text-[var(--color-muted)]">{t("applications.empty")}</p>
          <Link
            href="/jobs/new"
            className="inline-block rounded-lg bg-[var(--color-accent)] px-6 py-2.5 text-sm font-medium text-white"
          >
            {t("applications.newCta")}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const cv = parseCvContent(job.application?.custom_cv_content ?? null);
            const cover = parseCoverLetterContent(
              job.application?.cover_letter_content ?? null
            );
            const docsReady = Boolean(cv && cover);

            return (
              <Link
                key={job.id}
                href={`/applications/${job.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-4 transition-colors hover:border-[var(--color-accent)]"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-accent)]">
                    {job.company}
                  </p>
                  <h3 className="font-semibold">{job.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
                    {docsReady ? (
                      <>
                        <FileCheck className="h-3.5 w-3.5 text-[var(--color-success)]" />
                        {t("applications.docsReady")}
                      </>
                    ) : cv || cover ? (
                      <>
                        <FileX className="h-3.5 w-3.5 text-amber-400" />
                        {t("applications.docsPending")}
                      </>
                    ) : (
                      <>
                        <FileX className="h-3.5 w-3.5" />
                        {t("applications.noDocs")}
                      </>
                    )}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-[var(--color-muted)]" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
