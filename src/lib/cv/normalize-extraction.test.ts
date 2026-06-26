import { describe, expect, it } from "vitest";
import {
  normalizeCvDocument,
  normalizeCvProfileExtraction,
} from "@/lib/cv/normalize-extraction";

describe("normalizeCvProfileExtraction", () => {
  it("converts legacy education string to structured entries", () => {
    const result = normalizeCvProfileExtraction({
      profile: {},
      summary: "Developer",
      experience: [],
      education: "BSc Computer Science — University of Madrid — 2018",
      skills: ["React"],
    });

    expect(result.education[0]?.degree).toBe("BSc Computer Science");
    expect(result.education[0]?.institution).toBe("University of Madrid");
    expect(result.education[0]?.period).toBe("2018");
  });

  it("ensures at least one empty experience and education entry", () => {
    const result = normalizeCvProfileExtraction({
      profile: {},
      summary: "",
      experience: [],
      education: [],
      skills: [],
    });

    expect(result.experience).toHaveLength(1);
    expect(result.education).toHaveLength(1);
    expect(result.experience[0]?.role).toBe("");
  });
});

describe("normalizeCvDocument", () => {
  it("migrates legacy education string in stored CV content", () => {
    const doc = normalizeCvDocument({
      version: 1,
      templateId: "cv-1",
      summary: "Summary",
      experience: [],
      skills: [],
      education: "MBA — IE Business School — 2020",
      jobHighlights: [],
    });

    expect(doc.templateId).toBe("cv-1");
    expect(doc.education[0]?.degree).toBe("MBA");
    expect(doc.education[0]?.institution).toBe("IE Business School");
  });
});
