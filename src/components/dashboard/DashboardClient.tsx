"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, UserCircle, Settings2, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/contexts/LocaleProvider";
import type { JobWithApplication } from "@/types/database";
import type { UserProfile } from "@/types/documents";
import type { OnboardingState } from "@/types/skills";
import type { JobPreferences } from "@/types/job-preferences";
import { DEFAULT_JOB_PREFERENCES } from "@/types/job-preferences";
import {
  DEFAULT_CV_TEMPLATE,
  DEFAULT_COVER_TEMPLATE,
} from "@/types/documents";
import { DefaultInstructionsSection } from "@/components/dashboard/DefaultInstructionsSection";
import { AddJobForm } from "@/components/dashboard/AddJobForm";
import { SyncJobsButton } from "@/components/dashboard/SyncJobsButton";
import { JobOfferCard } from "@/components/dashboard/JobOfferCard";
import { JobPreferencesEditor } from "@/components/dashboard/JobPreferencesEditor";
import type { JobWithRelevance, MatchedJobsResponse } from "@/app/api/jobs/matched/route";

type TabView = "matched" | "all";

interface DashboardClientProps {
  jobs: JobWithApplication[];
  profile: UserProfile;
  onboarding: OnboardingState;
  defaultCvInstructions: string;
  defaultCoverLetterInstructions: string;
  defaultCvPhotoUrl: string | null;
  defaultCoverLetterPhotoUrl: string | null;
  defaultCvTemplateId: string;
  defaultCoverTemplateId: string;
  userEmail: string;
}

export function DashboardClient({
  jobs: initialJobs,
  profile: initialProfile,
  onboarding,
  defaultCvInstructions,
  defaultCoverLetterInstructions,
  defaultCvPhotoUrl,
  defaultCoverLetterPhotoUrl,
  defaultCvTemplateId,
  defaultCoverTemplateId,
  userEmail,
}: DashboardClientProps) {
  const t = useT();
  const [jobs, setJobs] = useState(initialJobs);
  const [profile, setProfile] = useState(initialProfile);
  const [cvDefaults, setCvDefaults] = useState(defaultCvInstructions);
  const [coverDefaults, setCoverDefaults] = useState(defaultCoverLetterInstructions);
  const [cvPhotoDefault, setCvPhotoDefault] = useState(defaultCvPhotoUrl);
  const [coverPhotoDefault, setCoverPhotoDefault] = useState(defaultCoverLetterPhotoUrl);
  const [cvTemplateDefault, setCvTemplateDefault] = useState(defaultCvTemplateId);
  const [coverTemplateDefault, setCoverTemplateDefault] = useState(defaultCoverTemplateId);

  // Preferences & matching state
  const [preferences, setPreferences] = useState<JobPreferences>(
    onboarding.jobPreferences ?? DEFAULT_JOB_PREFERENCES
  );
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabView>("matched");
  const [matchedJobs, setMatchedJobs] = useState<JobWithRelevance[]>([]);
  const [matchLoading, setMatchLoading] = useState(true);

  const fetchMatched = useCallback(async (showAll: boolean) => {
    setMatchLoading(true);
    try {
      const url = showAll ? "/api/jobs/matched?all=true" : "/api/jobs/matched";
      const res = await fetch(url);
      if (!res.ok) return;
      const data = (await res.json()) as MatchedJobsResponse;
      setMatchedJobs(data.jobs);
    } finally {
      setMatchLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatched(activeTab === "all");
  }, [activeTab, fetchMatched]);

  // Rebuild scorecard map for quick lookup
  const scoreMap = new Map(
    matchedJobs.map((j) => [j.id, { score: j.score, keywords: j.matchedKeywords, reasons: j.reasons }])
  );

  function handleJobAdded(job: JobWithApplication) {
    setJobs((prev) => [{ ...job, application: null }, ...prev]);
    // Refresh matched list after adding a new job
    fetchMatched(activeTab === "all");
  }

  function handleApplicationUpdate(
    jobId: string,
    application: JobWithApplication["application"]
  ) {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, application } : j))
    );
  }

  function handlePreferencesSaved(prefs: JobPreferences) {
    setPreferences(prefs);
    setPrefsOpen(false);
    // Refresh matched list with new preferences
    fetchMatched(activeTab === "all");
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  // Compute display list: for "matched" tab use scored order; for "all" use jobs list
  const displayJobs: JobWithApplication[] =
    activeTab === "matched"
      ? matchedJobs
          .map((mj) => jobs.find((j) => j.id === mj.id) ?? { ...mj, application: null })
          .filter(Boolean) as JobWithApplication[]
      : jobs;

  const hasPreferences = Boolean(onboarding.jobPreferences);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 pr-20">
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
          <p className="text-sm text-[var(--color-muted)]">
            {t("dashboard.signedInAs", { email: userEmail })}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-card-border)] px-4 py-2 text-sm hover:border-[var(--color-danger)] hover:text-[var(--color-danger)]"
        >
          <LogOut className="h-4 w-4" />
          {t("dashboard.signOut")}
        </button>
      </header>

      {!onboarding.onboardingCompleted && (
        <Link
          href="/onboarding"
          className="mb-6 flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 transition-colors hover:bg-amber-500/15"
        >
          <UserCircle className="h-8 w-8 shrink-0 text-amber-400" />
          <div>
            <p className="font-medium text-amber-200">{t("dashboard.completeProfile")}</p>
            <p className="text-sm text-amber-200/70">
              {onboarding.parsed
                ? t("dashboard.completeProfileParsed", {
                    count: onboarding.skillProfile.length,
                  })
                : t("dashboard.completeProfileEmpty")}
            </p>
          </div>
        </Link>
      )}

      {onboarding.onboardingCompleted && onboarding.skillProfile.length > 0 && (
        <div className="mb-6 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-4">
          <p className="mb-2 text-xs font-medium text-[var(--color-muted)]">
            {t("dashboard.evidenceProfile", {
              count: onboarding.skillProfile.length,
            })}
          </p>
          <div className="flex flex-wrap gap-1">
            {onboarding.skillProfile.slice(0, 15).map((s) => (
              <span
                key={s.name}
                className="rounded-full bg-[var(--color-background)] px-2 py-0.5 text-xs"
              >
                {s.name}
              </span>
            ))}
          </div>
          <Link
            href="/onboarding"
            className="mt-2 inline-block text-xs text-[var(--color-accent)] hover:underline"
          >
            {t("dashboard.editProfile")}
          </Link>
        </div>
      )}

      <div className="mb-8">
        <DefaultInstructionsSection
          initialProfile={profile}
          initialCvInstructions={cvDefaults}
          initialCoverLetterInstructions={coverDefaults}
          initialCvPhotoUrl={cvPhotoDefault}
          initialCoverLetterPhotoUrl={coverPhotoDefault}
          initialCvTemplateId={cvTemplateDefault}
          initialCoverTemplateId={coverTemplateDefault}
          onSaved={(data) => {
            setProfile(data.profile);
            setCvDefaults(data.cv);
            setCoverDefaults(data.cover);
            setCvPhotoDefault(data.cvPhoto);
            setCoverPhotoDefault(data.coverPhoto);
            setCvTemplateDefault(data.cvTemplateId);
            setCoverTemplateDefault(data.coverTemplateId);
          }}
        />
      </div>

      <AddJobForm
        onJobAdded={(job) => handleJobAdded({ ...job, application: null })}
      />

      {/* Job preferences panel */}
      {hasPreferences && (
        <div className="mb-6 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card)]">
          <button
            type="button"
            onClick={() => setPrefsOpen((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium"
          >
            <span className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-[var(--color-accent)]" />
              {t("prefs.editTitle")}
            </span>
            {prefsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {prefsOpen && (
            <div className="border-t border-[var(--color-card-border)] px-5 pb-5 pt-4">
              <p className="mb-4 text-xs text-[var(--color-muted)]">{t("prefs.editSubtitle")}</p>
              <JobPreferencesEditor
                initial={preferences}
                onSaved={handlePreferencesSaved}
              />
            </div>
          )}
        </div>
      )}

      <section>
        {/* Tab bar + sync button */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-[var(--color-card-border)] p-1">
            <TabButton
              active={activeTab === "matched"}
              onClick={() => setActiveTab("matched")}
              label={t("dashboard.forYou", { count: String(matchedJobs.length) })}
            />
            <TabButton
              active={activeTab === "all"}
              onClick={() => setActiveTab("all")}
              label={t("dashboard.allOffers2", { count: String(jobs.length) })}
            />
          </div>
          <SyncJobsButton onSynced={() => fetchMatched(activeTab === "all")} />
        </div>

        {matchLoading ? (
          <p className="py-8 text-center text-sm text-[var(--color-muted)]">…</p>
        ) : displayJobs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--color-card-border)] p-8 text-center text-[var(--color-muted)]">
            {activeTab === "matched"
              ? t("dashboard.noMatches")
              : t("dashboard.noOffers")}
          </p>
        ) : (
          <div className="space-y-4">
            {displayJobs.map((job) => {
              const match = scoreMap.get(job.id);
              return (
                <JobOfferCard
                  key={job.id}
                  job={job}
                  profile={profile}
                  defaultCvInstructions={cvDefaults}
                  defaultCoverLetterInstructions={coverDefaults}
                  defaultCvPhotoUrl={cvPhotoDefault}
                  defaultCoverLetterPhotoUrl={coverPhotoDefault}
                  defaultCvTemplateId={cvTemplateDefault}
                  defaultCoverTemplateId={coverTemplateDefault}
                  onApplicationUpdate={handleApplicationUpdate}
                  matchScore={match?.score}
                  matchedKeywords={match?.keywords}
                  matchReasons={match?.reasons}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-[var(--color-accent)] text-white"
          : "hover:bg-[var(--color-background)] text-[var(--color-muted)]"
      }`}
    >
      {label}
    </button>
  );
}
