import { describe, expect, it } from "vitest";
import {
  parseCoverLetterContent,
  parseCvContent,
  serializeCoverLetterContent,
  serializeCvContent,
} from "@/lib/documents/parse-content";
import type { CoverLetterDocument, CvDocument } from "@/types/documents";
import { DEFAULT_COVER_TEMPLATE, DEFAULT_CV_TEMPLATE } from "@/types/documents";

const sampleCv: CvDocument = {
  version: 1,
  templateId: DEFAULT_CV_TEMPLATE,
  summary: "Experienced developer",
  experience: [
    {
      role: "Developer",
      company: "Acme",
      period: "2020–2024",
      location: "Madrid",
      highlights: ["Shipped features"],
    },
  ],
  skills: ["TypeScript", "React"],
  education: [
    {
      degree: "BSc Computer Science",
      institution: "University",
      period: "2016",
      location: "",
    },
  ],
  jobHighlights: ["Led migration"],
};

const sampleCover: CoverLetterDocument = {
  version: 1,
  templateId: "classic",
  date: "1 January 2025",
  greeting: "Dear Team,",
  paragraphs: ["I am excited to apply."],
  closing: "Best regards,",
};

describe("parseCvContent", () => {
  it("returns null for empty input", () => {
    expect(parseCvContent(null)).toBeNull();
    expect(parseCvContent("")).toBeNull();
  });

  it("parses valid structured JSON", () => {
    const raw = JSON.stringify(sampleCv);
    expect(parseCvContent(raw)).toEqual(sampleCv);
  });

  it("falls back to legacy markdown content", () => {
    const legacy = "# My CV\nSome markdown content";
    const result = parseCvContent(legacy);

    expect(result).toMatchObject({
      version: 1,
      templateId: DEFAULT_CV_TEMPLATE,
      summary: legacy.slice(0, 500),
      experience: [],
      skills: [],
    });
  });
});

describe("parseCoverLetterContent", () => {
  it("returns null for empty input", () => {
    expect(parseCoverLetterContent(null)).toBeNull();
  });

  it("parses valid structured JSON", () => {
    const raw = JSON.stringify(sampleCover);
    expect(parseCoverLetterContent(raw)).toEqual(sampleCover);
  });

  it("falls back to legacy plain text", () => {
    const legacy = "I would love to join your team.";
    const result = parseCoverLetterContent(legacy);

    expect(result).toMatchObject({
      version: 1,
      templateId: DEFAULT_COVER_TEMPLATE,
      greeting: "Dear Hiring Manager,",
      paragraphs: [legacy],
      closing: "Sincerely,",
    });
    expect(result?.date).toBeTruthy();
  });
});

describe("serialize helpers", () => {
  it("round-trips CV documents", () => {
    const serialized = serializeCvContent(sampleCv);
    expect(parseCvContent(serialized)).toEqual(sampleCv);
  });

  it("round-trips cover letter documents", () => {
    const serialized = serializeCoverLetterContent(sampleCover);
    expect(parseCoverLetterContent(serialized)).toEqual(sampleCover);
  });
});
