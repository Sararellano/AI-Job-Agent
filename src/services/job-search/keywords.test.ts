import { describe, expect, it } from "vitest";
import type { SkillEvidence } from "@/types/skills";
import type { JobPreferences } from "@/types/job-preferences";
import {
  buildInfoJobsQueries,
  buildSearchKeywords,
  DEFAULT_TECH_KEYWORDS,
  extractSkillKeywords,
  matchesJobPosting,
  PRODUCT_KEYWORDS,
} from "@/services/job-search/keywords";

describe("extractSkillKeywords", () => {
  it("keeps skills with meaningful evidence", () => {
    const profile: SkillEvidence[] = [
      {
        name: "React",
        level: "production",
        sources: ["cv"],
        confidence: "high",
      },
      {
        name: "YAML",
        level: "touched",
        sources: ["question"],
        confidence: "low",
      },
    ];

    expect(extractSkillKeywords(profile)).toEqual(["React"]);
  });
});

describe("buildSearchKeywords — broad mode (default)", () => {
  it("merges track, role and onboarding skills", () => {
    const keywords = buildSearchKeywords({
      targetRole: "Senior Backend Engineer",
      primaryTrack: "backend",
      skillProfile: [
        {
          name: "PostgreSQL",
          level: "comfortable",
          sources: ["cv"],
          confidence: "medium",
        },
      ],
    });

    expect(keywords).toContain("backend");
    expect(keywords).toContain("senior backend engineer");
    expect(keywords).toContain("postgresql");
  });

  it("adds product keywords for PM roles", () => {
    const keywords = buildSearchKeywords({
      targetRole: "Technical Product Manager",
      primaryTrack: "general",
      skillProfile: [],
    });

    expect(keywords.some((keyword) => PRODUCT_KEYWORDS.includes(keyword))).toBe(
      true
    );
  });

  it("includes DEFAULT_TECH_KEYWORDS in broad mode", () => {
    const keywords = buildSearchKeywords({}, "broad");
    expect(keywords.length).toBeGreaterThan(20);
    expect(DEFAULT_TECH_KEYWORDS.every((keyword) => keywords.includes(keyword))).toBe(true);
  });
});

describe("buildSearchKeywords — strict mode", () => {
  it("does NOT include DEFAULT_TECH_KEYWORDS in strict mode with empty profile", () => {
    const keywords = buildSearchKeywords({}, "strict");
    // strict + empty profile → no defaults added
    expect(keywords.length).toBe(0);
  });

  it("uses preferences targetRoles over targetRole field", () => {
    const prefs: JobPreferences = {
      targetRoles: ["UI Engineer"],
      workMode: "any",
      seniority: "any",
      tracks: ["frontend"],
      includeProductRoles: false,
      includeDesignRoles: false,
      preferredLocations: [],
      excludedKeywords: [],
      minMatchScore: 40,
    };
    const keywords = buildSearchKeywords(
      { targetRole: "Old Role", jobPreferences: prefs },
      "strict"
    );
    expect(keywords).toContain("ui engineer");
    expect(keywords).not.toContain("old role");
  });

  it("uses preferences tracks over primaryTrack", () => {
    const prefs: JobPreferences = {
      targetRoles: [],
      workMode: "any",
      seniority: "any",
      tracks: ["devops"],
      includeProductRoles: false,
      includeDesignRoles: false,
      preferredLocations: [],
      excludedKeywords: [],
      minMatchScore: 40,
    };
    const keywords = buildSearchKeywords(
      { primaryTrack: "frontend", jobPreferences: prefs },
      "strict"
    );
    expect(keywords).toContain("devops");
    // frontend track keywords not included since prefs overrides to devops
    expect(keywords).not.toContain("react");
  });

  it("removes excludedKeywords from strict set", () => {
    const prefs: JobPreferences = {
      targetRoles: ["Backend Developer"],
      workMode: "any",
      seniority: "any",
      tracks: ["backend"],
      includeProductRoles: false,
      includeDesignRoles: false,
      preferredLocations: [],
      excludedKeywords: ["backend"],
      minMatchScore: 40,
    };
    const keywords = buildSearchKeywords({ jobPreferences: prefs }, "strict");
    expect(keywords).not.toContain("backend");
  });

  it("includes includeProductRoles keywords when flagged", () => {
    const prefs: JobPreferences = {
      targetRoles: [],
      workMode: "any",
      seniority: "any",
      tracks: [],
      includeProductRoles: true,
      includeDesignRoles: false,
      preferredLocations: [],
      excludedKeywords: [],
      minMatchScore: 40,
    };
    const keywords = buildSearchKeywords({ jobPreferences: prefs }, "strict");
    expect(keywords.some((k) => PRODUCT_KEYWORDS.includes(k))).toBe(true);
  });
});

describe("buildInfoJobsQueries", () => {
  it("builds focused API queries from keywords", () => {
    const queries = buildInfoJobsQueries([
      "devops engineer",
      "product manager",
      "react",
    ]);

    expect(queries).toContain("devops engineer");
    expect(queries).toContain("product manager");
    expect(queries.length).toBeLessThanOrEqual(12);
  });
});

describe("matchesJobPosting", () => {
  it("matches backend and product postings", () => {
    expect(
      matchesJobPosting("Senior DevOps Engineer at CloudCo", ["devops", "react"])
    ).toBe(true);
    expect(
      matchesJobPosting("Group Product Manager", ["product manager", "java"])
    ).toBe(true);
    expect(
      matchesJobPosting("Sales Representative", ["devops", "backend"])
    ).toBe(false);
  });
});
