import type { Job } from "@/types/database";
import type {
  CoverLetterDocument,
  CvExperience,
  DocumentLanguage,
  UserProfile,
} from "@/types/documents";
import { DEFAULT_COVER_TEMPLATE } from "@/types/documents";
import type { CvProfileExtraction } from "@/types/skills";

interface BuildCoverInput {
  job: Pick<Job, "title" | "company" | "description" | "summary" | "requirements">;
  profile: UserProfile;
  cvExtraction?: CvProfileExtraction | null;
  templateId?: string;
  documentLanguage?: DocumentLanguage;
}

const JOB_SKILL_KEYWORDS = [
  "React",
  "TypeScript",
  "JavaScript",
  "Next.js",
  "Node.js",
  "Python",
  "AI",
  "LLM",
  "Chatbot",
  "Agentic",
  "OpenAI",
  "LangChain",
  "CSS",
  "HTML",
  "Git",
  "AWS",
  "Tailwind",
  "Vue",
  "Angular",
  "Docker",
  "Kubernetes",
  "GraphQL",
  "REST",
  "Agile",
  "Scrum",
];

/**
 * Builds a tailored cover letter from real CV extraction data (no AI).
 */
export function buildCoverFromExtraction(input: BuildCoverInput): CoverLetterDocument {
  const es = input.documentLanguage === "es";
  const locale = es ? "es-ES" : "en-GB";
  const name = input.profile.fullName || (es ? "Tu nombre" : "Your Name");
  const role = input.profile.targetRole || (es ? "profesional" : "professional");
  const { job, cvExtraction } = input;

  const jobText = [job.title, job.description, job.requirements, job.summary]
    .filter(Boolean)
    .join(" ");
  const matchingSkills = findMatchingSkills(cvExtraction?.skills ?? [], jobText);
  const recentRoles = cvExtraction?.experience?.slice(0, 2) ?? [];
  const summary = cvExtraction?.summary?.trim();

  const paragraphs = es
    ? buildSpanishParagraphs({ job, role, summary, recentRoles, matchingSkills })
    : buildEnglishParagraphs({ job, role, summary, recentRoles, matchingSkills });

  return {
    version: 1,
    templateId: input.templateId ?? DEFAULT_COVER_TEMPLATE,
    date: new Date().toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    greeting: es ? "Estimado equipo de selección," : "Dear Hiring Manager,",
    paragraphs,
    closing: es ? `Atentamente,\n${name}` : `Sincerely,\n${name}`,
  };
}

function buildSpanishParagraphs(ctx: ParagraphContext): string[] {
  const { job, role, summary, recentRoles, matchingSkills } = ctx;

  const intro = summary
    ? `Me dirijo a ustedes para presentar mi candidatura al puesto de ${job.title} en ${job.company}. ${summary}`
    : `Me dirijo a ustedes para expresar mi interés en el puesto de ${job.title} en ${job.company}. Como ${role}, cuento con experiencia directamente alineada con los requisitos de la oferta.`;

  const experiencePara = buildExperienceParagraph(recentRoles, true);
  const skillsPara = buildSkillsParagraph(job, matchingSkills, true);
  const motivationPara = job.summary
    ? `La oportunidad en ${job.company} me resulta especialmente atractiva: ${job.summary} Estoy convencida de que mi perfil encaja con lo que buscan para este rol.`
    : `Estoy especialmente motivada por la oportunidad de aportar mi experiencia en ${job.company}, donde el rol de ${job.title} encaja con mi trayectoria y con los retos técnicos que me interesan.`;

  const closing =
    "Quedo a su disposición para ampliar cualquier aspecto de mi candidatura en una entrevista. Gracias por su tiempo y consideración.";

  return [intro, experiencePara, skillsPara, motivationPara, closing].filter(Boolean);
}

function buildEnglishParagraphs(ctx: ParagraphContext): string[] {
  const { job, role, summary, recentRoles, matchingSkills } = ctx;

  const intro = summary
    ? `I am writing to apply for the ${job.title} position at ${job.company}. ${summary}`
    : `I am writing to express my interest in the ${job.title} position at ${job.company}. As a ${role}, I bring experience that aligns closely with your requirements.`;

  const experiencePara = buildExperienceParagraph(recentRoles, false);
  const skillsPara = buildSkillsParagraph(job, matchingSkills, false);
  const motivationPara = job.summary
    ? `The opportunity at ${job.company} is particularly appealing: ${job.summary} I am confident my profile matches what you are looking for in this role.`
    : `I am especially motivated by the chance to contribute at ${job.company}, where the ${job.title} role fits my background and the technical challenges I am most interested in.`;

  const closing =
    "I would welcome the opportunity to discuss my application further in an interview. Thank you for your time and consideration.";

  return [intro, experiencePara, skillsPara, motivationPara, closing].filter(Boolean);
}

interface ParagraphContext {
  job: Pick<Job, "title" | "company" | "summary">;
  role: string;
  summary?: string;
  recentRoles: CvExperience[];
  matchingSkills: string[];
}

function buildExperienceParagraph(roles: CvExperience[], es: boolean): string {
  if (roles.length === 0) {
    return es
      ? "En mis posiciones recientes he trabajado en entornos de producto digital, entregando funcionalidades de alto impacto y colaborando con equipos multidisciplinares."
      : "In my recent roles I have worked in digital product environments, delivering high-impact features and collaborating with cross-functional teams.";
  }

  const mentions = roles.map((exp) => formatRoleMention(exp, es)).filter(Boolean);
  const prefix = es
    ? "En mi trayectoria profesional destaca "
    : "My professional background includes ";

  return `${prefix}${mentions.join(es ? "; además, " : "; additionally, ")}.`;
}

function formatRoleMention(exp: CvExperience, es: boolean): string {
  const place = [exp.role, exp.company].filter(Boolean).join(es ? " en " : " at ");
  const period = exp.period ? ` (${exp.period})` : "";
  const highlights = exp.highlights.slice(0, 2);

  if (highlights.length > 0) {
    const joined = highlights.join(es ? "; " : "; ");
    return es
      ? `${place}${period}, donde ${joined.charAt(0).toLowerCase()}${joined.slice(1)}`
      : `${place}${period}, where I ${joined.charAt(0).toLowerCase()}${joined.slice(1)}`;
  }

  return `${place}${period}`;
}

function buildSkillsParagraph(
  job: Pick<Job, "title" | "company">,
  matchingSkills: string[],
  es: boolean
): string {
  if (matchingSkills.length > 0) {
    const list = matchingSkills.slice(0, 5).join(", ");
    return es
      ? `Para el puesto de ${job.title}, puedo aportar experiencia demostrada en ${list}, competencias que considero clave para el éxito en ${job.company}.`
      : `For the ${job.title} role, I bring demonstrated experience in ${list} — skills I see as central to succeeding at ${job.company}.`;
  }

  return es
    ? `Mi perfil técnico y mi experiencia en producto me permiten adaptarme con rapidez a los requisitos específicos de ${job.title} en ${job.company}.`
    : `My technical profile and product experience allow me to adapt quickly to the specific requirements of ${job.title} at ${job.company}.`;
}

function findMatchingSkills(candidateSkills: string[], jobText: string): string[] {
  const lower = jobText.toLowerCase();
  const fromCv = candidateSkills.filter((s) => lower.includes(s.toLowerCase()));

  const fromJob = JOB_SKILL_KEYWORDS.filter((k) => lower.includes(k.toLowerCase()));

  return [...new Set([...fromCv, ...fromJob])].slice(0, 6);
}

/**
 * Returns user-facing generation guidelines separate from CV background content.
 */
export function formatCoverGuidelinesForPrompt(instructions: string): string {
  const trimmed = instructions.trim();
  if (!trimmed) {
    return "Tailor the letter to the job. Use 4-5 paragraphs. Reference specific roles and achievements from CV data.";
  }

  return `Generation guidelines (do NOT copy into letter paragraphs):\n${trimmed}`;
}
