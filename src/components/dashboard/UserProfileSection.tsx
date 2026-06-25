"use client";

import type { UserProfile } from "@/types/documents";
import { useT } from "@/contexts/LocaleProvider";

interface UserProfileSectionProps {
  profile: UserProfile;
  onChange: (profile: UserProfile) => void;
}

const inputClass =
  "w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]";

/**
 * Shared profile fields used across all generated CVs and cover letters.
 */
export function UserProfileSection({ profile, onChange }: UserProfileSectionProps) {
  const t = useT();

  function update(field: keyof UserProfile, value: string) {
    onChange({ ...profile, [field]: value });
  }

  return (
    <div className="mb-6 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-background)] p-5">
      <h3 className="mb-1 text-sm font-semibold">{t("profile.sharedTitle")}</h3>
      <p className="mb-4 text-xs text-[var(--color-muted)]">
        {t("profile.sharedSubtitle")}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium">{t("profile.fullName")}</label>
          <input
            className={inputClass}
            value={profile.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">{t("profile.targetRole")}</label>
          <input
            className={inputClass}
            value={profile.targetRole}
            onChange={(e) => update("targetRole", e.target.value)}
            placeholder="Frontend Developer"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">{t("profile.email")}</label>
          <input
            type="email"
            className={inputClass}
            value={profile.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="jane@email.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">{t("profile.mobile")}</label>
          <input
            className={inputClass}
            value={profile.mobile}
            onChange={(e) => update("mobile", e.target.value)}
            placeholder="+34 600 000 000"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">{t("profile.languages")}</label>
          <input
            className={inputClass}
            value={profile.languages}
            onChange={(e) => update("languages", e.target.value)}
            placeholder="Spanish (native), English (C1)"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">{t("profile.location")}</label>
          <input
            className={inputClass}
            value={profile.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="Madrid, Spain — Remote EU"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">{t("profile.salaryRange")}</label>
          <input
            className={inputClass}
            value={profile.salaryRange}
            onChange={(e) => update("salaryRange", e.target.value)}
            placeholder={t("profile.salaryRangePlaceholder")}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">{t("profile.linkedin")}</label>
          <input
            className={inputClass}
            value={profile.linkedinUrl}
            onChange={(e) => update("linkedinUrl", e.target.value)}
            placeholder="https://linkedin.com/in/..."
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">{t("profile.github")}</label>
          <input
            className={inputClass}
            value={profile.githubUrl}
            onChange={(e) => update("githubUrl", e.target.value)}
            placeholder="https://github.com/username"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">{t("profile.extraLink")}</label>
          <input
            className={inputClass}
            value={profile.extraLink}
            onChange={(e) => update("extraLink", e.target.value)}
            placeholder="https://… (Behance, Medium, etc.)"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium">{t("profile.website")}</label>
          <input
            className={inputClass}
            value={profile.website}
            onChange={(e) => update("website", e.target.value)}
            placeholder="https://yourportfolio.com"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium">{t("profile.additionalInfo")}</label>
          <textarea
            rows={3}
            className={inputClass}
            value={profile.additionalInfo}
            onChange={(e) => update("additionalInfo", e.target.value)}
            placeholder={t("profile.additionalInfoPlaceholder")}
          />
        </div>
      </div>
    </div>
  );
}
