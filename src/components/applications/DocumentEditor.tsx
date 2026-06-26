"use client";

import { Plus, Trash2 } from "lucide-react";
import type { CvDocument, CoverLetterDocument } from "@/types/documents";
import {
  EMPTY_CV_EDUCATION,
  EMPTY_CV_EXPERIENCE,
} from "@/types/documents";
import { Button } from "@/components/ui/Button";
import { useT } from "@/contexts/LocaleProvider";

const inputClass =
  "w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]";

interface DocumentEditorProps {
  type: "cv" | "cover_letter";
  data: CvDocument | CoverLetterDocument;
  onChange: (data: CvDocument | CoverLetterDocument) => void;
}

/**
 * Inline editor for structured CV and cover letter documents.
 */
export function DocumentEditor({ type, data, onChange }: DocumentEditorProps) {
  const t = useT();

  if (type === "cv") {
    const cv = data as CvDocument;
    return (
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium">{t("cvProfile.summary")}</label>
          <textarea
            className={inputClass}
            rows={4}
            value={cv.summary}
            onChange={(e) => onChange({ ...cv, summary: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">{t("cvProfile.skills")}</label>
          <input
            className={inputClass}
            value={cv.skills.join(", ")}
            onChange={(e) =>
              onChange({
                ...cv,
                skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">{t("cvProfile.experience")}</label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange({
                ...cv,
                experience: [...cv.experience, { ...EMPTY_CV_EXPERIENCE }],
              })
            }
          >
            <Plus className="h-3.5 w-3.5" />
            {t("cvProfile.addExperience")}
          </Button>
        </div>
        {cv.experience.map((exp, i) => (
          <div key={i} className="rounded-lg border border-[var(--color-card-border)] p-3">
            <div className="mb-2 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={cv.experience.length <= 1}
                onClick={() =>
                  onChange({
                    ...cv,
                    experience: cv.experience.filter((_, idx) => idx !== i),
                  })
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <input
              className={`${inputClass} mb-2`}
              value={exp.role}
              placeholder={t("cvProfile.role")}
              onChange={(e) => {
                const experience = [...cv.experience];
                experience[i] = { ...exp, role: e.target.value };
                onChange({ ...cv, experience });
              }}
            />
            <input
              className={`${inputClass} mb-2`}
              value={exp.company}
              placeholder={t("cvProfile.company")}
              onChange={(e) => {
                const experience = [...cv.experience];
                experience[i] = { ...exp, company: e.target.value };
                onChange({ ...cv, experience });
              }}
            />
            <input
              className={`${inputClass} mb-2`}
              value={exp.period}
              placeholder={t("cvProfile.period")}
              onChange={(e) => {
                const experience = [...cv.experience];
                experience[i] = { ...exp, period: e.target.value };
                onChange({ ...cv, experience });
              }}
            />
            <input
              className={`${inputClass} mb-2`}
              value={exp.location}
              placeholder={t("cvProfile.location")}
              onChange={(e) => {
                const experience = [...cv.experience];
                experience[i] = { ...exp, location: e.target.value };
                onChange({ ...cv, experience });
              }}
            />
            <textarea
              className={inputClass}
              rows={3}
              value={exp.highlights.join("\n")}
              placeholder={t("cvProfile.descriptionPlaceholder")}
              onChange={(e) => {
                const experience = [...cv.experience];
                experience[i] = {
                  ...exp,
                  highlights: e.target.value.split("\n").map((l) => l.trim()).filter(Boolean),
                };
                onChange({ ...cv, experience });
              }}
            />
          </div>
        ))}

        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">{t("cvProfile.education")}</label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange({
                ...cv,
                education: [...cv.education, { ...EMPTY_CV_EDUCATION }],
              })
            }
          >
            <Plus className="h-3.5 w-3.5" />
            {t("cvProfile.addEducation")}
          </Button>
        </div>
        {cv.education.map((edu, i) => (
          <div key={i} className="rounded-lg border border-[var(--color-card-border)] p-3">
            <div className="mb-2 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={cv.education.length <= 1}
                onClick={() =>
                  onChange({
                    ...cv,
                    education: cv.education.filter((_, idx) => idx !== i),
                  })
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <input
              className={`${inputClass} mb-2`}
              value={edu.degree}
              placeholder={t("cvProfile.degree")}
              onChange={(e) => {
                const education = [...cv.education];
                education[i] = { ...edu, degree: e.target.value };
                onChange({ ...cv, education });
              }}
            />
            <input
              className={`${inputClass} mb-2`}
              value={edu.institution}
              placeholder={t("cvProfile.institution")}
              onChange={(e) => {
                const education = [...cv.education];
                education[i] = { ...edu, institution: e.target.value };
                onChange({ ...cv, education });
              }}
            />
            <input
              className={`${inputClass} mb-2`}
              value={edu.period}
              placeholder={t("cvProfile.period")}
              onChange={(e) => {
                const education = [...cv.education];
                education[i] = { ...edu, period: e.target.value };
                onChange({ ...cv, education });
              }}
            />
            <input
              className={inputClass}
              value={edu.location}
              placeholder={t("cvProfile.location")}
              onChange={(e) => {
                const education = [...cv.education];
                education[i] = { ...edu, location: e.target.value };
                onChange({ ...cv, education });
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  const cl = data as CoverLetterDocument;
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium">Greeting</label>
        <input
          className={inputClass}
          value={cl.greeting}
          onChange={(e) => onChange({ ...cl, greeting: e.target.value })}
        />
      </div>
      {cl.paragraphs.map((p, i) => (
        <div key={i}>
          <label className="mb-1 block text-xs font-medium">Paragraph {i + 1}</label>
          <textarea
            className={inputClass}
            rows={4}
            value={p}
            onChange={(e) => {
              const paragraphs = [...cl.paragraphs];
              paragraphs[i] = e.target.value;
              onChange({ ...cl, paragraphs });
            }}
          />
        </div>
      ))}
      <div>
        <label className="mb-1 block text-xs font-medium">Closing</label>
        <input
          className={inputClass}
          value={cl.closing}
          onChange={(e) => onChange({ ...cl, closing: e.target.value })}
        />
      </div>
    </div>
  );
}
