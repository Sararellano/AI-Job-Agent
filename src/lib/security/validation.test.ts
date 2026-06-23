import { describe, expect, it } from "vitest";
import {
  isAllowedCvUpload,
  isValidApplicationStatus,
  isValidQuestionAnswer,
  isValidUuid,
  resolveTemplateId,
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
