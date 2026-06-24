import { describe, expect, it } from "vitest";
import {
  DEFAULT_JOB_PREFERENCES,
  inferDefaultPreferences,
  parseJobPreferences,
} from "@/types/job-preferences";

describe("DEFAULT_JOB_PREFERENCES", () => {
  it("has sane defaults", () => {
    expect(DEFAULT_JOB_PREFERENCES.workMode).toBe("any");
    expect(DEFAULT_JOB_PREFERENCES.seniority).toBe("any");
    expect(DEFAULT_JOB_PREFERENCES.minMatchScore).toBe(40);
    expect(DEFAULT_JOB_PREFERENCES.tracks).toEqual([]);
    expect(DEFAULT_JOB_PREFERENCES.targetRoles).toEqual([]);
    expect(DEFAULT_JOB_PREFERENCES.excludedKeywords).toEqual([]);
  });
});

describe("parseJobPreferences", () => {
  it("returns defaults for null/undefined", () => {
    expect(parseJobPreferences(null)).toEqual(DEFAULT_JOB_PREFERENCES);
    expect(parseJobPreferences(undefined)).toEqual(DEFAULT_JOB_PREFERENCES);
    expect(parseJobPreferences("bad")).toEqual(DEFAULT_JOB_PREFERENCES);
  });

  it("parses a valid preferences object", () => {
    const raw = {
      targetRoles: ["Frontend Developer", "UI Engineer"],
      workMode: "remote",
      seniority: "senior",
      tracks: ["frontend", "fullstack"],
      includeProductRoles: false,
      includeDesignRoles: true,
      preferredLocations: ["Madrid"],
      excludedKeywords: ["sales"],
      minMatchScore: 60,
    };
    const result = parseJobPreferences(raw);
    expect(result.targetRoles).toEqual(["Frontend Developer", "UI Engineer"]);
    expect(result.workMode).toBe("remote");
    expect(result.seniority).toBe("senior");
    expect(result.tracks).toEqual(["frontend", "fullstack"]);
    expect(result.includeDesignRoles).toBe(true);
    expect(result.excludedKeywords).toEqual(["sales"]);
    expect(result.minMatchScore).toBe(60);
  });

  it("falls back to defaults for invalid enum values", () => {
    const raw = { workMode: "flying", seniority: "god-tier" };
    const result = parseJobPreferences(raw);
    expect(result.workMode).toBe("any");
    expect(result.seniority).toBe("any");
  });

  it("filters invalid tracks", () => {
    const raw = { tracks: ["frontend", "quantum-computing", "devops"] };
    const result = parseJobPreferences(raw);
    expect(result.tracks).toEqual(["frontend", "devops"]);
  });

  it("caps minMatchScore to 0–100 range", () => {
    expect(parseJobPreferences({ minMatchScore: 150 }).minMatchScore).toBe(40);
    expect(parseJobPreferences({ minMatchScore: -5 }).minMatchScore).toBe(40);
    expect(parseJobPreferences({ minMatchScore: 75 }).minMatchScore).toBe(75);
  });

  it("truncates arrays to maxItems", () => {
    const manyRoles = Array.from({ length: 20 }, (_, i) => `Role ${i}`);
    const result = parseJobPreferences({ targetRoles: manyRoles });
    expect(result.targetRoles.length).toBeLessThanOrEqual(10);
  });

  it("strips non-string items from arrays", () => {
    const raw = { targetRoles: ["Valid", 123, null, "Also Valid"] };
    const result = parseJobPreferences(raw);
    expect(result.targetRoles).toEqual(["Valid", "Also Valid"]);
  });

  it("ignores includeProductRoles unless strictly true", () => {
    expect(parseJobPreferences({ includeProductRoles: "yes" }).includeProductRoles).toBe(false);
    expect(parseJobPreferences({ includeProductRoles: 1 }).includeProductRoles).toBe(false);
    expect(parseJobPreferences({ includeProductRoles: true }).includeProductRoles).toBe(true);
  });
});

describe("inferDefaultPreferences", () => {
  it("sets tracks from primary track", () => {
    const result = inferDefaultPreferences("devops", null);
    expect(result.tracks).toContain("devops");
  });

  it("adds fullstack for frontend/backend tracks", () => {
    expect(inferDefaultPreferences("frontend", null).tracks).toContain("fullstack");
    expect(inferDefaultPreferences("backend", null).tracks).toContain("fullstack");
  });

  it("does not add fullstack for other tracks", () => {
    const result = inferDefaultPreferences("data", null);
    expect(result.tracks).not.toContain("fullstack");
  });

  it("sets targetRoles from target_role", () => {
    const result = inferDefaultPreferences(null, "Product Manager");
    expect(result.targetRoles).toEqual(["Product Manager"]);
  });

  it("detects product roles from target_role string", () => {
    const result = inferDefaultPreferences(null, "Technical PM");
    expect(result.includeProductRoles).toBe(true);
  });

  it("detects design roles from target_role string", () => {
    const result = inferDefaultPreferences(null, "UX designer");
    expect(result.includeDesignRoles).toBe(true);
  });

  it("returns empty overrides for null inputs", () => {
    const result = inferDefaultPreferences(null, null);
    expect(result).toEqual({});
  });

  it("skips general track", () => {
    const result = inferDefaultPreferences("general", null);
    expect(result.tracks).toBeUndefined();
  });
});
