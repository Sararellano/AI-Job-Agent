import type {
  CvDocument,
  CvEducation,
  CvExperience,
} from "@/types/documents";
import {
  EMPTY_CV_EDUCATION,
  EMPTY_CV_EXPERIENCE,
  EMPTY_PROFILE,
} from "@/types/documents";
import type { CvProfileExtraction } from "@/types/skills";

function normalizeExperience(exp: Partial<CvExperience>): CvExperience {
  return {
    role: exp.role?.trim() ?? "",
    company: exp.company?.trim() ?? "",
    period: exp.period?.trim() ?? "",
    location: exp.location?.trim() ?? "",
    highlights: Array.isArray(exp.highlights)
      ? exp.highlights.map((h) => h.trim()).filter(Boolean)
      : [],
  };
}

function normalizeEducation(edu: Partial<CvEducation>): CvEducation {
  return {
    degree: edu.degree?.trim() ?? "",
    institution: edu.institution?.trim() ?? "",
    period: edu.period?.trim() ?? "",
    location: edu.location?.trim() ?? "",
  };
}

function educationFromLegacyString(value: string): CvEducation[] {
  const trimmed = value.trim();
  if (!trimmed) return [EMPTY_CV_EDUCATION];

  const lines = trimmed
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [EMPTY_CV_EDUCATION];

  return lines.map((line) => {
    const parts = line.split(/\s*[—–|]\s*/);
    return normalizeEducation({
      degree: parts[0] ?? "",
      institution: parts[1] ?? "",
      period: parts[2] ?? "",
      location: parts[3] ?? "",
    });
  });
}

function normalizeEducationField(
  education: CvEducation[] | string | null | undefined
): CvEducation[] {
  if (Array.isArray(education)) {
    const normalized = education.map((e) => normalizeEducation(e));
    return normalized.length > 0 ? normalized : [EMPTY_CV_EDUCATION];
  }
  if (typeof education === "string") {
    return educationFromLegacyString(education);
  }
  return [EMPTY_CV_EDUCATION];
}

/**
 * Normalizes stored or legacy CV extraction payloads into the current shape.
 */
export function normalizeCvProfileExtraction(
  raw: Partial<CvProfileExtraction> | Record<string, unknown> | null | undefined
): CvProfileExtraction {
  if (!raw) {
    return {
      profile: { ...EMPTY_PROFILE },
      summary: "",
      experience: [EMPTY_CV_EXPERIENCE],
      education: [EMPTY_CV_EDUCATION],
      skills: [],
    };
  }

  const profileRaw = (raw.profile ?? {}) as Record<string, string | undefined>;
  const profile = { ...EMPTY_PROFILE };
  for (const key of Object.keys(EMPTY_PROFILE) as (keyof typeof EMPTY_PROFILE)[]) {
    profile[key] = profileRaw[key]?.trim() ?? profile[key];
  }

  const experienceRaw = raw.experience as Partial<CvExperience>[] | undefined;
  const experience =
    Array.isArray(experienceRaw) && experienceRaw.length > 0
      ? experienceRaw.map((e) => normalizeExperience(e))
      : [EMPTY_CV_EXPERIENCE];

  const education = normalizeEducationField(
    raw.education as CvEducation[] | string | undefined
  );

  const skills = Array.isArray(raw.skills)
    ? (raw.skills as unknown[])
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .filter(Boolean)
    : [];

  return {
    profile,
    summary: typeof raw.summary === "string" ? raw.summary.trim() : "",
    experience,
    education,
    skills,
  };
}

/**
 * Normalizes parsed CV document content, including legacy education string.
 */
export function normalizeCvDocument(doc: Partial<CvDocument>): CvDocument {
  const education = normalizeEducationField(
    doc.education as CvEducation[] | string | undefined
  );

  const experience =
    Array.isArray(doc.experience) && doc.experience.length > 0
      ? doc.experience.map((e) => normalizeExperience(e))
      : [];

  return {
    version: 1,
    templateId: doc.templateId ?? "cv-ats",
    summary: doc.summary?.trim() ?? "",
    experience,
    skills: Array.isArray(doc.skills)
      ? doc.skills.map((s) => s.trim()).filter(Boolean)
      : [],
    education,
    jobHighlights: Array.isArray(doc.jobHighlights)
      ? doc.jobHighlights.map((h) => h.trim()).filter(Boolean)
      : [],
  };
}
