import type { Job } from "@/types/database";
import type {
  CvDocument,
  CoverLetterDocument,
  DocumentLanguage,
  UserProfile,
} from "@/types/documents";
import {
  DEFAULT_CV_TEMPLATE,
  DEFAULT_COVER_TEMPLATE,
} from "@/types/documents";
import {
  serializeCvContent,
  serializeCoverLetterContent,
} from "@/lib/documents/parse-content";
import { formatProfileForPrompt } from "@/lib/documents/profile";
import {
  buildCoverFromExtraction,
  formatCoverGuidelinesForPrompt,
} from "@/lib/documents/build-cover-content";
import type { CvProfileExtraction } from "@/types/skills";

interface GenerateDocumentInput {
  type: "cv" | "cover_letter";
  job: Pick<
    Job,
    | "title"
    | "company"
    | "description"
    | "summary"
    | "salary"
    | "url"
    | "source"
    | "requirements"
  >;
  instructions: string;
  photoUrl?: string | null;
  profile: UserProfile;
  templateId?: string;
  documentLanguage?: DocumentLanguage;
  cvExtraction?: CvProfileExtraction | null;
}

/**
 * Generates structured CV or cover letter JSON for template rendering.
 */
export async function generateDocument(
  input: GenerateDocumentInput
): Promise<string> {
  const lang = input.documentLanguage ?? "en";

  const aiContent = await generateWithAi({ ...input, documentLanguage: lang });
  if (aiContent) return aiContent;

  return input.type === "cv"
    ? serializeCvContent(buildCvTemplate({ ...input, documentLanguage: lang }))
    : serializeCoverLetterContent(
        buildCoverFromExtraction({ ...input, documentLanguage: lang })
      );
}

function buildCvTemplate(input: GenerateDocumentInput): CvDocument {
  const { job, profile, cvExtraction } = input;
  const es = input.documentLanguage === "es";
  const name = profile.fullName || (es ? "Tu nombre" : "Your Name");
  const role = profile.targetRole || job.title;
  const expectedSalary =
    profile.salaryRange || job.salary || (es ? "A convenir" : "Open to discussion");

  const jobSkills = extractSkills(job.description);
  const skills =
    cvExtraction?.skills?.length
      ? [...new Set([...cvExtraction.skills, ...jobSkills])]
      : jobSkills.length > 0
        ? jobSkills
        : cvExtraction?.skills ?? [];

  const summary = cvExtraction?.summary
    ? es
      ? `${cvExtraction.summary} Candidatura para ${job.title} en ${job.company}.`
      : `${cvExtraction.summary} Applying for ${job.title} at ${job.company}.`
    : es
      ? `${name} es ${role} y candidata a ${job.title} en ${job.company}.`
      : `${name} is a ${role} applying for ${job.title} at ${job.company}.`;

  const experience =
    cvExtraction?.experience?.length
      ? cvExtraction.experience
      : [
          {
            role,
            company: es ? "Empresa anterior" : "Previous Company",
            period: "2021 — Present",
            highlights: es
              ? [
                  "Entregué funcionalidades alineadas con los requisitos del puesto",
                  "Colaboré con equipos multidisciplinares",
                  "Apliqué habilidades relevantes para este rol",
                ]
              : [
                  "Delivered features aligned with job requirements",
                  "Collaborated with cross-functional teams",
                  "Applied skills relevant to this role",
                ],
          },
        ];

  const education =
    cvExtraction?.education ||
    profile.additionalInfo ||
    (es
      ? "Grado universitario o experiencia equivalente"
      : "Bachelor's degree or equivalent experience");

  return {
    version: 1,
    templateId: input.templateId ?? DEFAULT_CV_TEMPLATE,
    summary,
    experience,
    skills,
    education,
    jobHighlights: es
      ? [
          `Interés en ${job.title} en ${job.company}`,
          `Rango salarial: ${expectedSalary}`,
          ...skills
            .slice(0, 4)
            .map((s) => `Experiencia sólida en ${s}`),
        ]
      : [
          `Targeting ${job.title} at ${job.company}`,
          `Salary range: ${expectedSalary}`,
          ...skills.slice(0, 4).map((s) => `Strong ${s} experience`),
        ],
  };
}

function formatJobContext(job: GenerateDocumentInput["job"]): string {
  const lines = [
    `Job: ${job.title} at ${job.company}`,
    `Salary: ${job.salary ?? "N/A"}`,
    `Source: ${job.source ?? "unknown"}`,
    `Posting URL: ${job.url ?? "N/A"}`,
    `Summary: ${job.summary ?? ""}`,
    `Requirements: ${job.requirements ?? ""}`,
    `Description: ${job.description}`,
  ];
  return lines.join("\n");
}

function extractSkills(description: string): string[] {
  const keywords = [
    "React",
    "TypeScript",
    "JavaScript",
    "Next.js",
    "Node.js",
    "CSS",
    "HTML",
    "Git",
    "AWS",
    "Python",
    "Tailwind",
  ];
  return keywords.filter((k) =>
    description.toLowerCase().includes(k.toLowerCase())
  );
}

function formatCvExtractionForPrompt(
  extraction: CvProfileExtraction | null | undefined
): string {
  if (!extraction) return "";

  const lines: string[] = [
    "REAL CV DATA — use these facts exactly. Do NOT invent employers, dates, or roles.",
  ];

  if (extraction.summary) {
    lines.push(`\nProfessional summary:\n${extraction.summary}`);
  }

  if (extraction.experience.length > 0) {
    lines.push("\nWork experience:");
    for (const exp of extraction.experience) {
      const header = [exp.role, exp.company, exp.period].filter(Boolean).join(" — ");
      lines.push(`- ${header}`);
      for (const h of exp.highlights) {
        lines.push(`  • ${h}`);
      }
    }
  }

  if (extraction.skills.length > 0) {
    lines.push(`\nSkills: ${extraction.skills.join(", ")}`);
  }

  if (extraction.education) {
    lines.push(`\nEducation:\n${extraction.education}`);
  }

  return lines.join("\n");
}

async function generateWithAi(
  input: GenerateDocumentInput
): Promise<string | null> {
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    return generateWithOpenAI(input, openAiKey);
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      return await generateWithGroq(input, groqKey);
    } catch (err) {
      console.error("Groq document generation failed:", err);
    }
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      return await generateWithGemini(input, geminiKey);
    } catch (err) {
      console.error("Gemini document generation failed:", err);
    }
  }

  return null;
}

async function generateWithGroq(
  input: GenerateDocumentInput,
  apiKey: string
): Promise<string> {
  const payload = buildAiMessages(input);
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: payload.messages,
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    throw new Error(`Groq API error: ${res.statusText}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };

  return serializeAiOutput(input, data.choices[0]?.message?.content ?? "{}");
}

async function generateWithGemini(
  input: GenerateDocumentInput,
  apiKey: string
): Promise<string> {
  const payload = buildAiMessages(input);
  const prompt = payload.messages
    .map((m) => `${m.role.toUpperCase()}:\n${m.content}`)
    .join("\n\n");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.statusText}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  return serializeAiOutput(input, raw);
}

function buildAiMessages(input: GenerateDocumentInput): {
  messages: { role: "system" | "user"; content: string }[];
} {
  const isCv = input.type === "cv";
  const lang = input.documentLanguage ?? "en";
  const langLabel = lang === "es" ? "Spanish" : "English";
  const templateId =
    input.templateId ??
    (isCv ? DEFAULT_CV_TEMPLATE : DEFAULT_COVER_TEMPLATE);

  const systemPrompt = isCv
    ? `You generate CV content as JSON only. Write ALL text fields in ${langLabel}. Use ONLY the candidate's real experience, education and skills from the provided CV data — never invent employers or dates. Schema: {"version":1,"templateId":"${templateId}","summary":"string","experience":[{"role":"","company":"","period":"","highlights":[""]}],"skills":[""],"education":"string","jobHighlights":[""]}. No markdown, no code fences.`
    : `You generate tailored cover letter content as JSON only. Write ALL text fields in ${langLabel}.
Rules:
- Write 4-5 substantive paragraphs in the "paragraphs" array.
- Reference specific employers, roles, dates and achievements from the candidate's REAL CV DATA.
- Connect the candidate's skills and experience to the job requirements.
- Explain genuine motivation for this company and role.
- NEVER copy "Generation guidelines" or instruction text into paragraphs — those are meta-instructions only.
- Do not invent employers, dates or achievements not present in the CV data.
Schema: {"version":1,"templateId":"${templateId}","date":"string","greeting":"string","paragraphs":[""],"closing":"string"}. No markdown, no code fences.`;

  const photoNote = input.photoUrl
    ? `Include photo reference in summary if relevant: ${input.photoUrl}`
    : "No photo for this document.";

  const profileBlock = formatProfileForPrompt(input.profile);
  const cvDataBlock = formatCvExtractionForPrompt(input.cvExtraction);
  const guidelines = formatCoverGuidelinesForPrompt(input.instructions);

  return {
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Output language: ${langLabel}

${profileBlock}
${cvDataBlock}

${formatJobContext(input.job)}
${isCv ? `Instructions: ${input.instructions}` : guidelines}
${photoNote}`,
      },
    ],
  };
}

function serializeAiOutput(
  input: GenerateDocumentInput,
  raw: string
): string {
  const isCv = input.type === "cv";
  const templateId =
    input.templateId ??
    (isCv ? DEFAULT_CV_TEMPLATE : DEFAULT_COVER_TEMPLATE);

  const parsed = JSON.parse(raw) as CvDocument | CoverLetterDocument;
  parsed.templateId = templateId;

  return isCv
    ? serializeCvContent(parsed as CvDocument)
    : serializeCoverLetterContent(parsed as CoverLetterDocument);
}

async function generateWithOpenAI(
  input: GenerateDocumentInput,
  apiKey: string
): Promise<string> {
  const payload = buildAiMessages(input);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: payload.messages,
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };

  return serializeAiOutput(
    input,
    data.choices[0]?.message?.content ?? "{}"
  );
}
