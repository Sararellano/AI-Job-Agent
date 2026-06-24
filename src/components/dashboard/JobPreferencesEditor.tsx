"use client";

import { useState } from "react";
import { useT } from "@/contexts/LocaleProvider";
import { cn } from "@/lib/utils";
import {
  type JobPreferences,
  type WorkMode,
  type SeniorityLevel,
} from "@/types/job-preferences";
import type { CareerTrack } from "@/types/skills";

interface JobPreferencesEditorProps {
  initial: JobPreferences;
  onSaved: (prefs: JobPreferences) => void;
}

const TRACKS: { value: CareerTrack; label: string }[] = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "fullstack", label: "Full Stack" },
  { value: "devops", label: "DevOps / SRE" },
  { value: "mobile", label: "Mobile" },
  { value: "data", label: "Data / ML" },
  { value: "general", label: "General" },
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
 * Inline editor for job search preferences, accessible from the dashboard.
 */
export function JobPreferencesEditor({ initial, onSaved }: JobPreferencesEditorProps) {
  const t = useT();
  const [prefs, setPrefs] = useState(initial);
  const [rolesInput, setRolesInput] = useState(initial.targetRoles.join(", "));
  const [excludedInput, setExcludedInput] = useState(initial.excludedKeywords.join(", "));
  const [locationsInput, setLocationsInput] = useState(initial.preferredLocations.join(", "));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

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

  async function handleSave() {
    setSaving(true);
    setStatus("idle");

    const finalPrefs: JobPreferences = {
      ...prefs,
      targetRoles: splitCSV(rolesInput, 100),
      excludedKeywords: splitCSV(excludedInput, 60),
      preferredLocations: splitCSV(locationsInput, 80),
    };

    const res = await fetch("/api/onboarding/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalPrefs),
    });

    setSaving(false);
    if (res.ok) {
      setStatus("saved");
      onSaved(finalPrefs);
      setTimeout(() => setStatus("idle"), 3000);
    } else {
      setStatus("error");
    }
  }

  return (
    <div className="space-y-4">
      {/* Target roles */}
      <div>
        <label className="mb-1 block text-xs font-medium">{t("prefs.targetRoles")}</label>
        <input
          className={inputClass}
          value={rolesInput}
          onChange={(e) => setRolesInput(e.target.value)}
          placeholder={t("prefs.targetRolesPlaceholder")}
        />
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

      {/* Work mode + Seniority in a row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-medium">{t("prefs.workMode")}</label>
          <div className="flex flex-wrap gap-1.5">
            {WORK_MODES.map(({ value, labelKey }) => (
              <button
                key={value}
                type="button"
                onClick={() => update("workMode", value)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
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
        <div>
          <label className="mb-2 block text-xs font-medium">{t("prefs.seniority")}</label>
          <div className="flex flex-wrap gap-1.5">
            {SENIORITY_LEVELS.map(({ value, labelKey }) => (
              <button
                key={value}
                type="button"
                onClick={() => update("seniority", value)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
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
      </div>

      {/* Product / design toggles */}
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

      {/* Locations + Excluded */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium">{t("prefs.locations")}</label>
          <input
            className={inputClass}
            value={locationsInput}
            onChange={(e) => setLocationsInput(e.target.value)}
            placeholder={t("prefs.locationsPlaceholder")}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">{t("prefs.excluded")}</label>
          <input
            className={inputClass}
            value={excludedInput}
            onChange={(e) => setExcludedInput(e.target.value)}
            placeholder={t("prefs.excludedPlaceholder")}
          />
        </div>
      </div>

      {/* Min score slider */}
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

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
        >
          {saving ? t("prefs.saving") : t("prefs.saveChanges")}
        </button>
        {status === "saved" && (
          <span className="text-xs text-[var(--color-success)]">{t("prefs.saved")}</span>
        )}
        {status === "error" && (
          <span className="text-xs text-[var(--color-danger)]">{t("prefs.failed")}</span>
        )}
      </div>
    </div>
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
