import { describe, expect, it } from "vitest";
import { settingsToOnboarding } from "@/lib/onboarding/state";
import type { UserDocumentSettings } from "@/types/database";

const BASE_SETTINGS = {
  id: "id-1",
  user_id: "user-1",
  full_name: null,
  target_role: null,
  email: null,
  phone: null,
  mobile: null,
  languages: null,
  location: null,
  linkedin_url: null,
  website: null,
  github_url: null,
  extra_link: null,
  salary_range: null,
  additional_info: null,
  default_cv_instructions: "",
  default_cover_letter_instructions: "",
  default_cv_photo_url: null,
  default_cover_letter_photo_url: null,
  default_cv_template_id: null,
  default_cover_letter_template_id: null,
  cv_file_url: null,
  cv_file_name: null,
  cv_parsed_raw: null,
  cv_parsed_structured: null,
  primary_track: "frontend",
  skill_profile: null,
  question_answers: null,
  ai_cv_analysis: null,
  cv_profile_extraction: null,
  onboarding_completed: false,
  onboarding_step: 0,
  job_preferences: null,
  updated_at: "2024-01-01T00:00:00Z",
} satisfies UserDocumentSettings;

describe("settingsToOnboarding", () => {
  it("returns sensible defaults for null settings", () => {
    const state = settingsToOnboarding(null);
    expect(state.primaryTrack).toBe("general");
    expect(state.skillProfile).toEqual([]);
    expect(state.onboardingCompleted).toBe(false);
    expect(state.jobPreferences).toBeNull();
  });

  it("maps primary_track correctly", () => {
    const state = settingsToOnboarding(BASE_SETTINGS);
    expect(state.primaryTrack).toBe("frontend");
  });

  it("maps jobPreferences to null when not set", () => {
    const state = settingsToOnboarding(BASE_SETTINGS);
    expect(state.jobPreferences).toBeNull();
  });

  it("parses valid job_preferences", () => {
    const settings: UserDocumentSettings = {
      ...BASE_SETTINGS,
      job_preferences: {
        targetRoles: ["Frontend Developer"],
        workMode: "remote",
        seniority: "senior",
        tracks: ["frontend"],
        includeProductRoles: false,
        includeDesignRoles: false,
        preferredLocations: [],
        excludedKeywords: [],
        minMatchScore: 60,
      },
    };
    const state = settingsToOnboarding(settings);
    expect(state.jobPreferences?.workMode).toBe("remote");
    expect(state.jobPreferences?.minMatchScore).toBe(60);
    expect(state.jobPreferences?.targetRoles).toEqual(["Frontend Developer"]);
  });

  it("parses malformed job_preferences gracefully", () => {
    const settings: UserDocumentSettings = {
      ...BASE_SETTINGS,
      job_preferences: { workMode: "spaceship", minMatchScore: 999 },
    };
    const state = settingsToOnboarding(settings);
    expect(state.jobPreferences?.workMode).toBe("any");
    expect(state.jobPreferences?.minMatchScore).toBe(40);
  });

  it("maps onboardingCompleted", () => {
    const state = settingsToOnboarding({ ...BASE_SETTINGS, onboarding_completed: true });
    expect(state.onboardingCompleted).toBe(true);
  });
});
