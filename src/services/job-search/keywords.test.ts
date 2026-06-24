import { describe, expect, it } from "vitest";
import type { SkillEvidence } from "@/types/skills";
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

describe("buildSearchKeywords", () => {
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

  it("falls back to broad tech defaults when profile is empty", () => {
    const keywords = buildSearchKeywords({});
    expect(keywords.length).toBeGreaterThan(20);
    expect(DEFAULT_TECH_KEYWORDS.every((keyword) => keywords.includes(keyword))).toBe(
      true
    );
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
