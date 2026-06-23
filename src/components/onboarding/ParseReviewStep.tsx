"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import type { AiCvAnalysis, ParsedCvLocal, SkillEvidence } from "@/types/skills";
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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function handleAiAnalyze() {
    setAiLoading(true);
    setAiError(null);

    const res = await fetch("/api/cv/analyze", { method: "POST" });

    setAiLoading(false);

    if (!res.ok) {
      const data = (await res.json()) as { error?: string; hint?: string };
      setAiError(data.hint ?? data.error ?? "AI analysis unavailable");
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
    <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-6">
      <h2 className="mb-1 text-lg font-semibold">2. Review extraction</h2>
      <p className="mb-4 text-sm text-[var(--color-muted)]">
        Detected from your CV without AI. Optional: enhance with Groq or Gemini (1 call).
      </p>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Track" value={parsed.primaryTrack} />
        <Stat
          label="Experience"
          value={
            parsed.yearsExperienceEstimate
              ? `${parsed.yearsExperienceEstimate} years`
              : "—"
          }
        />
        <Stat label="Skills found" value={String(skillProfile.length)} />
      </div>

      {skillProfile.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-[var(--color-muted)]">
            Detected skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {skillProfile.map((s) => (
              <span
                key={s.name}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs",
                  s.confidence === "high"
                    ? "bg-green-500/20 text-green-400"
                    : s.confidence === "medium"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-slate-500/20 text-slate-400"
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
          Signals for questions: {parsed.signals.join(", ")}
        </p>
      )}

      {aiAnalysis?.imposterNote && (
        <p className="mb-4 rounded-lg bg-indigo-500/10 p-3 text-sm text-indigo-300">
          {aiAnalysis.imposterNote}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onContinue}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-accent-hover)]"
        >
          Continue to questions
        </button>
        <button
          type="button"
          onClick={handleAiAnalyze}
          disabled={aiLoading}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border border-[var(--color-card-border)] px-4 py-2 text-sm hover:border-[var(--color-accent)]",
            aiLoading && "opacity-60"
          )}
        >
          {aiLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Enhance with AI (optional)
        </button>
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
