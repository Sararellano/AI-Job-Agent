"use client";

import { useState } from "react";
import type { UserProfile } from "@/types/documents";
import { UserProfileSection } from "@/components/dashboard/UserProfileSection";
import { useT } from "@/contexts/LocaleProvider";

interface ProfileBasicStepProps {
  initialProfile: UserProfile;
  onComplete: () => void;
}

/**
 * Final onboarding step: save basic profile and mark onboarding complete.
 */
export function ProfileBasicStep({
  initialProfile,
  onComplete,
}: ProfileBasicStepProps) {
  const t = useT();
  const [profile, setProfile] = useState(initialProfile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
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
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-6"
    >
      <h2 className="mb-1 text-lg font-semibold">
        {t("onboarding.profileStepTitle")}
      </h2>
      <p className="mb-4 text-sm text-[var(--color-muted)]">
        {t("onboarding.profileStepSubtitle")}
      </p>

      <UserProfileSection profile={profile} onChange={setProfile} />

      {error && (
        <p className="mb-3 text-sm text-[var(--color-danger)]">{error}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-[var(--color-accent)] px-6 py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {saving ? t("defaults.saving") : t("onboarding.profileSave")}
      </button>
    </form>
  );
}
