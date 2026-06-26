import { describe, expect, it } from "vitest";
import { resolveCvExtraction } from "@/lib/cv/resolve-cv-extraction";
import { parseCvHeuristics } from "@/lib/cv/parse-heuristics";
import type { UserDocumentSettings } from "@/types/database";

const SAMPLE_CV = `
Sara Arellano
Senior Frontend Engineer
sara@email.com

Resumen
Senior Frontend Engineer con más de 8 años de experiencia.

Experiencia
Senior Frontend Engineer @ Capitole — 2021 — Present
- Lideré migración a Next.js
- Mejoré Core Web Vitals

Formación
Grado en Ingeniería Informática — UPM — 2016
`;

describe("resolveCvExtraction", () => {
  it("rebuilds extraction from stored raw CV text", () => {
    const parsed = parseCvHeuristics(SAMPLE_CV);
    const settings = {
      cv_parsed_raw: SAMPLE_CV,
      cv_parsed_structured: parsed as unknown as Record<string, unknown>,
      cv_profile_extraction: null,
      ai_cv_analysis: null,
    } as Partial<UserDocumentSettings>;

    const extraction = resolveCvExtraction(settings);
    expect(extraction).not.toBeNull();
    expect(extraction?.summary).toContain("8 años");
    expect(extraction?.experience.length).toBeGreaterThan(0);
    expect(extraction?.education[0]?.degree).toContain("Ingeniería");
  });
});
