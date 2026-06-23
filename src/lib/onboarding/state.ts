import type { UserDocumentSettings } from "@/types/database";
import type {
  AiCvAnalysis,
  OnboardingState,
  ParsedCvLocal,
  QuestionAnswer,
  SkillEvidence,
  CareerTrack,
} from "@/types/skills";

export function settingsToOnboarding(
  settings: Partial<UserDocumentSettings> | null | undefined
): OnboardingState {
  return {
    cvFileUrl: settings?.cv_file_url ?? null,
    cvFileName: settings?.cv_file_name ?? null,
    parsed: (settings?.cv_parsed_structured as ParsedCvLocal | null) ?? null,
    skillProfile: (settings?.skill_profile as SkillEvidence[] | null) ?? [],
    questionAnswers:
      (settings?.question_answers as Record<string, QuestionAnswer> | null) ??
      {},
    aiAnalysis: (settings?.ai_cv_analysis as AiCvAnalysis | null) ?? null,
    onboardingCompleted: settings?.onboarding_completed ?? false,
    onboardingStep: settings?.onboarding_step ?? 0,
    primaryTrack: (settings?.primary_track as CareerTrack) ?? "general",
  };
}
