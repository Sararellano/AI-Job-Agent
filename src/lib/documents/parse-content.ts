import type { CvDocument, CoverLetterDocument } from "@/types/documents";
import {
  DEFAULT_CV_TEMPLATE as CV_DEFAULT,
  DEFAULT_COVER_TEMPLATE as CL_DEFAULT,
} from "@/types/documents";
import { normalizeCvDocument } from "@/lib/cv/normalize-extraction";

export function parseCvContent(raw: string | null): CvDocument | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CvDocument;
    if (parsed.version === 1 && parsed.templateId) {
      return normalizeCvDocument({ ...parsed, templateId: CV_DEFAULT });
    }
  } catch {
    // legacy markdown fallback
  }
  return normalizeCvDocument({
    version: 1,
    templateId: CV_DEFAULT,
    summary: raw.slice(0, 500),
    experience: [],
    skills: [],
    education: [],
    jobHighlights: [],
  });
}

export function parseCoverLetterContent(raw: string | null): CoverLetterDocument | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CoverLetterDocument;
    if (parsed.version === 1 && parsed.templateId) return parsed;
  } catch {
    // legacy fallback
  }
  return {
    version: 1,
    templateId: CL_DEFAULT,
    date: new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    greeting: "Dear Hiring Manager,",
    paragraphs: [raw],
    closing: "Sincerely,",
  };
}

export function serializeCvContent(doc: CvDocument): string {
  return JSON.stringify(normalizeCvDocument(doc));
}

export function serializeCoverLetterContent(doc: CoverLetterDocument): string {
  return JSON.stringify(doc);
}
