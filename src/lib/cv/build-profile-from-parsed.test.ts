import { describe, expect, it } from "vitest";
import {
  buildHeuristicExtraction,
  buildInstructionsFromExtraction,
  mergeExtractedProfile,
} from "@/lib/cv/build-profile-from-parsed";
import { parseCvHeuristics } from "@/lib/cv/parse-heuristics";
import { EMPTY_PROFILE } from "@/types/documents";

const SAMPLE_CV = `
Jane Doe
Frontend Developer
jane@email.com
+34 600 111 222
Madrid, Spain
https://linkedin.com/in/janedoe
https://github.com/janedoe

Summary
Experienced React developer with 5 years building web apps.

Experience
Senior Frontend Developer — Acme Corp — 2021 — Present
- Led migration to Next.js
- Improved Core Web Vitals

Education
BSc Computer Science — University of Madrid — 2018
`;

describe("buildHeuristicExtraction", () => {
  it("extracts contact fields and formats instructions", () => {
    const parsed = parseCvHeuristics(SAMPLE_CV);
    const extraction = buildHeuristicExtraction(SAMPLE_CV, parsed);

    expect(extraction.profile.fullName).toBe("Jane Doe");
    expect(extraction.profile.email).toBe("jane@email.com");
    expect(extraction.profile.mobile).toContain("600");
    expect(extraction.profile.linkedinUrl).toContain("linkedin.com");
    expect(extraction.profile.githubUrl).toContain("github.com");
    expect(extraction.experience.length).toBeGreaterThan(0);

    const { cvInstructions, coverInstructions } =
      buildInstructionsFromExtraction(extraction);
    expect(cvInstructions).toContain("Work experience");
    expect(cvInstructions).toContain("Skills:");
    expect(coverInstructions).toContain("cover letter");
    expect(extraction.education[0]?.degree).toContain("Computer Science");
  });
});

describe("mergeExtractedProfile", () => {
  it("fills empty fields without dropping existing values when new value is empty", () => {
    const merged = mergeExtractedProfile(
      { ...EMPTY_PROFILE, fullName: "Keep Me" },
      { fullName: "", email: "new@email.com" }
    );
    expect(merged.fullName).toBe("Keep Me");
    expect(merged.email).toBe("new@email.com");
  });
});
