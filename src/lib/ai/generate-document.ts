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

interface GenerateDocumentInput {
  type: "cv" | "cover_letter";
  job: Pick<Job, "title" | "company" | "description" | "summary" | "salary">;
  instructions: string;
  photoUrl?: string | null;
  profile: UserProfile;
  templateId?: string;
  documentLanguage?: DocumentLanguage;
}

/**
 * Generates structured CV or cover letter JSON for template rendering.
 */
export async function generateDocument(
  input: GenerateDocumentInput
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const lang = input.documentLanguage ?? "en";

  if (apiKey) {
    return generateWithOpenAI({ ...input, documentLanguage: lang }, apiKey);
  }

  return input.type === "cv"
    ? serializeCvContent(buildCvTemplate({ ...input, documentLanguage: lang }))
    : serializeCoverLetterContent(
        buildCoverTemplate({ ...input, documentLanguage: lang })
      );
}

function buildCvTemplate(input: GenerateDocumentInput): CvDocument {
  const { job, profile, instructions } = input;
  const es = input.documentLanguage === "es";
  const name = profile.fullName || (es ? "Tu nombre" : "Your Name");
  const role = profile.targetRole || job.title;
  const expectedSalary =
    profile.salaryRange || job.salary || (es ? "A convenir" : "Open to discussion");

  return {
    version: 1,
    templateId: input.templateId ?? DEFAULT_CV_TEMPLATE,
    summary: es
      ? `${name} es ${role} y candidata a ${job.company}. ${job.summary ?? ""} ${instructions.slice(0, 200)}`.trim()
      : `${name} is a ${role} applying to ${job.company}. ${job.summary ?? ""} ${instructions.slice(0, 200)}`.trim(),
    experience: [
      {
        role: role,
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
    ],
    skills: extractSkills(job.description),
    education: profile.additionalInfo.includes("education")
      ? profile.additionalInfo
      : es
        ? "Grado universitario o experiencia equivalente"
        : "Bachelor's degree or equivalent experience",
    jobHighlights: es
      ? [
          `Interés en ${job.title} en ${job.company}`,
          `Rango salarial: ${expectedSalary}`,
          ...extractSkills(job.description)
            .slice(0, 4)
            .map((s) => `Experiencia sólida en ${s}`),
        ]
      : [
          `Targeting ${job.title} at ${job.company}`,
          `Salary range: ${expectedSalary}`,
          ...extractSkills(job.description)
            .slice(0, 4)
            .map((s) => `Strong ${s} experience`),
        ],
  };
}

function buildCoverTemplate(input: GenerateDocumentInput): CoverLetterDocument {
  const { job, profile, instructions } = input;
  const es = input.documentLanguage === "es";
  const name = profile.fullName || (es ? "Tu nombre" : "Your Name");
  const locale = es ? "es-ES" : "en-GB";

  return {
    version: 1,
    templateId: input.templateId ?? DEFAULT_COVER_TEMPLATE,
    date: new Date().toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    greeting: es ? "Estimado equipo de selección," : "Dear Hiring Manager,",
    paragraphs: es
      ? [
          `Me dirijo a ustedes para expresar mi interés en el puesto de ${job.title} en ${job.company}. Como ${profile.targetRole || "profesional"} con experiencia relevante, confío en poder aportar valor al equipo.`,
          job.summary
            ? `Según mi investigación, ${job.summary}`
            : "La descripción del puesto encaja con mi trayectoria y objetivos profesionales.",
          `Me encantaría conversar sobre cómo mis habilidades encajan con sus necesidades. ${instructions.slice(0, 150)}`,
        ]
      : [
          `I am writing to express my interest in the ${job.title} position at ${job.company}. As a ${profile.targetRole || "professional"} with experience relevant to your requirements, I am confident I can contribute effectively to your team.`,
          job.summary
            ? `From my research, ${job.summary}`
            : `Your job description resonates with my background and career goals.`,
          `I would welcome the opportunity to discuss how my skills align with your needs. ${instructions.slice(0, 150)}`,
        ],
    closing: es ? `Atentamente,\n${name}` : `Sincerely,\n${name}`,
  };
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

async function generateWithOpenAI(
  input: GenerateDocumentInput,
  apiKey: string
): Promise<string> {
  const isCv = input.type === "cv";
  const lang = input.documentLanguage ?? "en";
  const langLabel = lang === "es" ? "Spanish" : "English";
  const templateId =
    input.templateId ??
    (isCv ? DEFAULT_CV_TEMPLATE : DEFAULT_COVER_TEMPLATE);

  const systemPrompt = isCv
    ? `You generate CV content as JSON only. Write ALL text fields in ${langLabel}. Schema: {"version":1,"templateId":"${templateId}","summary":"string","experience":[{"role":"","company":"","period":"","highlights":[""]}],"skills":[""],"education":"string","jobHighlights":[""]}. No markdown, no code fences.`
    : `You generate cover letter content as JSON only. Write ALL text fields in ${langLabel}. Schema: {"version":1,"templateId":"${templateId}","date":"string","greeting":"string","paragraphs":[""],"closing":"string"}. No markdown, no code fences.`;

  const photoNote = input.photoUrl
    ? `Include photo reference in summary if relevant: ${input.photoUrl}`
    : "No photo for this document.";

  const profileBlock = formatProfileForPrompt(input.profile);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Output language: ${langLabel}

${profileBlock}

Job: ${input.job.title} at ${input.job.company}
Salary: ${input.job.salary ?? "N/A"}
Summary: ${input.job.summary ?? ""}
Description: ${input.job.description}
Instructions: ${input.instructions}
${photoNote}`,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };

  const raw = data.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as CvDocument | CoverLetterDocument;
  parsed.templateId = templateId;

  return isCv
    ? serializeCvContent(parsed as CvDocument)
    : serializeCoverLetterContent(parsed as CoverLetterDocument);
}
