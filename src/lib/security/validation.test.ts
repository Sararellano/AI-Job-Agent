import { describe, expect, it } from "vitest";
import {
  inferJobSourceFromUrl,
  isAllowedCvUpload,
  isValidApplicationStatus,
  isValidJobUrl,
  isValidQuestionAnswer,
  isValidUuid,
  normalizeJobUrl,
  resolveTemplateId,
  sanitizeJobInput,
  sanitizeQuestionAnswers,
  sanitizeText,
} from "@/lib/security/validation";

describe("sanitizeText", () => {
  it("trims and caps text length", () => {
    expect(sanitizeText("  hello  ", 10)).toBe("hello");
    expect(sanitizeText("a".repeat(20), 5)).toHaveLength(5);
  });
});

describe("isValidUuid", () => {
  it("accepts valid UUIDs", () => {
    expect(isValidUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("rejects invalid UUIDs", () => {
    expect(isValidUuid("not-a-uuid")).toBe(false);
    expect(isValidUuid("")).toBe(false);
  });
});

describe("isValidApplicationStatus", () => {
  it("accepts known statuses only", () => {
    expect(isValidApplicationStatus("applied")).toBe(true);
    expect(isValidApplicationStatus("hacked")).toBe(false);
  });
});

describe("isValidQuestionAnswer", () => {
  it("accepts enum values only", () => {
    expect(isValidQuestionAnswer("yes")).toBe(true);
    expect(isValidQuestionAnswer("invalid")).toBe(false);
    expect(isValidQuestionAnswer(1)).toBe(false);
  });
});

describe("sanitizeQuestionAnswers", () => {
  it("keeps valid entries and drops invalid ones", () => {
    const result = sanitizeQuestionAnswers({
      "q-react": "yes",
      "q-bad": "maybe",
      123: "yes",
    });

    expect(result).toEqual({ "q-react": "yes" });
  });

  it("returns null for non-objects", () => {
    expect(sanitizeQuestionAnswers(null)).toBeNull();
    expect(sanitizeQuestionAnswers(["yes"])).toBeNull();
  });
});

describe("resolveTemplateId", () => {
  it("returns known template ids", () => {
    expect(resolveTemplateId("cv", "cv-3")).toBe("cv-3");
    expect(resolveTemplateId("cover_letter", "cl-2")).toBe("cl-2");
  });

  it("falls back to defaults for unknown ids", () => {
    expect(resolveTemplateId("cv", "evil-template")).toBe("cv-1");
    expect(resolveTemplateId("cover_letter", undefined)).toBe("cl-1");
  });
});

describe("isAllowedCvUpload", () => {
  it("requires both mime type and extension", () => {
    expect(isAllowedCvUpload("application/pdf", "resume.pdf")).toBe(true);
    expect(isAllowedCvUpload("application/pdf", "resume.exe")).toBe(false);
    expect(isAllowedCvUpload("text/plain", "resume.pdf")).toBe(false);
  });
});

describe("normalizeJobUrl", () => {
  it("accepts https urls and strips trailing slash", () => {
    expect(
      normalizeJobUrl("https://boards.greenhouse.io/acme/jobs/123/")
    ).toBe("https://boards.greenhouse.io/acme/jobs/123");
  });

  it("rejects unsafe protocols", () => {
    expect(normalizeJobUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeJobUrl("ftp://example.com/job")).toBeNull();
  });
});

describe("isValidJobUrl", () => {
  it("validates normalized http(s) urls", () => {
    expect(isValidJobUrl("https://jobs.lever.co/acme/abc")).toBe(true);
    expect(isValidJobUrl("not-a-url")).toBe(false);
  });
});

describe("inferJobSourceFromUrl", () => {
  it("detects known ATS hosts", () => {
    expect(
      inferJobSourceFromUrl("https://boards.greenhouse.io/acme/jobs/1")
    ).toBe("greenhouse");
    expect(inferJobSourceFromUrl("https://jobs.lever.co/acme/abc")).toBe(
      "lever"
    );
    expect(inferJobSourceFromUrl("https://www.linkedin.com/jobs/view/1")).toBe(
      "linkedin"
    );
  });
});

describe("sanitizeJobInput", () => {
  it("returns sanitized payload for valid input", () => {
    const result = sanitizeJobInput({
      title: " Frontend Dev ",
      company: "Acme",
      description: "Build UI",
      url: "https://jobs.lever.co/acme/role/",
      requirements: "React",
    });

    expect(result).toEqual({
      title: "Frontend Dev",
      company: "Acme",
      description: "Build UI",
      url: "https://jobs.lever.co/acme/role",
      source: "lever",
      summary: null,
      salary: null,
      requirements: "React",
    });
  });

  it("returns null when required fields are missing", () => {
    expect(sanitizeJobInput({ title: "Dev" })).toBeNull();
  });
});
