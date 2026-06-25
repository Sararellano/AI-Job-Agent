"use client";

import type { CvDocument, CoverLetterDocument } from "@/types/documents";

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
  if (type === "cv") {
    const cv = data as CvDocument;
    return (
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium">Summary</label>
          <textarea
            className={inputClass}
            rows={4}
            value={cv.summary}
            onChange={(e) => onChange({ ...cv, summary: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Skills (comma-separated)</label>
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
        <div>
          <label className="mb-1 block text-xs font-medium">Education</label>
          <input
            className={inputClass}
            value={cv.education}
            onChange={(e) => onChange({ ...cv, education: e.target.value })}
          />
        </div>
        {cv.experience.map((exp, i) => (
          <div key={i} className="rounded-lg border border-[var(--color-card-border)] p-3">
            <input
              className={`${inputClass} mb-2`}
              value={exp.role}
              placeholder="Role"
              onChange={(e) => {
                const experience = [...cv.experience];
                experience[i] = { ...exp, role: e.target.value };
                onChange({ ...cv, experience });
              }}
            />
            <input
              className={`${inputClass} mb-2`}
              value={exp.company}
              placeholder="Company"
              onChange={(e) => {
                const experience = [...cv.experience];
                experience[i] = { ...exp, company: e.target.value };
                onChange({ ...cv, experience });
              }}
            />
            <input
              className={`${inputClass} mb-2`}
              value={exp.period}
              placeholder="Period"
              onChange={(e) => {
                const experience = [...cv.experience];
                experience[i] = { ...exp, period: e.target.value };
                onChange({ ...cv, experience });
              }}
            />
            <textarea
              className={inputClass}
              rows={3}
              value={exp.highlights.join("\n")}
              placeholder="Highlights (one per line)"
              onChange={(e) => {
                const experience = [...cv.experience];
                experience[i] = {
                  ...exp,
                  highlights: e.target.value.split("\n").filter(Boolean),
                };
                onChange({ ...cv, experience });
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
