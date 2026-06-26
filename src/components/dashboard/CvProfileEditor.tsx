"use client";

import { Plus, Trash2 } from "lucide-react";
import { UserProfileSection } from "@/components/dashboard/UserProfileSection";
import { Button } from "@/components/ui/Button";
import { useT } from "@/contexts/LocaleProvider";
import {
  EMPTY_CV_EDUCATION,
  EMPTY_CV_EXPERIENCE,
} from "@/types/documents";
import type { CvProfileExtraction } from "@/types/skills";

const inputClass =
  "w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]";

interface CvProfileEditorProps {
  value: CvProfileExtraction;
  onChange: (value: CvProfileExtraction) => void;
  showProfile?: boolean;
  disabled?: boolean;
}

/**
 * Structured editor for CV profile data: summary, skills, experience and education.
 */
export function CvProfileEditor({
  value,
  onChange,
  showProfile = true,
  disabled = false,
}: CvProfileEditorProps) {
  const t = useT();

  function updateExperience(
    index: number,
    field: keyof (typeof value.experience)[number],
    fieldValue: string | string[]
  ) {
    const experience = [...value.experience];
    experience[index] = { ...experience[index], [field]: fieldValue };
    onChange({ ...value, experience });
  }

  function updateEducation(
    index: number,
    field: keyof (typeof value.education)[number],
    fieldValue: string
  ) {
    const education = [...value.education];
    education[index] = { ...education[index], [field]: fieldValue };
    onChange({ ...value, education });
  }

  return (
    <div className="space-y-5">
      {showProfile && (
        <UserProfileSection
          profile={value.profile}
          onChange={(profile) => onChange({ ...value, profile })}
        />
      )}

      <div>
        <label className="mb-1 block text-xs font-medium">
          {t("cvProfile.summary")}
        </label>
        <textarea
          rows={4}
          disabled={disabled}
          className={inputClass}
          value={value.summary}
          onChange={(e) => onChange({ ...value, summary: e.target.value })}
          placeholder={t("cvProfile.summaryPlaceholder")}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium">
          {t("cvProfile.skills")}
        </label>
        <input
          disabled={disabled}
          className={inputClass}
          value={value.skills.join(", ")}
          onChange={(e) =>
            onChange({
              ...value,
              skills: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder={t("cvProfile.skillsPlaceholder")}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold">{t("cvProfile.experience")}</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() =>
              onChange({
                ...value,
                experience: [...value.experience, { ...EMPTY_CV_EXPERIENCE }],
              })
            }
          >
            <Plus className="h-3.5 w-3.5" />
            {t("cvProfile.addExperience")}
          </Button>
        </div>
        <div className="space-y-3">
          {value.experience.map((exp, i) => (
            <div
              key={i}
              className="rounded-lg border border-[var(--color-card-border)] p-3"
            >
              <div className="mb-2 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled || value.experience.length <= 1}
                  onClick={() =>
                    onChange({
                      ...value,
                      experience: value.experience.filter((_, idx) => idx !== i),
                    })
                  }
                  aria-label={t("cvProfile.removeEntry")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  disabled={disabled}
                  className={inputClass}
                  value={exp.role}
                  placeholder={t("cvProfile.role")}
                  onChange={(e) => updateExperience(i, "role", e.target.value)}
                />
                <input
                  disabled={disabled}
                  className={inputClass}
                  value={exp.company}
                  placeholder={t("cvProfile.company")}
                  onChange={(e) => updateExperience(i, "company", e.target.value)}
                />
                <input
                  disabled={disabled}
                  className={inputClass}
                  value={exp.period}
                  placeholder={t("cvProfile.period")}
                  onChange={(e) => updateExperience(i, "period", e.target.value)}
                />
                <input
                  disabled={disabled}
                  className={inputClass}
                  value={exp.location}
                  placeholder={t("cvProfile.location")}
                  onChange={(e) => updateExperience(i, "location", e.target.value)}
                />
              </div>
              <textarea
                disabled={disabled}
                className={`${inputClass} mt-2`}
                rows={3}
                value={exp.highlights.join("\n")}
                placeholder={t("cvProfile.descriptionPlaceholder")}
                onChange={(e) =>
                  updateExperience(
                    i,
                    "highlights",
                    e.target.value.split("\n").map((l) => l.trim()).filter(Boolean)
                  )
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold">{t("cvProfile.education")}</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() =>
              onChange({
                ...value,
                education: [...value.education, { ...EMPTY_CV_EDUCATION }],
              })
            }
          >
            <Plus className="h-3.5 w-3.5" />
            {t("cvProfile.addEducation")}
          </Button>
        </div>
        <div className="space-y-3">
          {value.education.map((edu, i) => (
            <div
              key={i}
              className="rounded-lg border border-[var(--color-card-border)] p-3"
            >
              <div className="mb-2 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled || value.education.length <= 1}
                  onClick={() =>
                    onChange({
                      ...value,
                      education: value.education.filter((_, idx) => idx !== i),
                    })
                  }
                  aria-label={t("cvProfile.removeEntry")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  disabled={disabled}
                  className={inputClass}
                  value={edu.degree}
                  placeholder={t("cvProfile.degree")}
                  onChange={(e) => updateEducation(i, "degree", e.target.value)}
                />
                <input
                  disabled={disabled}
                  className={inputClass}
                  value={edu.institution}
                  placeholder={t("cvProfile.institution")}
                  onChange={(e) =>
                    updateEducation(i, "institution", e.target.value)
                  }
                />
                <input
                  disabled={disabled}
                  className={inputClass}
                  value={edu.period}
                  placeholder={t("cvProfile.period")}
                  onChange={(e) => updateEducation(i, "period", e.target.value)}
                />
                <input
                  disabled={disabled}
                  className={inputClass}
                  value={edu.location}
                  placeholder={t("cvProfile.location")}
                  onChange={(e) =>
                    updateEducation(i, "location", e.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
