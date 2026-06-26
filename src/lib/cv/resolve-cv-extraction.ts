import { buildHeuristicExtraction } from "@/lib/cv/build-profile-from-parsed";
import { normalizeCvProfileExtraction } from "@/lib/cv/normalize-extraction";
import type { UserDocumentSettings } from "@/types/database";
import type { AiCvAnalysis, CvProfileExtraction, ParsedCvLocal } from "@/types/skills";

function hasExtractionData(extraction: CvProfileExtraction): boolean {
  return (
    extraction.summary.length > 0 ||
    extraction.skills.length > 0 ||
    extraction.experience.some((e) => e.role || e.company) ||
    extraction.education.some((e) => e.degree || e.institution)
  );
}

/**
 * Resolves structured CV data for document generation from stored settings.
 */
export function resolveCvExtraction(
  settings: Partial<UserDocumentSettings> | null | undefined
): CvProfileExtraction | null {
  if (!settings) return null;

  const stored = normalizeCvProfileExtraction(
    settings.cv_profile_extraction as CvProfileExtraction | null
  );
  if (hasExtractionData(stored)) {
    return stored;
  }

  const ai = settings.ai_cv_analysis as AiCvAnalysis | null;
  if (ai?.profileExtraction) {
    const ext = normalizeCvProfileExtraction(ai.profileExtraction);
    if (hasExtractionData(ext)) {
      return ext;
    }
  }

  if (settings.cv_parsed_raw && settings.cv_parsed_structured) {
    const parsed = settings.cv_parsed_structured as unknown as ParsedCvLocal;
    const heuristic = buildHeuristicExtraction(settings.cv_parsed_raw, parsed);
    if (hasExtractionData(heuristic)) {
      return heuristic;
    }
  }

  return null;
}

/**
 * Merges default extraction with per-application overrides (application wins when non-empty).
 */
export function mergeCvExtractions(
  base: CvProfileExtraction | null,
  override: CvProfileExtraction | null | undefined
): CvProfileExtraction | null {
  if (!base && !override) return null;
  if (!override) return base;
  if (!base) return normalizeCvProfileExtraction(override);

  const normalizedOverride = normalizeCvProfileExtraction(override);
  const profile = { ...base.profile };
  for (const key of Object.keys(profile) as (keyof typeof profile)[]) {
    const overrideVal = normalizedOverride.profile[key]?.trim();
    if (overrideVal) profile[key] = overrideVal;
  }

  return normalizeCvProfileExtraction({
    profile,
    summary: normalizedOverride.summary || base.summary,
    skills:
      normalizedOverride.skills.length > 0
        ? normalizedOverride.skills
        : base.skills,
    experience:
      normalizedOverride.experience.some((e) => e.role || e.company)
        ? normalizedOverride.experience
        : base.experience,
    education:
      normalizedOverride.education.some((e) => e.degree || e.institution)
        ? normalizedOverride.education
        : base.education,
  });
}
