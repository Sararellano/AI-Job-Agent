import { describe, expect, it } from "vitest";
import { parseCvHeuristics } from "@/lib/cv/parse-heuristics";

const FRONTEND_CV = `
Jane Doe
jane.doe@example.com

Senior Developer

5+ years of experience in software development

Skills: React, TypeScript, JavaScript, CSS, Tailwind CSS, HTML, Git

Experience:
- Built React components with hooks (useState, useEffect)
- Styled UIs with Tailwind CSS and SCSS
- Wrote Jest tests for frontend features
`;

const DEVOPS_CV = `
John Smith
john@company.io

DevOps Engineer

Experience with Docker, Kubernetes, AWS, CI/CD pipelines
Edited docker-compose.yml and GitHub Actions workflows
Terraform and Jenkins experience
`;

describe("parseCvHeuristics", () => {
  it("detects frontend track and skills from a frontend CV", () => {
    const result = parseCvHeuristics(FRONTEND_CV);

    expect(result.primaryTrack).toBe("frontend");
    expect(result.detectedSkills).toEqual(
      expect.arrayContaining(["React", "TypeScript", "JavaScript", "CSS", "Tailwind CSS"])
    );
    expect(result.skillConfidence["React"]).toBeDefined();
    expect(result.yearsExperienceEstimate).toBe(5);
    expect(result.emails).toContain("jane.doe@example.com");
    expect(result.signals).toEqual(expect.arrayContaining(["jest"]));
  });

  it("detects devops track and YAML signals", () => {
    const result = parseCvHeuristics(DEVOPS_CV);

    expect(result.primaryTrack).toBe("devops");
    expect(result.detectedSkills).toEqual(
      expect.arrayContaining(["Docker", "Kubernetes", "AWS", "CI/CD", "YAML"])
    );
    expect(result.emails).toContain("john@company.io");
    expect(result.signals).toEqual(
      expect.arrayContaining(["docker-compose", "github actions", ".yml"])
    );
  });

  it("falls back to general track when no strong signals exist", () => {
    const result = parseCvHeuristics("Professional summary with no tech keywords.");

    expect(result.primaryTrack).toBe("general");
    expect(result.detectedSkills).toHaveLength(0);
    expect(result.yearsExperienceEstimate).toBeNull();
    expect(result.emails).toHaveLength(0);
  });

  it("assigns confidence levels based on mention frequency", () => {
    const text = "React React React TypeScript";
    const result = parseCvHeuristics(text);

    expect(result.skillConfidence["React"]).toBe("high");
    expect(result.skillConfidence["TypeScript"]).toBe("low");
  });

  it("deduplicates emails and limits to three", () => {
    const text = `
      a@test.com
      b@test.com
      a@test.com
      c@test.com
      d@test.com
      e@test.com
    `;
    const result = parseCvHeuristics(text);

    expect(result.emails).toHaveLength(3);
    expect(new Set(result.emails).size).toBe(3);
  });

  it("extracts role titles when they appear at the start of collapsed text", () => {
    const result = parseCvHeuristics(
      "Senior Developer\nReact, TypeScript, CSS, Tailwind"
    );

    expect(result.roles[0]?.title).toMatch(/^Senior Developer/);
  });
});
