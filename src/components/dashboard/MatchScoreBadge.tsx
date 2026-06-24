"use client";

import { useState } from "react";
import { useT } from "@/contexts/LocaleProvider";
import { cn } from "@/lib/utils";

interface MatchScoreBadgeProps {
  score: number;
  matchedKeywords: string[];
  reasons: string[];
}

/**
 * Compact badge showing a job's relevance score.
 * Tapping it reveals matched keywords and reasons.
 */
export function MatchScoreBadge({ score, matchedKeywords, reasons }: MatchScoreBadgeProps) {
  const t = useT();
  const [open, setOpen] = useState(false);

  const color =
    score >= 70
      ? "bg-green-500/20 text-green-400 border-green-500/30"
      : score >= 45
        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
        : "bg-slate-500/20 text-slate-400 border-slate-500/30";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Match score: ${score}%`}
        className={cn(
          "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80",
          color
        )}
      >
        {t("dashboard.matchBadge", { score: String(score) })}
      </button>

      {open && (matchedKeywords.length > 0 || reasons.length > 0) && (
        <div className="absolute left-0 top-7 z-10 min-w-[200px] max-w-xs rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-3 shadow-lg">
          {matchedKeywords.length > 0 && (
            <p className="mb-1.5 text-xs text-[var(--color-muted)]">
              {t("dashboard.matchHint", { keywords: matchedKeywords.slice(0, 5).join(", ") })}
            </p>
          )}
          {reasons.length > 0 && (
            <ul className="space-y-0.5">
              {reasons.slice(0, 5).map((reason, i) => (
                <li key={i} className="text-xs text-[var(--color-muted)]">
                  · {reason}
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 text-xs text-[var(--color-accent)] hover:underline"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
