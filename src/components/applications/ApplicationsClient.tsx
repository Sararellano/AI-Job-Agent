"use client";

import { ArrowRight, FileCheck, FileX } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useT } from "@/contexts/LocaleProvider";
import type { JobWithApplication } from "@/types/database";
import { parseCvContent, parseCoverLetterContent } from "@/lib/documents/parse-content";
import { cn } from "@/lib/utils";

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
      <ScrollReveal>
        <header className="mb-6">
          <h1 className="text-2xl font-bold">{t("applications.title")}</h1>
          <p className="text-sm text-[var(--color-muted)]">{t("applications.subtitle")}</p>
        </header>
      </ScrollReveal>

      {jobs.length === 0 ? (
        <ScrollReveal delay={80}>
          <div className="surface-card border-dashed p-8 text-center">
            <p className="mb-4 text-[var(--color-muted)]">{t("applications.empty")}</p>
            <ButtonLink href="/jobs/new">{t("applications.newCta")}</ButtonLink>
          </div>
        </ScrollReveal>
      ) : (
        <div className="space-y-3">
          {jobs.map((job, index) => {
            const cv = parseCvContent(job.application?.custom_cv_content ?? null);
            const cover = parseCoverLetterContent(
              job.application?.cover_letter_content ?? null
            );
            const docsReady = Boolean(cv && cover);

            return (
              <ScrollReveal key={job.id} delay={index * 80}>
                <Link
                  href={`/applications/${job.id}`}
                  className={cn(
                    "surface-card flex items-center justify-between gap-4 p-4 transition-all duration-200",
                    "hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:shadow-[var(--shadow-card-hover)]"
                  )}
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
                          <FileX className="h-3.5 w-3.5 text-amber-500" />
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
                  <ArrowRight className="h-5 w-5 shrink-0 text-[var(--color-muted)] transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
