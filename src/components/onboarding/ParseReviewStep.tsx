"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import type { AiCvAnalysis, ParsedCvLocal, SkillEvidence } from "@/types/skills";
import { Button } from "@/components/ui/Button";
import { useT } from "@/contexts/LocaleProvider";
import { cn } from "@/lib/utils";

interface ParseReviewStepProps {
  parsed: ParsedCvLocal;
  skillProfile: SkillEvidence[];
  aiAnalysis: AiCvAnalysis | null;
  onContinue: () => void;
  onAiEnhanced: (data: {
    parsed: ParsedCvLocal;
    skillProfile: SkillEvidence[];
    ai: AiCvAnalysis;
  }) => void;
}

/**
 * Step 2: Review local parse + optional Groq/Gemini enhancement.
 */
export function ParseReviewStep({
  parsed,
  skillProfile,
  aiAnalysis,
  onContinue,
  onAiEnhanced,
}: ParseReviewStepProps) {
  const t = useT();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function handleAiAnalyze() {
    setAiLoading(true);
    setAiError(null);

    const res = await fetch("/api/cv/analyze", { method: "POST" });

    setAiLoading(false);

    if (!res.ok) {
      const data = (await res.json()) as { error?: string; hint?: string };
      setAiError(data.hint ?? data.error ?? t("onboarding.aiUnavailable"));
      return;
    }

    const data = (await res.json()) as {
      ai: AiCvAnalysis;
      parsed: ParsedCvLocal;
      skillProfile: SkillEvidence[];
    };

    onAiEnhanced(data);
  }

  return (
    <div className="surface-card p-6">
      <h2 className="mb-1 text-lg font-semibold">{t("onboarding.step2Title")}</h2>
      <p className="mb-4 text-sm text-[var(--color-muted)]">
        {t("onboarding.step2Subtitle")}
      </p>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label={t("onboarding.track")} value={parsed.primaryTrack} />
        <Stat
          label={t("onboarding.experience")}
          value={
            parsed.yearsExperienceEstimate
              ? t("onboarding.years", { count: parsed.yearsExperienceEstimate })
              : "—"
          }
        />
        <Stat label={t("onboarding.skillsFound")} value={String(skillProfile.length)} />
      </div>

      {skillProfile.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-[var(--color-muted)]">
            {t("onboarding.detectedSkills")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {skillProfile.map((s) => (
              <span
                key={s.name}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs",
                  s.confidence === "high"
                    ? "bg-green-100 text-green-700"
                    : s.confidence === "medium"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-600"
                )}
                title={`${s.level} · ${s.confidence}`}
              >
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {parsed.signals.length > 0 && (
        <p className="mb-4 text-xs text-[var(--color-muted)]">
          {t("onboarding.signals", { list: parsed.signals.join(", ") })}
        </p>
      )}

      {aiAnalysis?.imposterNote && (
        <p className="mb-4 rounded-lg bg-[color-mix(in_srgb,var(--color-accent)_10%,white)] p-3 text-sm text-[var(--color-accent-hover)]">
          {aiAnalysis.imposterNote}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={onContinue}>
          {t("onboarding.continueQuestions")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleAiAnalyze}
          disabled={aiLoading}
        >
          {aiLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {t("onboarding.enhanceAi")}
        </Button>
      </div>

      {aiError && (
        <p className="mt-3 text-xs text-[var(--color-muted)]">{aiError}</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--color-background)] p-3">
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className="font-semibold capitalize">{value}</p>
    </div>
  );
}
