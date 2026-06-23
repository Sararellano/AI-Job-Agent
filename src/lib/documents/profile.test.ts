import { describe, expect, it } from "vitest";
import {
  formatProfileForPrompt,
  profileToDbFields,
  settingsToProfile,
} from "@/lib/documents/profile";
import { EMPTY_PROFILE } from "@/types/documents";

describe("settingsToProfile", () => {
  it("returns empty profile when settings are missing", () => {
    expect(settingsToProfile(null)).toEqual(EMPTY_PROFILE);
    expect(settingsToProfile(undefined)).toEqual(EMPTY_PROFILE);
  });

  it("maps database fields to user profile", () => {
    const profile = settingsToProfile({
      full_name: "Jane Doe",
      target_role: "Frontend Developer",
      email: "jane@example.com",
      github_url: "https://github.com/jane",
    });

    expect(profile).toMatchObject({
      fullName: "Jane Doe",
      targetRole: "Frontend Developer",
      email: "jane@example.com",
      githubUrl: "https://github.com/jane",
      phone: "",
    });
  });
});

describe("profileToDbFields", () => {
  it("maps user profile back to database fields", () => {
    const dbFields = profileToDbFields({
      ...EMPTY_PROFILE,
      fullName: "Jane Doe",
      linkedinUrl: "https://linkedin.com/in/jane",
    });

    expect(dbFields).toEqual({
      full_name: "Jane Doe",
      target_role: "",
      email: "",
      phone: "",
      mobile: "",
      languages: "",
      location: "",
      linkedin_url: "https://linkedin.com/in/jane",
      website: "",
      github_url: "",
      extra_link: "",
      additional_info: "",
    });
  });
});

describe("formatProfileForPrompt", () => {
  it("includes only non-empty fields", () => {
    const prompt = formatProfileForPrompt({
      ...EMPTY_PROFILE,
      fullName: "Jane Doe",
      email: "jane@example.com",
      githubUrl: "https://github.com/jane",
    });

    expect(prompt).toContain("Name: Jane Doe");
    expect(prompt).toContain("Email: jane@example.com");
    expect(prompt).toContain("GitHub: https://github.com/jane");
    expect(prompt).not.toContain("Phone:");
    expect(prompt).not.toContain("Role:");
  });

  it("returns empty string when profile has no data", () => {
    expect(formatProfileForPrompt(EMPTY_PROFILE)).toBe("");
  });
});
