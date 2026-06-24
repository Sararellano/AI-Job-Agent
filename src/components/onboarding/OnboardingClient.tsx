"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/contexts/LocaleProvider";
import type { AiCvAnalysis, OnboardingState, ParsedCvLocal, SkillEvidence } from "@/types/skills";
import type { JobPreferences } from "@/types/job-preferences";
import { CvUploadStep } from "@/components/onboarding/CvUploadStep";
import { ParseReviewStep } from "@/components/onboarding/ParseReviewStep";
import { SkillDiscoveryWizard } from "@/components/onboarding/SkillDiscoveryWizard";
import { JobPreferencesStep } from "@/components/onboarding/JobPreferencesStep";

interface OnboardingClientProps {
  initial: OnboardingState;
}

type Step = 0 | 1 | 2 | 3 | 4;

export function OnboardingClient({ initial }: OnboardingClientProps) {
  const t = useT();
  const router = useRouter();
  const [step, setStep] = useState<Step>(() => {
    if (initial.onboardingCompleted) return 4;
    if (initial.onboardingStep >= 3) return 3;
    if (initial.parsed) return initial.onboardingStep >= 2 ? 2 : 1;
    return 0;
  });
  const [parsed, setParsed] = useState<ParsedCvLocal | null>(initial.parsed);
  const [skillProfile, setSkillProfile] = useState<SkillEvidence[]>(
    initial.skillProfile
  );
  const [aiAnalysis, setAiAnalysis] = useState<AiCvAnalysis | null>(
    initial.aiAnalysis
  );
  const [cvFileName, setCvFileName] = useState(initial.cvFileName);

  function handleUploaded(data: {
    parsed: ParsedCvLocal;
    skillProfile: SkillEvidence[];
    cvFileName: string;
  }) {
    setParsed(data.parsed);
    setSkillProfile(data.skillProfile);
    setCvFileName(data.cvFileName);
    setStep(1);
  }

  function handleAiEnhanced(data: {
    parsed: ParsedCvLocal;
    skillProfile: SkillEvidence[];
    ai: AiCvAnalysis;
  }) {
    setParsed(data.parsed);
    setSkillProfile(data.skillProfile);
    setAiAnalysis(data.ai);
  }

  function handleSkillsComplete(profile: SkillEvidence[]) {
    setSkillProfile(profile);
    setStep(3);
  }

  function handlePreferencesComplete(_prefs: JobPreferences) {
    setStep(4);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-8 pr-20">
        <Link
          href="/dashboard"
          className="text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]"
        >
          {t("onboarding.backDashboard")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{t("onboarding.title")}</h1>
        <p className="text-sm text-[var(--color-muted)]">{t("onboarding.subtitle")}</p>
        <div className="mt-4 flex gap-2">
          {[0, 1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${
                step >= s ? "bg-[var(--color-accent)]" : "bg-[var(--color-card-border)]"
              }`}
            />
          ))}
        </div>
      </header>

      <div className="space-y-6">
        {step === 0 && (
          <CvUploadStep
            existingFileName={cvFileName}
            onUploaded={handleUploaded}
          />
        )}

        {step === 1 && parsed && (
          <ParseReviewStep
            parsed={parsed}
            skillProfile={skillProfile}
            aiAnalysis={aiAnalysis}
            onContinue={() => setStep(2)}
            onAiEnhanced={handleAiEnhanced}
          />
        )}

        {step === 2 && <SkillDiscoveryWizard onComplete={handleSkillsComplete} />}

        {step === 3 && <JobPreferencesStep onComplete={handlePreferencesComplete} />}

        {step === 4 && (
          <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold text-[var(--color-success)]">
              {t("onboarding.readyTitle")}
            </h2>
            <p className="mb-4 text-sm text-[var(--color-muted)]">
              {t("onboarding.readySubtitle", { count: skillProfile.length })}
            </p>
            <Link
              href="/dashboard"
              className="inline-block rounded-lg bg-[var(--color-accent)] px-6 py-2.5 text-sm font-medium"
            >
              {t("onboarding.goDashboard")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
