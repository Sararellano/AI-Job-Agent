"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AiCvAnalysis, OnboardingState, ParsedCvLocal, SkillEvidence } from "@/types/skills";
import { CvUploadStep } from "@/components/onboarding/CvUploadStep";
import { ParseReviewStep } from "@/components/onboarding/ParseReviewStep";
import { SkillDiscoveryWizard } from "@/components/onboarding/SkillDiscoveryWizard";

interface OnboardingClientProps {
  initial: OnboardingState;
}

type Step = 0 | 1 | 2 | 3;

export function OnboardingClient({ initial }: OnboardingClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(
    initial.onboardingCompleted
      ? 3
      : initial.parsed
        ? initial.onboardingStep >= 2
          ? 2
          : 1
        : 0
  );
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

  function handleComplete(profile: SkillEvidence[]) {
    setSkillProfile(profile);
    setStep(3);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]"
        >
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Build your evidence profile</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Upload CV → local parse → quick questions → better matching
        </p>
        <div className="mt-4 flex gap-2">
          {[0, 1, 2, 3].map((s) => (
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

        {step === 2 && <SkillDiscoveryWizard onComplete={handleComplete} />}

        {step === 3 && (
          <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold text-[var(--color-success)]">
              Profile ready
            </h2>
            <p className="mb-4 text-sm text-[var(--color-muted)]">
              {skillProfile.length} skills in your evidence profile.
            </p>
            <Link
              href="/dashboard"
              className="inline-block rounded-lg bg-[var(--color-accent)] px-6 py-2.5 text-sm font-medium"
            >
              Go to job offers
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
