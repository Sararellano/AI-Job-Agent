import { describe, expect, it } from "vitest";
import { buildCoverFromExtraction } from "@/lib/documents/build-cover-content";
import type { CvProfileExtraction } from "@/types/skills";
import { EMPTY_PROFILE } from "@/types/documents";

const extraction: CvProfileExtraction = {
  profile: { ...EMPTY_PROFILE, fullName: "Sara Arellano", targetRole: "Senior Frontend Engineer" },
  summary:
    "Senior Frontend Engineer con más de 8 años de experiencia construyendo productos digitales escalables.",
  experience: [
    {
      role: "Senior Frontend Engineer",
      company: "Capitole",
      period: "2021 — Present",
      location: "Madrid",
      highlights: [
        "Lideré la migración a Next.js",
        "Integré flujos con APIs de IA",
      ],
    },
  ],
  education: [
    {
      degree: "Grado en Ingeniería Informática",
      institution: "UPM",
      period: "2016",
      location: "Madrid",
    },
  ],
  skills: ["React", "TypeScript", "Next.js", "JavaScript", "Python"],
};

describe("buildCoverFromExtraction", () => {
  it("references real experience and skills, not meta instructions", () => {
    const letter = buildCoverFromExtraction({
      job: {
        title: "Chatbot & Agentic AI Developer",
        company: "capitole",
        description: "React, TypeScript, Python, AI chatbot development",
        summary: "Remote role building agentic AI products",
        requirements: "React, Python, LLM experience",
      },
      profile: extraction.profile,
      cvExtraction: extraction,
      documentLanguage: "es",
    });

    const body = letter.paragraphs.join(" ");
    expect(body).toContain("8 años");
    expect(body).toContain("Capitole");
    expect(body).toContain("Next.js");
    expect(body).not.toContain("Write a one-page formal cover letter");
    expect(body).not.toContain("Address the hiring manager");
    expect(letter.paragraphs.length).toBeGreaterThanOrEqual(4);
  });
});
