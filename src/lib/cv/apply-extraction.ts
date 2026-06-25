import type { SupabaseClient } from "@supabase/supabase-js";
import { analyzeCvWithAi } from "@/lib/ai/parse-cv-ai";
import {
  buildHeuristicExtraction,
  buildInstructionsFromExtraction,
  mergeExtractedProfile,
} from "@/lib/cv/build-profile-from-parsed";
import { profileToDbFields } from "@/lib/documents/profile";
import { settingsToProfile } from "@/lib/documents/profile";
import type { UserProfile } from "@/types/documents";
import type {
  AiCvAnalysis,
  CvProfileExtraction,
  ParsedCvLocal,
  SkillEvidence,
} from "@/types/skills";
import { buildSkillProfileFromCv } from "@/lib/skills/question-engine";
import { mergeAiIntoParsedSignals } from "@/lib/ai/parse-cv-ai";
import {
  sanitizeText,
  MAX_INSTRUCTIONS_LENGTH,
  MAX_PROFILE_FIELD_LENGTH,
  MAX_ADDITIONAL_INFO_LENGTH,
} from "@/lib/security/validation";

export interface CvExtractionResult {
  profile: UserProfile;
  cvInstructions: string;
  coverInstructions: string;
  extraction: CvProfileExtraction;
  ai: AiCvAnalysis | null;
  parsed: ParsedCvLocal;
  skillProfile: SkillEvidence[];
}

/**
 * Runs AI extraction with heuristic fallback and persists profile + default instructions.
 */
export async function extractAndApplyCvProfile(
  supabase: SupabaseClient,
  userId: string,
  rawText: string,
  parsed: ParsedCvLocal,
  existingProfile?: UserProfile
): Promise<CvExtractionResult> {
  const ai = await analyzeCvWithAi(rawText);
  const heuristic = buildHeuristicExtraction(rawText, parsed);

  const extraction: CvProfileExtraction = ai?.profileExtraction
    ? mergeExtractions(heuristic, ai.profileExtraction)
    : heuristic;

  const baseProfile = existingProfile ?? { ...settingsToProfile(null) };
  const profile = mergeExtractedProfile(baseProfile, extraction.profile);
  const { cvInstructions, coverInstructions } =
    buildInstructionsFromExtraction(extraction);

  const mergedParsed = ai ? mergeParsedWithAi(parsed, ai) : parsed;
  const skillProfile = buildSkillProfileFromCv(mergedParsed);
  if (ai) {
    for (const name of ai.claimedSkills) {
      if (!skillProfile.find((s) => s.name === name)) {
        skillProfile.push({
          name,
          level: "touched",
          sources: ["ai"],
          confidence: ai.skillConfidence[name] ?? "medium",
        });
      }
    }
  }

  const profileFields = profileToDbFields(sanitizeProfileForDb(profile));

  const { error } = await supabase
    .from("user_document_settings")
    .update({
      ...profileFields,
      default_cv_instructions: sanitizeText(
        cvInstructions,
        MAX_INSTRUCTIONS_LENGTH
      ),
      default_cover_letter_instructions: sanitizeText(
        coverInstructions,
        MAX_INSTRUCTIONS_LENGTH
      ),
      cv_parsed_structured: mergedParsed,
      primary_track: mergedParsed.primaryTrack,
      skill_profile: skillProfile,
      ai_cv_analysis: ai,
      cv_profile_extraction: extraction,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return {
    profile,
    cvInstructions,
    coverInstructions,
    extraction,
    ai,
    parsed: mergedParsed,
    skillProfile,
  };
}

function mergeExtractions(
  heuristic: CvProfileExtraction,
  ai: CvProfileExtraction
): CvProfileExtraction {
  const profile = { ...heuristic.profile };
  for (const key of Object.keys(ai.profile) as (keyof UserProfile)[]) {
    const aiVal = ai.profile[key]?.trim();
    if (aiVal) profile[key] = aiVal;
  }

  return {
    profile,
    summary: ai.summary || heuristic.summary,
    experience: ai.experience.length > 0 ? ai.experience : heuristic.experience,
    education: ai.education || heuristic.education,
    skills: [...new Set([...heuristic.skills, ...ai.skills])],
  };
}

function mergeParsedWithAi(
  parsed: ParsedCvLocal,
  ai: AiCvAnalysis
): ParsedCvLocal {
  return {
    ...parsed,
    primaryTrack: ai.primaryTrack || parsed.primaryTrack,
    secondaryTracks: [
      ...new Set([...ai.secondaryTracks, ...parsed.secondaryTracks]),
    ],
    yearsExperienceEstimate:
      ai.yearsExperience ?? parsed.yearsExperienceEstimate,
    detectedSkills: [...new Set([...parsed.detectedSkills, ...ai.claimedSkills])],
    skillConfidence: { ...parsed.skillConfidence, ...ai.skillConfidence },
    signals: mergeAiIntoParsedSignals(parsed.signals, ai),
  };
}

function sanitizeProfileForDb(profile: UserProfile): UserProfile {
  return {
    fullName: sanitizeText(profile.fullName, MAX_PROFILE_FIELD_LENGTH),
    targetRole: sanitizeText(profile.targetRole, MAX_PROFILE_FIELD_LENGTH),
    email: sanitizeText(profile.email, MAX_PROFILE_FIELD_LENGTH),
    phone: sanitizeText(profile.phone, MAX_PROFILE_FIELD_LENGTH),
    mobile: sanitizeText(profile.mobile, MAX_PROFILE_FIELD_LENGTH),
    languages: sanitizeText(profile.languages, MAX_PROFILE_FIELD_LENGTH),
    location: sanitizeText(profile.location, MAX_PROFILE_FIELD_LENGTH),
    linkedinUrl: sanitizeText(profile.linkedinUrl, MAX_PROFILE_FIELD_LENGTH),
    website: sanitizeText(profile.website, MAX_PROFILE_FIELD_LENGTH),
    githubUrl: sanitizeText(profile.githubUrl, MAX_PROFILE_FIELD_LENGTH),
    extraLink: sanitizeText(profile.extraLink, MAX_PROFILE_FIELD_LENGTH),
    salaryRange: sanitizeText(profile.salaryRange, MAX_PROFILE_FIELD_LENGTH),
    additionalInfo: sanitizeText(
      profile.additionalInfo,
      MAX_ADDITIONAL_INFO_LENGTH
    ),
  };
}
