"use client";

import { useEffect, useState } from "react";
import { useT } from "@/contexts/LocaleProvider";
import { cn } from "@/lib/utils";
import {
  DEFAULT_JOB_PREFERENCES,
  type JobPreferences,
  type WorkMode,
  type SeniorityLevel,
} from "@/types/job-preferences";
import type { CareerTrack } from "@/types/skills";

interface JobPreferencesStepProps {
  onComplete: (preferences: JobPreferences) => void;
}

const TRACKS: { value: CareerTrack; label: string }[] = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "fullstack", label: "Full Stack" },
  { value: "devops", label: "DevOps / SRE" },
  { value: "mobile", label: "Mobile" },
  { value: "data", label: "Data / ML" },
  { value: "general", label: "General / Other" },
];

const WORK_MODES: { value: WorkMode; labelKey: string }[] = [
  { value: "remote", labelKey: "prefs.modeRemote" },
  { value: "hybrid", labelKey: "prefs.modeHybrid" },
  { value: "onsite", labelKey: "prefs.modeOnsite" },
  { value: "any", labelKey: "prefs.modeAny" },
];

const SENIORITY_LEVELS: { value: SeniorityLevel; labelKey: string }[] = [
  { value: "junior", labelKey: "prefs.senJunior" },
  { value: "mid", labelKey: "prefs.senMid" },
  { value: "senior", labelKey: "prefs.senSenior" },
  { value: "lead", labelKey: "prefs.senLead" },
  { value: "any", labelKey: "prefs.senAny" },
];

const inputClass =
  "w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]";

/**
 * Step 4 of onboarding: captures job search preferences.
 * Pre-fills from server-inferred defaults; user can override all fields.
 */
export function JobPreferencesStep({ onComplete }: JobPreferencesStepProps) {
  const t = useT();
  const [prefs, setPrefs] = useState<JobPreferences>(DEFAULT_JOB_PREFERENCES);
  const [suggestedRoles, setSuggestedRoles] = useState<string[]>([]);
  const [rolesInput, setRolesInput] = useState("");
  const [excludedInput, setExcludedInput] = useState("");
  const [locationsInput, setLocationsInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/onboarding/preferences")
      .then((r) => r.json())
      .then(
        (data: { preferences: JobPreferences; suggestedRoles: string[] }) => {
          setPrefs(data.preferences);
          setSuggestedRoles(data.suggestedRoles ?? []);
          setRolesInput(data.preferences.targetRoles.join(", "));
          setExcludedInput(data.preferences.excludedKeywords.join(", "));
          setLocationsInput(data.preferences.preferredLocations.join(", "));
          setLoading(false);
        }
      )
      .catch(() => setLoading(false));
  }, []);

  function update<K extends keyof JobPreferences>(key: K, value: JobPreferences[K]) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }

  function toggleTrack(track: CareerTrack) {
    setPrefs((prev) => ({
      ...prev,
      tracks: prev.tracks.includes(track)
        ? prev.tracks.filter((t) => t !== track)
        : [...prev.tracks, track],
    }));
  }

  function applySuggested(role: string) {
    const current = rolesInput
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    if (!current.includes(role)) {
      const next = [...current, role].join(", ");
      setRolesInput(next);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const finalPrefs: JobPreferences = {
      ...prefs,
      targetRoles: splitCSV(rolesInput, 100),
      excludedKeywords: splitCSV(excludedInput, 60),
      preferredLocations: splitCSV(locationsInput, 80),
    };

    await fetch("/api/onboarding/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalPrefs),
    });

    setSaving(false);
    onComplete(finalPrefs);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-8 text-center text-sm text-[var(--color-muted)]">
        {t("prefs.loading")}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-6 space-y-5"
    >
      <div>
        <h2 className="text-lg font-semibold">{t("prefs.step4Title")}</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{t("prefs.step4Subtitle")}</p>
      </div>

      {/* Target roles */}
      <div>
        <label className="mb-1 block text-xs font-medium">{t("prefs.targetRoles")}</label>
        <input
          className={inputClass}
          value={rolesInput}
          onChange={(e) => setRolesInput(e.target.value)}
          placeholder={t("prefs.targetRolesPlaceholder")}
        />
        {suggestedRoles.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {suggestedRoles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => applySuggested(role)}
                className="rounded-full border border-[var(--color-card-border)] px-2.5 py-0.5 text-xs hover:border-[var(--color-accent)]"
              >
                + {role}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tracks */}
      <div>
        <label className="mb-2 block text-xs font-medium">{t("prefs.tracks")}</label>
        <div className="flex flex-wrap gap-2">
          {TRACKS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleTrack(value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                prefs.tracks.includes(value)
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
                  : "border-[var(--color-card-border)] hover:border-[var(--color-accent)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Work mode */}
      <div>
        <label className="mb-2 block text-xs font-medium">{t("prefs.workMode")}</label>
        <div className="flex flex-wrap gap-2">
          {WORK_MODES.map(({ value, labelKey }) => (
            <button
              key={value}
              type="button"
              onClick={() => update("workMode", value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                prefs.workMode === value
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
                  : "border-[var(--color-card-border)] hover:border-[var(--color-accent)]"
              )}
            >
              {t(labelKey as Parameters<typeof t>[0])}
            </button>
          ))}
        </div>
      </div>

      {/* Seniority */}
      <div>
        <label className="mb-2 block text-xs font-medium">{t("prefs.seniority")}</label>
        <div className="flex flex-wrap gap-2">
          {SENIORITY_LEVELS.map(({ value, labelKey }) => (
            <button
              key={value}
              type="button"
              onClick={() => update("seniority", value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                prefs.seniority === value
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
                  : "border-[var(--color-card-border)] hover:border-[var(--color-accent)]"
              )}
            >
              {t(labelKey as Parameters<typeof t>[0])}
            </button>
          ))}
        </div>
      </div>

      {/* Product / design roles */}
      <div className="flex flex-wrap gap-4">
        <Toggle
          checked={prefs.includeProductRoles}
          onChange={(v) => update("includeProductRoles", v)}
          label={t("prefs.includeProduct")}
        />
        <Toggle
          checked={prefs.includeDesignRoles}
          onChange={(v) => update("includeDesignRoles", v)}
          label={t("prefs.includeDesign")}
        />
      </div>

      {/* Locations */}
      <div>
        <label className="mb-1 block text-xs font-medium">{t("prefs.locations")}</label>
        <input
          className={inputClass}
          value={locationsInput}
          onChange={(e) => setLocationsInput(e.target.value)}
          placeholder={t("prefs.locationsPlaceholder")}
        />
      </div>

      {/* Excluded keywords */}
      <div>
        <label className="mb-1 block text-xs font-medium">{t("prefs.excluded")}</label>
        <input
          className={inputClass}
          value={excludedInput}
          onChange={(e) => setExcludedInput(e.target.value)}
          placeholder={t("prefs.excludedPlaceholder")}
        />
      </div>

      {/* Min score */}
      <div>
        <label className="mb-1 block text-xs font-medium">
          {t("prefs.minScore")} — {prefs.minMatchScore}%
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={prefs.minMatchScore}
          onChange={(e) => update("minMatchScore", Number(e.target.value))}
          className="w-full accent-[var(--color-accent)]"
        />
        <div className="mt-0.5 flex justify-between text-xs text-[var(--color-muted)]">
          <span>{t("prefs.minScoreLow")}</span>
          <span>{t("prefs.minScoreHigh")}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
      >
        {saving ? t("prefs.saving") : t("prefs.finish")}
      </button>
    </form>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm select-none">
      <span
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-block h-5 w-9 rounded-full transition-colors",
          checked ? "bg-[var(--color-accent)]" : "bg-[var(--color-card-border)]"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </span>
      {label}
    </label>
  );
}

function splitCSV(value: string, maxLength: number): string[] {
  return value
    .split(",")
    .map((s) => s.trim().slice(0, maxLength))
    .filter((s) => s.length > 0);
}
