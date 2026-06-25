"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import type { UserProfile } from "@/types/documents";
import type { OnboardingState } from "@/types/skills";
import { DefaultInstructionsSection } from "@/components/dashboard/DefaultInstructionsSection";
import { CvUploadStep } from "@/components/onboarding/CvUploadStep";
import { CvQuestionsWizard } from "@/components/onboarding/CvQuestionsWizard";
import { useT } from "@/contexts/LocaleProvider";

interface ProfileClientProps {
  profile: UserProfile;
  onboarding: OnboardingState;
  defaultCvInstructions: string;
  defaultCoverLetterInstructions: string;
  defaultCvPhotoUrl: string | null;
  defaultCoverLetterPhotoUrl: string | null;
  defaultCvTemplateId: string;
  defaultCoverTemplateId: string;
}

/**
 * Profile page: contact, AI defaults, CV re-upload and skills.
 */
export function ProfileClient({
  profile: initialProfile,
  onboarding,
  defaultCvInstructions,
  defaultCoverLetterInstructions,
  defaultCvPhotoUrl,
  defaultCoverLetterPhotoUrl,
  defaultCvTemplateId,
  defaultCoverTemplateId,
}: ProfileClientProps) {
  const t = useT();
  const [profile, setProfile] = useState(initialProfile);
  const [cvDefaults, setCvDefaults] = useState(defaultCvInstructions);
  const [coverDefaults, setCoverDefaults] = useState(defaultCoverLetterInstructions);
  const [cvPhotoDefault, setCvPhotoDefault] = useState(defaultCvPhotoUrl);
  const [coverPhotoDefault, setCoverPhotoDefault] = useState(defaultCoverLetterPhotoUrl);
  const [cvTemplateDefault, setCvTemplateDefault] = useState(defaultCvTemplateId);
  const [coverTemplateDefault, setCoverTemplateDefault] = useState(defaultCoverTemplateId);
  const [showCvUpload, setShowCvUpload] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);

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
              onUploaded={() => {
                setShowCvUpload(false);
                setShowQuestions(true);
              }}
            />
          ) : (
            <Button variant="outline" onClick={() => setShowCvUpload(true)}>
              {t("profilePage.updateCv")}
            </Button>
          )}
        </div>
      </ScrollReveal>

      <ScrollReveal delay={160}>
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
