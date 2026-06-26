"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import type { UserProfile } from "@/types/documents";
import type { CvProfileExtraction, OnboardingState } from "@/types/skills";
import { DefaultInstructionsSection } from "@/components/dashboard/DefaultInstructionsSection";
import { CvUploadStep } from "@/components/onboarding/CvUploadStep";
import { CvQuestionsWizard } from "@/components/onboarding/CvQuestionsWizard";
import { normalizeCvProfileExtraction } from "@/lib/cv/normalize-extraction";
import { useT } from "@/contexts/LocaleProvider";

interface ProfileClientProps {
  profile: UserProfile;
  cvProfileExtraction: CvProfileExtraction;
  onboarding: OnboardingState;
  defaultCvInstructions: string;
  defaultCoverLetterInstructions: string;
  defaultCvPhotoUrl: string | null;
  defaultCoverLetterPhotoUrl: string | null;
  defaultCoverTemplateId: string;
}

/**
 * Profile page: contact, AI defaults, CV re-upload and skills.
 */
export function ProfileClient({
  profile: initialProfile,
  cvProfileExtraction: initialCvExtraction,
  onboarding,
  defaultCvInstructions,
  defaultCoverLetterInstructions,
  defaultCvPhotoUrl,
  defaultCoverLetterPhotoUrl,
  defaultCoverTemplateId,
}: ProfileClientProps) {
  const t = useT();
  const [profile, setProfile] = useState(initialProfile);
  const [cvExtraction, setCvExtraction] = useState(initialCvExtraction);
  const [cvDefaults, setCvDefaults] = useState(defaultCvInstructions);
  const [coverDefaults, setCoverDefaults] = useState(defaultCoverLetterInstructions);
  const [cvPhotoDefault, setCvPhotoDefault] = useState(defaultCvPhotoUrl);
  const [coverPhotoDefault, setCoverPhotoDefault] = useState(defaultCoverLetterPhotoUrl);
  const [coverTemplateDefault, setCoverTemplateDefault] = useState(defaultCoverTemplateId);
  const [showCvUpload, setShowCvUpload] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [extractMessage, setExtractMessage] = useState<string | null>(null);
  const [profileSyncKey, setProfileSyncKey] = useState(0);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <ScrollReveal>
        <header>
          <h1 className="text-2xl font-bold">{t("profilePage.title")}</h1>
          <p className="text-sm text-[var(--color-muted)]">{t("profilePage.subtitle")}</p>
          <ButtonLink href="/jobs/new" className="mt-4">
            {t("applications.newCta")}
          </ButtonLink>
        </header>
      </ScrollReveal>

      {onboarding.skillProfile.length > 0 && (
        <ScrollReveal delay={80}>
          <div className="surface-card p-4">
            <p className="mb-2 text-xs font-medium text-[var(--color-muted)]">
              {t("profilePage.skillsTitle", {
                count: String(onboarding.skillProfile.length),
              })}
            </p>
            <div className="flex flex-wrap gap-1">
              {onboarding.skillProfile.slice(0, 20).map((s) => (
                <span
                  key={s.name}
                  className="rounded-full bg-[var(--color-background)] px-2 py-0.5 text-xs"
                >
                  {s.name}
                </span>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQuestions((v) => !v)}
              className="mt-3 px-0 text-[var(--color-accent)] hover:bg-transparent"
            >
              {t("profilePage.reanswer")}
            </Button>
          </div>
        </ScrollReveal>
      )}

      {showQuestions && (
        <ScrollReveal>
          <CvQuestionsWizard onComplete={() => setShowQuestions(false)} />
        </ScrollReveal>
      )}

      <ScrollReveal delay={120}>
        <div className="surface-card p-5">
          <h2 className="mb-1 text-sm font-semibold">{t("profilePage.updateCv")}</h2>
          <p className="mb-4 text-xs text-[var(--color-muted)]">
            {t("profilePage.updateCvHint")}
          </p>
          {showCvUpload ? (
            <CvUploadStep
              existingFileName={onboarding.cvFileName}
              extractProfile
              onUploaded={(data) => {
                setShowCvUpload(false);
                if (data.profile) {
                  setProfile(data.profile);
                  if (data.extraction) {
                    setCvExtraction(normalizeCvProfileExtraction(data.extraction));
                  }
                  if (data.cvInstructions) setCvDefaults(data.cvInstructions);
                  if (data.coverInstructions) setCoverDefaults(data.coverInstructions);
                  setProfileSyncKey((k) => k + 1);
                  setExtractMessage(
                    data.aiUsed
                      ? t("profilePage.extractedAi")
                      : t("profilePage.extractedHeuristic")
                  );
                }
              }}
            />
          ) : (
            <Button variant="outline" onClick={() => setShowCvUpload(true)}>
              {t("profilePage.updateCv")}
            </Button>
          )}
          {extractMessage && (
            <p className="mt-3 text-sm text-[var(--color-success)]">{extractMessage}</p>
          )}
        </div>
      </ScrollReveal>

      <ScrollReveal delay={160}>
        <DefaultInstructionsSection
          key={profileSyncKey}
          initialProfile={profile}
          initialCvExtraction={cvExtraction}
          initialCvInstructions={cvDefaults}
          initialCoverLetterInstructions={coverDefaults}
          initialCvPhotoUrl={cvPhotoDefault}
          initialCoverLetterPhotoUrl={coverPhotoDefault}
          initialCoverTemplateId={coverTemplateDefault}
          onSaved={(data) => {
            setProfile(data.profile);
            setCvExtraction(data.cvExtraction);
            setCvDefaults(data.cv);
            setCoverDefaults(data.cover);
            setCvPhotoDefault(data.cvPhoto);
            setCoverPhotoDefault(data.coverPhoto);
            setCoverTemplateDefault(data.coverTemplateId);
          }}
        />
      </ScrollReveal>

      <Link
        href="/onboarding"
        className="inline-block text-sm text-[var(--color-accent)] hover:underline"
      >
        {t("dashboard.editProfile")}
      </Link>
    </div>
  );
}
