import { describe, expect, it } from "vitest";
import {
  careerContextFromSettings,
  getRoleFamilies,
  getTaxonomy,
  inferCareerContext,
  isValidRoleFamily,
  isValidSector,
} from "@/lib/skills/registry";
import type { ParsedCvLocal } from "@/types/skills";

const techParsed: ParsedCvLocal = {
  version: 1,
  primaryTrack: "frontend",
  secondaryTracks: [],
  yearsExperienceEstimate: 4,
  detectedSkills: ["React", "TypeScript"],
  skillConfidence: { React: "high", TypeScript: "medium" },
  roles: [{ title: "Frontend Developer" }],
  signals: ["jest"],
  emails: [],
};

const emptyParsed: ParsedCvLocal = {
  version: 1,
  primaryTrack: "general",
  secondaryTracks: [],
  yearsExperienceEstimate: null,
  detectedSkills: [],
  skillConfidence: {},
  roles: [{ title: "Marketing Coordinator" }],
  signals: [],
  emails: [],
};

describe("registry", () => {
  it("validates sectors and role families", () => {
    expect(isValidSector("tech")).toBe(true);
    expect(isValidSector("invalid")).toBe(false);
    expect(isValidRoleFamily("healthcare", "nursing")).toBe(true);
    expect(isValidRoleFamily("healthcare", "frontend")).toBe(false);
  });

  it("returns tech taxonomy only for tech sector", () => {
    expect(Object.keys(getTaxonomy("tech")).length).toBeGreaterThan(0);
    expect(Object.keys(getTaxonomy("marketing"))).toHaveLength(0);
  });

  it("lists role families per sector", () => {
    expect(getRoleFamilies("tech").some((r) => r.id === "frontend")).toBe(true);
    expect(getRoleFamilies("marketing").some((r) => r.id === "content")).toBe(
      true
    );
  });

  it("infers tech context from a developer CV", () => {
    const ctx = inferCareerContext(techParsed);
    expect(ctx).toMatchObject({
      sector: "tech",
      roleFamily: "frontend",
      targetRole: "Frontend Developer",
    });
  });

  it("infers other sector when no tech signals are found", () => {
    const ctx = inferCareerContext(emptyParsed);
    expect(ctx.sector).toBe("other");
    expect(ctx.roleFamily).toBe("general");
    expect(ctx.targetRole).toBe("Marketing Coordinator");
  });

  it("maps persisted settings to career context", () => {
    const ctx = careerContextFromSettings({
      sector: "marketing",
      role_family: "digital_marketing",
      target_role: "Growth Marketer",
    });

    expect(ctx).toEqual({
      sector: "marketing",
      roleFamily: "digital_marketing",
      targetRole: "Growth Marketer",
    });
  });
});
