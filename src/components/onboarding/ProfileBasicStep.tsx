"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CvProfileEditor } from "@/components/dashboard/CvProfileEditor";
import { normalizeCvProfileExtraction } from "@/lib/cv/normalize-extraction";
import type { CvProfileExtraction } from "@/types/skills";
import { useT } from "@/contexts/LocaleProvider";

interface ProfileBasicStepProps {
  initialExtraction: CvProfileExtraction;
  onComplete: () => void;
}

/**
 * Final onboarding step: save structured profile and mark onboarding complete.
 */
export function ProfileBasicStep({
  initialExtraction,
  onComplete,
}: ProfileBasicStepProps) {
  const t = useT();
  const [extraction, setExtraction] = useState(
    normalizeCvProfileExtraction(initialExtraction)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const settingsRes = await fetch("/api/settings/instructions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: extraction.profile,
        cv_profile_extraction: extraction,
      }),
    });

    if (!settingsRes.ok) {
      const data = (await settingsRes.json()) as { error?: string };
      setSaving(false);
      setError(data.error ?? t("defaults.saveFailed"));
      return;
    }

    const res = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(extraction.profile),
    });

    setSaving(false);

    if (res.ok) {
      onComplete();
    } else {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? t("defaults.saveFailed"));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card p-6">
      <h2 className="mb-1 text-lg font-semibold">
        {t("onboarding.profileStepTitle")}
      </h2>
      <p className="mb-4 text-sm text-[var(--color-muted)]">
        {t("onboarding.profileStepSubtitle")}
      </p>

      <CvProfileEditor value={extraction} onChange={setExtraction} disabled={saving} />

      {error && (
        <p className="mb-3 text-sm text-[var(--color-danger)]">{error}</p>
      )}

      <Button type="submit" disabled={saving} className="mt-4 w-full">
        {saving ? t("defaults.saving") : t("onboarding.profileSave")}
      </Button>
    </form>
  );
}
