"use client";

import { useEffect, useState } from "react";
import { useT } from "@/contexts/LocaleProvider";
import { cn } from "@/lib/utils";
import type { CustomCvAnswer, CustomCvQuestion } from "@/types/skills";

interface CvQuestionsWizardProps {
  onComplete: () => void;
}

const BATCH_SIZE = 4;

/**
 * AI-personalized CV questions wizard with yes/no and text answers.
 */
export function CvQuestionsWizard({ onComplete }: CvQuestionsWizardProps) {
  const t = useT();
  const [questions, setQuestions] = useState<CustomCvQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, CustomCvAnswer>>({});
  const [batchIndex, setBatchIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/cv/questions")
      .then((r) => r.json())
      .then((data: { questions: CustomCvQuestion[]; answers: Record<string, CustomCvAnswer> }) => {
        setQuestions(data.questions ?? []);
        setAnswers(data.answers ?? {});
        setLoading(false);
      });
  }, []);

  const batches: CustomCvQuestion[][] = [];
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    batches.push(questions.slice(i, i + BATCH_SIZE));
  }

  const currentBatch = batches[batchIndex] ?? [];
  const isLastBatch = batchIndex >= batches.length - 1;

  function setYesNo(id: string, value: string) {
    setAnswers((prev) => ({
      ...prev,
      [id]: { type: "yes_no", value },
    }));
  }

  function setText(id: string, value: string) {
    setAnswers((prev) => ({
      ...prev,
      [id]: { type: "text", value },
    }));
  }

  async function saveBatch(finish: boolean) {
    setSaving(true);
    const res = await fetch("/api/cv/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    setSaving(false);

    if (res.ok) {
      if (finish || questions.length === 0) {
        onComplete();
      } else {
        setBatchIndex((i) => i + 1);
      }
    }
  }

  if (loading) {
    return (
      <p className="text-center text-sm text-[var(--color-muted)]">
        {t("cvQuestions.loading")}
      </p>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-6 text-center">
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          {t("onboarding.noQuestions")}
        </p>
        <button
          type="button"
          onClick={() => onComplete()}
          className="rounded-lg bg-[var(--color-accent)] px-6 py-2.5 text-sm font-medium"
        >
          {t("cvQuestions.finish")}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-6">
      <h2 className="mb-1 text-lg font-semibold">{t("cvQuestions.title")}</h2>
      <p className="mb-6 text-sm text-[var(--color-muted)]">
        {t("cvQuestions.subtitle")}
      </p>

      {batches.length > 1 && (
        <p className="mb-4 text-xs text-[var(--color-muted)]">
          {t("onboarding.batch", {
            current: String(batchIndex + 1),
            total: String(batches.length),
          })}
        </p>
      )}

      <div className="space-y-6">
        {currentBatch.map((q) => (
          <div key={q.id}>
            <p className="mb-2 text-sm font-medium">{q.text}</p>
            {q.type === "text" ? (
              <textarea
                value={answers[q.id]?.value ?? ""}
                onChange={(e) => setText(q.id, e.target.value)}
                rows={3}
                placeholder={t("cvQuestions.textPlaceholder")}
                className="w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {(["yes", "somewhat", "no", "skip"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setYesNo(q.id, opt)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                      answers[q.id]?.value === opt
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                        : "border-[var(--color-card-border)] hover:border-[var(--color-accent)]"
                    )}
                  >
                    {t(`onboarding.${opt === "somewhat" ? "somewhat" : opt}`)}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => saveBatch(isLastBatch)}
          className="rounded-lg bg-[var(--color-accent)] px-6 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {saving
            ? t("onboarding.saving")
            : isLastBatch
              ? t("cvQuestions.finish")
              : t("cvQuestions.continue")}
        </button>
      </div>
    </div>
  );
}
