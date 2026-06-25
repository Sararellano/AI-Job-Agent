import { sanitizeText } from "@/lib/security/validation";
import {
  MAX_JOB_COMPANY_LENGTH,
  MAX_JOB_DESCRIPTION_LENGTH,
  MAX_JOB_REQUIREMENTS_LENGTH,
  MAX_JOB_SUMMARY_LENGTH,
  MAX_JOB_TITLE_LENGTH,
} from "@/lib/security/validation";
import { htmlToPlainText } from "./fetch-job-page";

export interface ScrapedJobDraft {
  title: string;
  company: string;
  description: string;
  summary: string;
  requirements: string;
  salary: string;
}

const SCHEMA = `{
  "title": "string",
  "company": "string",
  "description": "full job description",
  "summary": "one sentence summary",
  "requirements": "bullet requirements as text",
  "salary": "salary if mentioned or empty string"
}`;

/**
 * Parses job posting HTML/text with Groq or Gemini.
 */
export async function parseJobWithAi(
  html: string,
  sourceUrl: string
): Promise<ScrapedJobDraft | null> {
  const plain = htmlToPlainText(html);
  if (plain.length < 100) return null;

  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const prompt = buildPrompt(plain, sourceUrl);

  if (groqKey) {
    try {
      return await callGroq(groqKey, prompt);
    } catch (err) {
      console.error("Groq job parse failed:", err);
    }
  }

  if (geminiKey) {
    try {
      return await callGemini(geminiKey, prompt);
    } catch (err) {
      console.error("Gemini job parse failed:", err);
    }
  }

  return null;
}

function buildPrompt(text: string, url: string): string {
  return `Extract job posting fields from this page text. URL: ${url}
Return ONLY valid JSON:
${SCHEMA}

Page text:
${text}`;
}

async function callGroq(apiKey: string, prompt: string): Promise<ScrapedJobDraft> {
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
          content: "You extract structured job posting data. Output JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) throw new Error(`Groq error: ${res.statusText}`);

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return normalizeDraft(JSON.parse(data.choices[0]?.message?.content ?? "{}"));
}

async function callGemini(apiKey: string, prompt: string): Promise<ScrapedJobDraft> {
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

  if (!res.ok) throw new Error(`Gemini error: ${res.statusText}`);

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  return normalizeDraft(JSON.parse(text));
}

function normalizeDraft(raw: Record<string, unknown>): ScrapedJobDraft {
  return {
    title: sanitizeText(String(raw.title ?? ""), MAX_JOB_TITLE_LENGTH),
    company: sanitizeText(String(raw.company ?? ""), MAX_JOB_COMPANY_LENGTH),
    description: sanitizeText(
      String(raw.description ?? ""),
      MAX_JOB_DESCRIPTION_LENGTH
    ),
    summary: sanitizeText(String(raw.summary ?? ""), MAX_JOB_SUMMARY_LENGTH),
    requirements: sanitizeText(
      String(raw.requirements ?? ""),
      MAX_JOB_REQUIREMENTS_LENGTH
    ),
    salary: sanitizeText(String(raw.salary ?? ""), 100),
  };
}
