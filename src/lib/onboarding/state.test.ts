import { describe, expect, it } from "vitest";
import { settingsToOnboarding } from "@/lib/onboarding/state";

describe("settingsToOnboarding", () => {
  it("returns defaults when settings are missing", () => {
    expect(settingsToOnboarding(null)).toEqual({
      cvFileUrl: null,
      cvFileName: null,
      parsed: null,
      skillProfile: [],
      questionAnswers: {},
      aiAnalysis: null,
      onboardingCompleted: false,
      onboardingStep: 0,
      primaryTrack: "general",
    });
  });

  it("maps persisted onboarding fields from settings", () => {
    const parsed = {
      version: 1 as const,
      primaryTrack: "frontend" as const,
      secondaryTracks: [] as const,
      yearsExperienceEstimate: 4,
      detectedSkills: ["React"],
      skillConfidence: { React: "high" as const },
      roles: [],
      signals: [],
      emails: [],
    };

    const state = settingsToOnboarding({
      cv_file_url: "https://storage/cv.pdf",
      cv_file_name: "cv.pdf",
      cv_parsed_structured: parsed,
      skill_profile: [{ name: "React", level: "production", sources: ["cv"], confidence: "high" }],
      question_answers: { "q-react-components": "yes" },
      onboarding_completed: true,
      onboarding_step: 3,
      primary_track: "frontend",
    });

    expect(state).toMatchObject({
      cvFileUrl: "https://storage/cv.pdf",
      cvFileName: "cv.pdf",
      parsed,
      onboardingCompleted: true,
      onboardingStep: 3,
      primaryTrack: "frontend",
    });
    expect(state.skillProfile).toHaveLength(1);
    expect(state.questionAnswers["q-react-components"]).toBe("yes");
  });
});
