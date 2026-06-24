export type CareerTrack =
  | "frontend"
  | "backend"
  | "fullstack"
  | "devops"
  | "mobile"
  | "data"
  | "general";

export type SkillLevel = "touched" | "comfortable" | "production";
export type SkillSource = "cv" | "question" | "ai" | "user";
export type SkillConfidence = "low" | "medium" | "high";
export type QuestionAnswer = "yes" | "somewhat" | "no" | "skip";

export interface SkillEvidence {
  name: string;
  level: SkillLevel;
  sources: SkillSource[];
  confidence: SkillConfidence;
}

export interface ParsedRole {
  title: string;
  company?: string;
  period?: string;
}

export interface ParsedCvLocal {
  version: 1;
  primaryTrack: CareerTrack;
  secondaryTracks: CareerTrack[];
  yearsExperienceEstimate: number | null;
  detectedSkills: string[];
  skillConfidence: Record<string, SkillConfidence>;
  roles: ParsedRole[];
  signals: string[];
  emails: string[];
}

export interface AiCvAnalysis {
  provider: "groq" | "gemini";
  primaryTrack: CareerTrack;
  secondaryTracks: CareerTrack[];
  yearsExperience: number | null;
  claimedSkills: string[];
  skillConfidence: Record<string, SkillConfidence>;
  questionSeeds: string[];
  imposterNote?: string;
  analyzedAt: string;
}

export interface DiscoveryQuestion {
  id: string;
  text: string;
  category: "skill" | "imposter" | "merit";
  skillKeys: string[];
  impliesOnYes: string[];
  impliesOnSomewhat: string[];
  priority: number;
}

import type { UserCareerContext } from "@/types/career";

export interface OnboardingState {
  cvFileUrl: string | null;
  cvFileName: string | null;
  parsed: ParsedCvLocal | null;
  skillProfile: SkillEvidence[];
  questionAnswers: Record<string, QuestionAnswer>;
  aiAnalysis: AiCvAnalysis | null;
  onboardingCompleted: boolean;
  onboardingStep: number;
  primaryTrack: CareerTrack;
  careerContext: UserCareerContext;
}
