import { describe, expect, it } from "vitest";
import {
  resolveOnboardingWizardStep,
  settingsToOnboarding,
} from "@/lib/onboarding/state";

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
      careerContext: {
        sector: "tech",
        roleFamily: "general",
        targetRole: "",
      },
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
      onboarding_step: 4,
      primary_track: "frontend",
      sector: "tech",
      role_family: "frontend",
      target_role: "Frontend Developer",
    });

    expect(state).toMatchObject({
      cvFileUrl: "https://storage/cv.pdf",
      cvFileName: "cv.pdf",
      parsed,
      onboardingCompleted: true,
      onboardingStep: 4,
      primaryTrack: "frontend",
      careerContext: {
        sector: "tech",
        roleFamily: "frontend",
        targetRole: "Frontend Developer",
      },
    });
    expect(state.skillProfile).toHaveLength(1);
    expect(state.questionAnswers["q-react-components"]).toBe("yes");
  });
});

describe("resolveOnboardingWizardStep", () => {
  const base = settingsToOnboarding(null);

  it("starts at upload when no CV exists", () => {
    expect(resolveOnboardingWizardStep(base)).toBe(0);
  });

  it("routes to sector step after upload", () => {
    expect(
      resolveOnboardingWizardStep({
        ...base,
        parsed: {
          version: 1,
          primaryTrack: "frontend",
          secondaryTracks: [],
          yearsExperienceEstimate: 3,
          detectedSkills: [],
          skillConfidence: {},
          roles: [],
          signals: [],
          emails: [],
        },
        onboardingStep: 1,
      })
    ).toBe(1);
  });

  it("routes to parse review after sector confirmation", () => {
    expect(
      resolveOnboardingWizardStep({
        ...base,
        parsed: {
          version: 1,
          primaryTrack: "frontend",
          secondaryTracks: [],
          yearsExperienceEstimate: 3,
          detectedSkills: [],
          skillConfidence: {},
          roles: [],
          signals: [],
          emails: [],
        },
        onboardingStep: 2,
      })
    ).toBe(2);
  });

  it("routes to questions when review step is done", () => {
    expect(
      resolveOnboardingWizardStep({
        ...base,
        parsed: {
          version: 1,
          primaryTrack: "frontend",
          secondaryTracks: [],
          yearsExperienceEstimate: 3,
          detectedSkills: [],
          skillConfidence: {},
          roles: [],
          signals: [],
          emails: [],
        },
        onboardingStep: 3,
      })
    ).toBe(3);
  });
});
