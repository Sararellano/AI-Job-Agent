"use client";

import { useMemo } from "react";
import { useT } from "@/contexts/LocaleProvider";
import { cn } from "@/lib/utils";
import type { JobSource } from "@/types/database";
import {
  collectJobSources,
  countJobsBySource,
  getJobSourceLabelKey,
} from "@/lib/jobs/job-sources";

interface JobSourceFilterProps {
  jobs: { source: string | null }[];
  selectedSources: ReadonlySet<JobSource>;
  onChange: (sources: Set<JobSource>) => void;
}

/**
 * Checkbox filter to show job offers from specific platforms only.
 */
export function JobSourceFilter({
  jobs,
  selectedSources,
  onChange,
}: JobSourceFilterProps) {
  const t = useT();

  const availableSources = useMemo(() => collectJobSources(jobs), [jobs]);
  const counts = useMemo(() => countJobsBySource(jobs), [jobs]);

  if (availableSources.length === 0) {
    return null;
  }

  function toggleSource(source: JobSource) {
    const next = new Set(selectedSources);
    if (next.has(source)) {
      next.delete(source);
    } else {
      next.add(source);
    }
    onChange(next);
  }

  function selectAll() {
    onChange(new Set(availableSources));
  }

  function clearAll() {
    onChange(new Set());
  }

  const allSelected =
    availableSources.length > 0 &&
    availableSources.every((source) => selectedSources.has(source));

  return (
    <div className="mb-4 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{t("dashboard.sourceFilterTitle")}</p>
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={selectAll}
            disabled={allSelected}
            className="text-[var(--color-accent)] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("dashboard.sourceFilterSelectAll")}
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={selectedSources.size === 0}
            className="text-[var(--color-muted)] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("dashboard.sourceFilterClearAll")}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {availableSources.map((source) => {
          const checked = selectedSources.has(source);
          const count = counts.get(source) ?? 0;
          const inputId = `job-source-${source}`;

          return (
            <label
              key={source}
              htmlFor={inputId}
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                checked
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                  : "border-[var(--color-card-border)] bg-[var(--color-background)] opacity-70"
              )}
            >
              <input
                id={inputId}
                type="checkbox"
                checked={checked}
                onChange={() => toggleSource(source)}
                className="h-3.5 w-3.5 accent-[var(--color-accent)]"
              />
              <span>{t(getJobSourceLabelKey(source))}</span>
              <span className="text-xs text-[var(--color-muted)]">({count})</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
