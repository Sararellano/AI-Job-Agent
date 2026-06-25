import type { CustomCvQuestion } from "@/types/skills";
import { truncateCvText } from "@/lib/cv/extract-text";
import type { AiCvAnalysis, ParsedCvLocal } from "@/types/skills";

const QUESTIONS_SCHEMA = `{
  "questions": [
    {
      "id": "snake_case_id",
      "text": "question text",
      "type": "yes_no|text",
      "category": "skill|experience|gap|merit"
    }
  ]
}`;

/**
 * Generates personalized CV follow-up questions using Groq or Gemini.
 */
export async function generateCvQuestions(
  parsed: ParsedCvLocal,
  aiAnalysis: AiCvAnalysis | null,
  rawText?: string
): Promise<CustomCvQuestion[]> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  const prompt = buildPrompt(parsed, aiAnalysis, rawText);

  if (groqKey) {
    try {
      return await callGroq(groqKey, prompt);
    } catch (err) {
      console.error("Groq CV questions failed:", err);
    }
  }

  if (geminiKey) {
    try {
      return await callGemini(geminiKey, prompt);
    } catch (err) {
      console.error("Gemini CV questions failed:", err);
    }
  }

  return [];
}

function buildPrompt(
  parsed: ParsedCvLocal,
  ai: AiCvAnalysis | null,
  rawText?: string
): string {
  const excerpt = rawText ? truncateCvText(rawText).slice(0, 4000) : "";
  return `Based on this CV analysis, generate 8-12 personalized follow-up questions to clarify gaps, ambiguous experience, or unproven skills.
Return ONLY valid JSON matching:
${QUESTIONS_SCHEMA}

Rules:
- Mix yes_no and text questions
- Reference specific items from the CV when possible
- Focus on skills mentioned without evidence, missing dates, career transitions
- Use snake_case ids, max 40 chars

Parsed CV:
${JSON.stringify(parsed, null, 0)}

AI analysis:
${ai ? JSON.stringify(ai, null, 0) : "none"}

CV excerpt:
${excerpt}`;
}

async function callGroq(apiKey: string, prompt: string): Promise<CustomCvQuestion[]> {
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
          content: "You generate CV follow-up questions. Output JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) throw new Error(`Groq error: ${res.statusText}`);

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const parsed = JSON.parse(data.choices[0]?.message?.content ?? "{}");
  return normalizeQuestions(parsed);
}

async function callGemini(apiKey: string, prompt: string): Promise<CustomCvQuestion[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
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
  return normalizeQuestions(JSON.parse(text));
}

function normalizeQuestions(raw: Record<string, unknown>): CustomCvQuestion[] {
  const list = Array.isArray(raw.questions) ? raw.questions : [];
  const validCategories = new Set(["skill", "experience", "gap", "merit"]);

  return list
    .slice(0, 15)
    .map((q: Record<string, unknown>, i: number) => {
      const id =
        typeof q.id === "string" && /^[a-z][\w-]*$/i.test(q.id)
          ? q.id.slice(0, 40)
          : `q_${i + 1}`;
      const type: CustomCvQuestion["type"] = q.type === "text" ? "text" : "yes_no";
      const category = validCategories.has(String(q.category))
        ? (q.category as CustomCvQuestion["category"])
        : "gap";
      return {
        id,
        text: String(q.text ?? "").slice(0, 300),
        type,
        category,
      } satisfies CustomCvQuestion;
    })
    .filter((q) => q.text.length > 5);
}
