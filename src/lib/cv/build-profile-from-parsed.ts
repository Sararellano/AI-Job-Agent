import type {
  CvEducation,
  CvExperience,
  UserProfile,
} from "@/types/documents";
import {
  EMPTY_CV_EDUCATION,
  EMPTY_CV_EXPERIENCE,
  EMPTY_PROFILE,
} from "@/types/documents";
import type { CvProfileExtraction, ParsedCvLocal } from "@/types/skills";

/**
 * Heuristic contact and profile extraction from raw CV text (no AI).
 */
export function buildProfileFromHeuristics(
  rawText: string,
  parsed: ParsedCvLocal
): Partial<UserProfile> {
  const lines = rawText
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const profile: Partial<UserProfile> = {};

  if (parsed.emails[0]) profile.email = parsed.emails[0];

  const phone = extractPhone(rawText);
  if (phone) profile.mobile = phone;

  const linkedin = extractUrl(rawText, /linkedin\.com\/in\/[\w-]+/i);
  if (linkedin) profile.linkedinUrl = linkedin;

  const github = extractUrl(rawText, /github\.com\/[\w-]+/i);
  if (github) profile.githubUrl = github;

  const website = extractWebsite(rawText, linkedin, github);
  if (website) profile.website = website;

  const name = extractLikelyName(lines);
  if (name) profile.fullName = name;

  const targetRole = parsed.roles[0]?.title ?? extractTargetRole(lines);
  if (targetRole) profile.targetRole = targetRole;

  const location = extractLabeledValue(rawText, /(?:location|ubicación|ciudad|city)[:\s]+(.+)/i);
  if (location) profile.location = location;

  const languages = extractLabeledValue(
    rawText,
    /(?:languages?|idiomas?)[:\s]+(.+)/i
  );
  if (languages) profile.languages = languages;

  return profile;
}

/**
 * Builds default CV/cover instructions from structured extraction.
 */
export function buildInstructionsFromExtraction(
  extraction: CvProfileExtraction
): { cvInstructions: string; coverInstructions: string } {
  const cvInstructions = formatCvInstructions(extraction);
  const coverInstructions = formatCoverInstructions(extraction);
  return { cvInstructions, coverInstructions };
}

export function mergeExtractedProfile(
  existing: UserProfile,
  extracted: Partial<UserProfile>
): UserProfile {
  const merged = { ...existing };
  for (const key of Object.keys(extracted) as (keyof UserProfile)[]) {
    const value = extracted[key]?.trim();
    if (value) merged[key] = value;
  }
  return merged;
}

export function buildHeuristicExtraction(
  rawText: string,
  parsed: ParsedCvLocal
): CvProfileExtraction {
  const profile = { ...EMPTY_PROFILE, ...buildProfileFromHeuristics(rawText, parsed) };
  const experience =
    parsed.roles.length > 0
      ? parsed.roles.map((role) => ({
          role: role.title,
          company: role.company ?? "",
          period: role.period ?? "",
          location: "",
          highlights: [] as string[],
        }))
      : extractExperienceLines(rawText);

  const education = extractEducationEntries(rawText);

  return {
    profile,
    summary: extractSummarySection(rawText),
    experience: experience.length > 0 ? experience : [EMPTY_CV_EXPERIENCE],
    education: education.length > 0 ? education : [EMPTY_CV_EDUCATION],
    skills: parsed.detectedSkills,
  };
}

function formatCvInstructions(extraction: CvProfileExtraction): string {
  const sections: string[] = [
    "Use the following real CV data when generating documents. Keep facts accurate.",
  ];

  if (extraction.summary) {
    sections.push(`\nProfessional summary:\n${extraction.summary}`);
  }

  if (extraction.experience.some((e) => e.role || e.company)) {
    sections.push("\nWork experience:");
    for (const exp of extraction.experience) {
      if (!exp.role && !exp.company) continue;
      const header = [exp.role, exp.company, exp.period, exp.location]
        .filter(Boolean)
        .join(" — ");
      sections.push(`- ${header}`);
      for (const h of exp.highlights) {
        sections.push(`  • ${h}`);
      }
    }
  }

  if (extraction.skills.length > 0) {
    sections.push(`\nSkills: ${extraction.skills.join(", ")}`);
  }

  if (extraction.education.some((e) => e.degree || e.institution)) {
    sections.push("\nEducation:");
    for (const edu of extraction.education) {
      if (!edu.degree && !edu.institution) continue;
      const line = [edu.degree, edu.institution, edu.period, edu.location]
        .filter(Boolean)
        .join(" — ");
      sections.push(`- ${line}`);
    }
  }

  return sections.join("\n").trim();
}

function formatCoverInstructions(extraction: CvProfileExtraction): string {
  const role = extraction.profile.targetRole || "professional";
  const sections: string[] = [
    "Write a one-page formal cover letter tailored to the job.",
    "Address the hiring manager. Use the candidate's real background — do not invent employers or dates.",
    "Reference specific roles, companies and achievements from the background below.",
  ];

  if (extraction.summary) {
    sections.push(`\nProfessional summary:\n${extraction.summary}`);
  }

  if (extraction.experience.some((e) => e.role || e.company)) {
    sections.push("\nKey experience to reference:");
    for (const exp of extraction.experience.slice(0, 3)) {
      if (!exp.role && !exp.company) continue;
      const header = [exp.role, exp.company, exp.period, exp.location]
        .filter(Boolean)
        .join(" — ");
      sections.push(`- ${header}`);
      for (const h of exp.highlights.slice(0, 2)) {
        sections.push(`  • ${h}`);
      }
    }
  }

  if (extraction.skills.length > 0) {
    sections.push(`\nRelevant skills: ${extraction.skills.slice(0, 12).join(", ")}`);
  }

  if (!extraction.summary && !extraction.experience.some((e) => e.role || e.company)) {
    sections.push(`\nHighlight relevant experience as a ${role}.`);
  }

  return sections.join("\n").trim();
}

function extractPhone(text: string): string | null {
  const match = text.match(
    /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}(?:[\s.-]?\d{2,4})?/
  );
  return match?.[0]?.trim() ?? null;
}

function extractUrl(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  if (!match) return null;
  const url = match[0];
  return url.startsWith("http") ? url : `https://${url}`;
}

function extractWebsite(
  text: string,
  linkedin?: string | null,
  github?: string | null
): string | null {
  const urls = text.match(/https?:\/\/[^\s)]+/gi) ?? [];
  for (const url of urls) {
    const lower = url.toLowerCase();
    if (lower.includes("linkedin.com")) continue;
    if (lower.includes("github.com")) continue;
    if (linkedin && url.includes(linkedin)) continue;
    if (github && url.includes(github)) continue;
    return url.replace(/[.,;]+$/, "");
  }
  return null;
}

function extractLikelyName(lines: string[]): string | null {
  for (const line of lines.slice(0, 5)) {
    if (line.length > 3 && line.length < 60 && /^[A-ZÀ-ÿ][\wÀ-ÿ.' -]+$/.test(line)) {
      if (!/@|http|linkedin|github|curriculum|resume|cv\b/i.test(line)) {
        return line;
      }
    }
  }
  return null;
}

function extractTargetRole(lines: string[]): string | null {
  const rolePattern =
    /(senior |lead |junior |mid )?(developer|engineer|programmer|architect|designer|analyst)/i;
  for (const line of lines.slice(0, 15)) {
    if (rolePattern.test(line) && line.length < 80) return line;
  }
  return null;
}

function extractLabeledValue(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  return match?.[1]?.trim().slice(0, 200) ?? null;
}

function extractEducationSectionText(text: string): string {
  const sectionMatch = text.match(
    /(?:education|formación|estudios|academic|educación)[:\s]*\n([\s\S]{10,1200}?)(?:\n\n|\n(?:experience|experiencia|skills|habilidades|work|proyectos|projects)\b)/i
  );
  if (sectionMatch?.[1]?.trim()) return sectionMatch[1].trim();

  const inlineMatch = text.match(
    /(?:education|formación|estudios|educación)[:\s]+(.{10,400})/i
  );
  return inlineMatch?.[1]?.trim() ?? "";
}

function extractEducationEntries(text: string): CvEducation[] {
  const sectionText = extractEducationSectionText(text);
  if (!sectionText) return [];

  const lines = sectionText.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const entries: CvEducation[] = [];

  for (const line of lines) {
    const structured = parseEducationLine(line);
    if (structured.degree || structured.institution) {
      entries.push(structured);
    }
  }

  return entries.slice(0, 8);
}

function parseEducationLine(line: string): CvEducation {
  const dashMatch = line.match(
    /^(.+?)\s*[—–-]\s*(.+?)\s*[—–-]\s*((?:\d{4}|present|actual)[\s\S]{0,40})$/i
  );
  if (dashMatch) {
    return {
      degree: dashMatch[1].trim(),
      institution: dashMatch[2].trim(),
      period: dashMatch[3].trim(),
      location: "",
    };
  }

  const pipeMatch = line.match(
    /^(.+?)\s*\|\s*(.+?)\s*\|\s*((?:\d{4}|present|actual)[\s\S]{0,40})$/i
  );
  if (pipeMatch) {
    return {
      degree: pipeMatch[1].trim(),
      institution: pipeMatch[2].trim(),
      period: pipeMatch[3].trim(),
      location: "",
    };
  }

  return {
    degree: line,
    institution: "",
    period: "",
    location: "",
  };
}

function extractSummarySection(text: string): string {
  const sectionMatch = text.match(
    /(?:summary|resumen|profile|perfil|about|acerca|objetivo)[:\s]*\n([\s\S]{20,800}?)(?:\n\n|\n(?:experience|experiencia|education|formación|skills|habilidades)\b)/i
  );
  if (sectionMatch?.[1]?.trim()) return sectionMatch[1].trim();

  const inlineMatch = text.match(
    /(?:summary|resumen|perfil profesional)[:\s]+(.{20,600})/i
  );
  return inlineMatch?.[1]?.trim() ?? "";
}

function extractExperienceLines(text: string): CvExperience[] {
  const sectionMatch = text.match(
    /(?:experience|experiencia|work history|historial laboral|trayectoria)[:\s]*\n([\s\S]{20,4000}?)(?:\n\n|\n(?:education|formación|estudios|skills|habilidades|projects|proyectos)\b)/i
  );
  const sectionText = sectionMatch?.[1] ?? text;
  const lines = sectionText.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const experience: CvExperience[] = [];
  const dashPattern =
    /^(.+?)\s*(?:@|at|en)\s*(.+?)\s*[—–-]\s*(\d{4}[\s\S]{0,40})$/i;
  const dashPatternAlt =
    /^(.+?)\s*[—–-]\s*(.+?)\s*[—–-]\s*(\d{4}[\s\S]{0,40})$/;
  const dateRangePattern =
    /^(.+?)\s*\|\s*(.+?)\s*\|\s*((?:\d{4}|present|actual|actualidad)[\s\S]{0,40})$/i;

  let current: CvExperience | null = null;

  for (const line of lines) {
    const locationMatch = line.match(
      /^(?:location|ubicación|ciudad|city)[:\s]+(.+)/i
    );
    if (locationMatch && current) {
      current.location = locationMatch[1].trim();
      continue;
    }

    const dashMatch = line.match(dashPattern) ?? line.match(dashPatternAlt);
    const pipeMatch = line.match(dateRangePattern);

    if (dashMatch) {
      if (current) experience.push(current);
      current = {
        role: dashMatch[1].trim(),
        company: dashMatch[2].trim(),
        period: dashMatch[3].trim(),
        location: "",
        highlights: [],
      };
      if (experience.length >= 8) break;
      continue;
    }

    if (pipeMatch) {
      if (current) experience.push(current);
      current = {
        role: pipeMatch[1].trim(),
        company: pipeMatch[2].trim(),
        period: pipeMatch[3].trim(),
        location: "",
        highlights: [],
      };
      if (experience.length >= 8) break;
      continue;
    }

    if (/^\d{4}\s*[—–-]\s*(?:\d{4}|present|actual)/i.test(line) && current) {
      current.period = line;
      continue;
    }

    if (/^[-•*]\s+/.test(line) && current) {
      current.highlights.push(line.replace(/^[-•*]\s+/, "").trim());
      continue;
    }

    if (
      line.length > 4 &&
      line.length < 80 &&
      !/@|http/i.test(line) &&
      !current
    ) {
      current = {
        role: line,
        company: "",
        period: "",
        location: "",
        highlights: [],
      };
    }
  }

  if (current) experience.push(current);
  return experience.slice(0, 8);
}
