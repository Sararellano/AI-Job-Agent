"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useT } from "@/contexts/LocaleProvider";
import type { AiCvAnalysis, CvProfileExtraction, OnboardingState, ParsedCvLocal } from "@/types/skills";
import type { UserProfile } from "@/types/documents";
import { normalizeCvProfileExtraction } from "@/lib/cv/normalize-extraction";
import { CvUploadStep } from "@/components/onboarding/CvUploadStep";
import { ParseReviewStep } from "@/components/onboarding/ParseReviewStep";
import { CvQuestionsWizard } from "@/components/onboarding/CvQuestionsWizard";
import { ProfileBasicStep } from "@/components/onboarding/ProfileBasicStep";

interface OnboardingClientProps {
  initial: OnboardingState;
  initialCvExtraction: CvProfileExtraction;
}

type Step = 0 | 1 | 2 | 3 | 4;

export function OnboardingClient({
  initial,
  initialCvExtraction,
}: OnboardingClientProps) {
  const t = useT();
  const router = useRouter();
  const [step, setStep] = useState<Step>(() => {
    if (initial.onboardingCompleted) return 4;
    if (initial.onboardingStep >= 4) return 4;
    if (initial.onboardingStep >= 3) return 3;
    if (initial.onboardingStep >= 2) return 2;
    if (initial.parsed) return initial.onboardingStep >= 1 ? 1 : 1;
    return 0;
  });
  const [parsed, setParsed] = useState<ParsedCvLocal | null>(initial.parsed);
  const [aiAnalysis, setAiAnalysis] = useState<AiCvAnalysis | null>(
    initial.aiAnalysis
  );
  const [cvFileName, setCvFileName] = useState(initial.cvFileName);

  const [cvExtraction, setCvExtraction] = useState(
    normalizeCvProfileExtraction(initialCvExtraction)
  );

  function handleUploaded(data: {
    parsed: ParsedCvLocal;
    skillProfile: unknown[];
    cvFileName: string;
    profile?: UserProfile;
    extraction?: CvProfileExtraction;
  }) {
    setParsed(data.parsed);
    setCvFileName(data.cvFileName);
    if (data.extraction) {
      setCvExtraction(normalizeCvProfileExtraction(data.extraction));
    }
    setStep(1);
  }

  function handleAiEnhanced(data: {
    parsed: ParsedCvLocal;
    skillProfile: unknown[];
    ai: AiCvAnalysis;
  }) {
    setParsed(data.parsed);
    setAiAnalysis(data.ai);
  }

  function handleQuestionsComplete() {
    setStep(3);
  }

  function handleProfileComplete() {
    setStep(4);
    router.refresh();
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4 py-8">
      <div className="absolute right-4 top-8 z-10 surface-card rounded-xl p-1 backdrop-blur-sm">
        <LanguageSwitch />
      </div>
      <ScrollReveal>
        <header className="mb-8">
          <p className="text-sm text-[var(--color-muted)]">
            {t("onboarding.backOnboarding")}
          </p>
          <h1 className="mt-2 text-2xl font-bold">{t("onboarding.title")}</h1>
          <p className="text-sm text-[var(--color-muted)]">{t("onboarding.subtitle")}</p>
          <div className="mt-4 flex gap-2">
            {[0, 1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  step >= s ? "bg-[var(--color-accent)]" : "bg-[var(--color-card-border)]"
                }`}
              />
            ))}
          </div>
        </header>
      </ScrollReveal>

      <div className="space-y-6">
        {step === 0 && (
          <ScrollReveal delay={80}>
            <CvUploadStep
              existingFileName={cvFileName}
              extractProfile
              onUploaded={handleUploaded}
            />
          </ScrollReveal>
        )}

        {step === 1 && parsed && (
          <ScrollReveal delay={80}>
            <ParseReviewStep
              parsed={parsed}
              skillProfile={initial.skillProfile}
              aiAnalysis={aiAnalysis}
              onContinue={() => setStep(2)}
              onAiEnhanced={handleAiEnhanced}
            />
          </ScrollReveal>
        )}

        {step === 2 && (
          <ScrollReveal delay={80}>
            <CvQuestionsWizard onComplete={handleQuestionsComplete} />
          </ScrollReveal>
        )}

        {step === 3 && (
          <ScrollReveal delay={80}>
            <ProfileBasicStep
              initialExtraction={cvExtraction}
              onComplete={handleProfileComplete}
            />
          </ScrollReveal>
        )}

        {step === 4 && (
          <ScrollReveal delay={80}>
            <div className="surface-card p-6 text-center">
              <h2 className="mb-2 text-lg font-semibold text-[var(--color-success)]">
                {t("onboarding.readyTitle")}
              </h2>
              <p className="mb-4 text-sm text-[var(--color-muted)]">
                {t("onboarding.readySubtitle", {
                  count: initial.skillProfile.length,
                })}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <ButtonLink href="/profile" variant="outline">
                  {t("onboarding.goProfile")}
                </ButtonLink>
                <ButtonLink href="/jobs/new">
                  {t("onboarding.goNewJob")}
                </ButtonLink>
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}
