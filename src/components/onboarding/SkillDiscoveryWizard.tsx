"use client";

import { useEffect, useState } from "react";
import type {
  DiscoveryQuestion,
  QuestionAnswer,
  SkillEvidence,
} from "@/types/skills";
import { cn } from "@/lib/utils";

interface SkillDiscoveryWizardProps {
  onComplete: (skillProfile: SkillEvidence[]) => void;
}

const BATCH_SIZE = 5;

/**
 * Step 3: Yes / Somewhat / No questions — zero AI tokens.
 */
export function SkillDiscoveryWizard({ onComplete }: SkillDiscoveryWizardProps) {
  const [questions, setQuestions] = useState<DiscoveryQuestion[]>([]);
  const [imposterTips, setImposterTips] = useState<DiscoveryQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [batchIndex, setBatchIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillProfile, setSkillProfile] = useState<SkillEvidence[]>([]);

  useEffect(() => {
    fetch("/api/cv/answers")
      .then((r) => r.json())
      .then((data: {
        questions: DiscoveryQuestion[];
        answers: Record<string, QuestionAnswer>;
        skillProfile: SkillEvidence[];
      }) => {
        const all = data.questions ?? [];
        setImposterTips(all.filter((q) => q.category === "imposter"));
        const actionable = all.filter((q) => q.category !== "imposter");
        setQuestions(actionable);
        setAnswers(data.answers ?? {});
        setSkillProfile(data.skillProfile ?? []);
        setLoading(false);
      });
  }, []);

  const batches: DiscoveryQuestion[][] = [];
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    batches.push(questions.slice(i, i + BATCH_SIZE));
  }

  const currentBatch = batches[batchIndex] ?? [];

  function setAnswer(id: string, value: QuestionAnswer) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  async function saveBatch(complete: boolean) {
    setSaving(true);
    const res = await fetch("/api/cv/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, complete }),
    });
    setSaving(false);

    if (res.ok) {
      const data = (await res.json()) as { skillProfile: SkillEvidence[] };
      setSkillProfile(data.skillProfile);
      if (complete) {
        onComplete(data.skillProfile);
      } else {
        setBatchIndex((i) => i + 1);
      }
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-8 text-center text-sm text-[var(--color-muted)]">
        Loading questions…
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-6">
        <p className="mb-4 text-sm">No extra questions needed from your CV.</p>
        <button
          type="button"
          onClick={() => saveBatch(true)}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium"
        >
          Finish onboarding
        </button>
      </div>
    );
  }

  const isLastBatch = batchIndex >= batches.length - 1;

  return (
    <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-6">
      <h2 className="mb-1 text-lg font-semibold">3. Skill discovery</h2>
      <p className="mb-2 text-sm text-[var(--color-muted)]">
        Tap answers — we infer skills (e.g. .yml → YAML). No typing required.
      </p>
      <p className="mb-4 text-xs text-[var(--color-muted)]">
        Batch {batchIndex + 1} of {batches.length}
      </p>

      {batchIndex === 0 && imposterTips.length > 0 && (
        <div className="mb-4 space-y-2">
          {imposterTips.map((tip) => (
            <p
              key={tip.id}
              className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3 text-sm text-indigo-200"
            >
              {tip.text}
            </p>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {currentBatch.map((q) => (
          <div
            key={q.id}
            className="rounded-xl bg-[var(--color-background)] p-4"
          >
            <p className="mb-3 text-sm">{q.text}</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["yes", "Yes"],
                  ["somewhat", "A little"],
                  ["no", "No"],
                  ["skip", "Skip"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAnswer(q.id, value)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    answers[q.id] === value
                      ? "bg-[var(--color-accent)] text-white"
                      : "border border-[var(--color-card-border)] hover:border-[var(--color-accent)]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {skillProfile.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-[var(--color-muted)]">Profile so far</p>
          <div className="flex flex-wrap gap-1">
            {skillProfile.slice(0, 20).map((s) => (
              <span
                key={s.name}
                className="rounded bg-[var(--color-background)] px-2 py-0.5 text-xs"
              >
                {s.name}
              </span>
            ))}
            {skillProfile.length > 20 && (
              <span className="text-xs text-[var(--color-muted)]">
                +{skillProfile.length - 20} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => saveBatch(isLastBatch)}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {saving
            ? "Saving…"
            : isLastBatch
              ? "Finish onboarding"
              : "Next batch"}
        </button>
      </div>
    </div>
  );
}
