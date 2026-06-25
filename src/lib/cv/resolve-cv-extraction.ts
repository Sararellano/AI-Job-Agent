import { buildHeuristicExtraction } from "@/lib/cv/build-profile-from-parsed";
import type { UserDocumentSettings } from "@/types/database";
import type { AiCvAnalysis, CvProfileExtraction, ParsedCvLocal } from "@/types/skills";

/**
 * Resolves structured CV data for document generation from stored settings.
 */
export function resolveCvExtraction(
  settings: Partial<UserDocumentSettings> | null | undefined
): CvProfileExtraction | null {
  if (!settings) return null;

  const stored = settings.cv_profile_extraction as CvProfileExtraction | null;
  if (stored?.experience?.length || stored?.summary || stored?.education) {
    return stored;
  }

  const ai = settings.ai_cv_analysis as AiCvAnalysis | null;
  if (ai?.profileExtraction) {
    const ext = ai.profileExtraction;
    if (ext.experience.length > 0 || ext.summary || ext.education) {
      return ext;
    }
  }

  if (settings.cv_parsed_raw && settings.cv_parsed_structured) {
    const parsed = settings.cv_parsed_structured as unknown as ParsedCvLocal;
    const heuristic = buildHeuristicExtraction(settings.cv_parsed_raw, parsed);
    if (
      heuristic.experience.length > 0 ||
      heuristic.summary ||
      heuristic.education
    ) {
      return heuristic;
    }
  }

  return null;
}
