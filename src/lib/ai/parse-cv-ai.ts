import type { AiCvAnalysis, CareerTrack, CvProfileExtraction, SkillConfidence } from "@/types/skills";
import type { CvExperience, UserProfile } from "@/types/documents";
import { EMPTY_PROFILE } from "@/types/documents";
import { normalizeCvProfileExtraction } from "@/lib/cv/normalize-extraction";
import { truncateCvText } from "@/lib/cv/extract-text";

const ANALYSIS_SCHEMA = `{
  "primaryTrack": "frontend|backend|fullstack|devops|mobile|data|general",
  "secondaryTracks": [],
  "yearsExperience": number|null,
  "claimedSkills": ["string"],
  "skillConfidence": {"SkillName": "low|medium|high"},
  "questionSeeds": ["short keywords from CV for follow-up questions"],
  "imposterNote": "one sentence reassuring note about transferable skills",
  "profile": {
    "fullName": "string",
    "targetRole": "string",
    "email": "string",
    "mobile": "string",
    "languages": "string",
    "location": "string",
    "linkedinUrl": "string",
    "website": "string",
    "githubUrl": "string",
    "extraLink": "string",
    "salaryRange": "string",
    "additionalInfo": "certifications and other notes"
  },
  "summary": "professional summary paragraph",
  "experience": [{"role":"string","company":"string","period":"dates","location":"string","highlights":["bullet"]}],
  "education": [{"degree":"string","institution":"string","period":"dates","location":"string"}],
  "skills": ["string"]
}`;

/**
 * Optional AI enhancement — Groq first, then Gemini. Skips if no API keys.
 */
export async function analyzeCvWithAi(
  rawText: string
): Promise<AiCvAnalysis | null> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  const prompt = buildPrompt(rawText);

  if (groqKey) {
    try {
      return await callGroq(groqKey, prompt);
    } catch (err) {
      console.error("Groq CV analysis failed:", err);
    }
  }

  if (geminiKey) {
    try {
      return await callGemini(geminiKey, prompt);
    } catch (err) {
      console.error("Gemini CV analysis failed:", err);
    }
  }

  return null;
}

function buildPrompt(rawText: string): string {
  const excerpt = truncateCvText(rawText).slice(0, 8000);
  return `Analyze this CV and return ONLY valid JSON matching this schema (no markdown).
Extract ALL contact details, work experience with dates and locations, education, skills and summary from the CV text.
Use empty strings for any missing field. Do NOT invent employers, dates, institutions or achievements.
experience.highlights should list key achievements per role when present.

${ANALYSIS_SCHEMA}

CV text:
${excerpt}`;
}

async function callGroq(apiKey: string, prompt: string): Promise<AiCvAnalysis> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You extract structured career data from CVs. Output JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    throw new Error(`Groq error: ${res.statusText}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const parsed = JSON.parse(data.choices[0]?.message?.content ?? "{}");
  return normalizeAiResult(parsed, "groq");
}

async function callGemini(apiKey: string, prompt: string): Promise<AiCvAnalysis> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini error: ${res.statusText}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  const parsed = JSON.parse(text);
  return normalizeAiResult(parsed, "gemini");
}

function normalizeAiResult(
  raw: Record<string, unknown>,
  provider: "groq" | "gemini"
): AiCvAnalysis {
  const validTracks: CareerTrack[] = [
    "frontend",
    "backend",
    "fullstack",
    "devops",
    "mobile",
    "data",
    "general",
  ];

  const primaryTrack = validTracks.includes(raw.primaryTrack as CareerTrack)
    ? (raw.primaryTrack as CareerTrack)
    : "general";

  return {
    provider,
    primaryTrack,
    secondaryTracks: (Array.isArray(raw.secondaryTracks)
      ? raw.secondaryTracks
      : []
    ).filter((t): t is CareerTrack =>
      validTracks.includes(t as CareerTrack)
    ),
    yearsExperience:
      typeof raw.yearsExperience === "number" ? raw.yearsExperience : null,
    claimedSkills: Array.isArray(raw.claimedSkills)
      ? (raw.claimedSkills as string[])
      : [],
    skillConfidence: (raw.skillConfidence ?? {}) as Record<
      string,
      SkillConfidence
    >,
    questionSeeds: Array.isArray(raw.questionSeeds)
      ? (raw.questionSeeds as string[])
      : [],
    imposterNote:
      typeof raw.imposterNote === "string" ? raw.imposterNote : undefined,
    analyzedAt: new Date().toISOString(),
    profileExtraction: normalizeProfileExtraction(raw),
  };
}

function normalizeProfileExtraction(
  raw: Record<string, unknown>
): CvProfileExtraction {
  const profileRaw = (raw.profile ?? {}) as Record<string, unknown>;

  const profile: UserProfile = {
    fullName: str(profileRaw.fullName),
    targetRole: str(profileRaw.targetRole),
    email: str(profileRaw.email),
    phone: "",
    mobile: str(profileRaw.mobile),
    languages: str(profileRaw.languages),
    location: str(profileRaw.location),
    linkedinUrl: str(profileRaw.linkedinUrl),
    website: str(profileRaw.website),
    githubUrl: str(profileRaw.githubUrl),
    extraLink: str(profileRaw.extraLink),
    salaryRange: str(profileRaw.salaryRange),
    additionalInfo: str(profileRaw.additionalInfo),
  };

  const experience: CvExperience[] = Array.isArray(raw.experience)
    ? (raw.experience as Record<string, unknown>[]).map((exp) => ({
        role: str(exp.role),
        company: str(exp.company),
        period: str(exp.period),
        location: str(exp.location),
        highlights: Array.isArray(exp.highlights)
          ? (exp.highlights as unknown[]).map((h) => str(h)).filter(Boolean)
          : [],
      }))
    : [];

  const skills = Array.isArray(raw.skills)
    ? (raw.skills as unknown[]).map((s) => str(s)).filter(Boolean)
    : [];

  return normalizeCvProfileExtraction({
    profile: { ...EMPTY_PROFILE, ...profile },
    summary: str(raw.summary),
    experience,
    education: raw.education,
    skills,
  });
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Merges AI analysis seeds into parsed CV signals for question engine.
 */
export function mergeAiIntoParsedSignals(
  signals: string[],
  ai: AiCvAnalysis
): string[] {
  return [...new Set([...signals, ...ai.questionSeeds.map((s) => s.toLowerCase())])];
}
