"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/contexts/LocaleProvider";
import { inputClassName, textareaClassName } from "@/lib/ui/input-styles";
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
      <div className="surface-card p-6 text-center">
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          {t("onboarding.noQuestions")}
        </p>
        <Button type="button" onClick={() => onComplete()}>
          {t("cvQuestions.finish")}
        </Button>
      </div>
    );
  }

  return (
    <div className="surface-card p-6">
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
                className={textareaClassName}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {(["yes", "somewhat", "no", "skip"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setYesNo(q.id, opt)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:-translate-y-px active:scale-[0.98]",
                      answers[q.id]?.value === opt
                        ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,white)] text-[var(--color-accent)] shadow-sm"
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
        <Button type="button" disabled={saving} onClick={() => saveBatch(isLastBatch)}>
          {saving
            ? t("onboarding.saving")
            : isLastBatch
              ? t("cvQuestions.finish")
              : t("cvQuestions.continue")}
        </Button>
      </div>
    </div>
  );
}
