import type { CvProfileExtraction } from "@/types/skills";
import { normalizeCvProfileExtraction } from "@/lib/cv/normalize-extraction";
import {
  sanitizeText,
  MAX_PROFILE_FIELD_LENGTH,
  MAX_INSTRUCTIONS_LENGTH,
  MAX_ADDITIONAL_INFO_LENGTH,
} from "@/lib/security/validation";

const MAX_EXPERIENCE_ENTRIES = 20;
const MAX_EDUCATION_ENTRIES = 10;
const MAX_HIGHLIGHTS_PER_EXP = 20;
const MAX_SKILLS = 80;

/**
 * Sanitizes structured CV profile extraction before persisting to the database.
 */
export function sanitizeCvProfileExtraction(
  raw: CvProfileExtraction | undefined
): CvProfileExtraction | undefined {
  if (!raw) return undefined;

  const normalized = normalizeCvProfileExtraction(raw);

  return {
    profile: {
      fullName: sanitizeText(normalized.profile.fullName, MAX_PROFILE_FIELD_LENGTH),
      targetRole: sanitizeText(normalized.profile.targetRole, MAX_PROFILE_FIELD_LENGTH),
      email: sanitizeText(normalized.profile.email, MAX_PROFILE_FIELD_LENGTH),
      phone: sanitizeText(normalized.profile.phone, MAX_PROFILE_FIELD_LENGTH),
      mobile: sanitizeText(normalized.profile.mobile, MAX_PROFILE_FIELD_LENGTH),
      languages: sanitizeText(normalized.profile.languages, MAX_PROFILE_FIELD_LENGTH),
      location: sanitizeText(normalized.profile.location, MAX_PROFILE_FIELD_LENGTH),
      linkedinUrl: sanitizeText(normalized.profile.linkedinUrl, MAX_PROFILE_FIELD_LENGTH),
      website: sanitizeText(normalized.profile.website, MAX_PROFILE_FIELD_LENGTH),
      githubUrl: sanitizeText(normalized.profile.githubUrl, MAX_PROFILE_FIELD_LENGTH),
      extraLink: sanitizeText(normalized.profile.extraLink, MAX_PROFILE_FIELD_LENGTH),
      salaryRange: sanitizeText(normalized.profile.salaryRange, MAX_PROFILE_FIELD_LENGTH),
      additionalInfo: sanitizeText(
        normalized.profile.additionalInfo,
        MAX_ADDITIONAL_INFO_LENGTH
      ),
    },
    summary: sanitizeText(normalized.summary, MAX_INSTRUCTIONS_LENGTH),
    skills: normalized.skills.slice(0, MAX_SKILLS).map((s) =>
      sanitizeText(s, MAX_PROFILE_FIELD_LENGTH)
    ),
    experience: normalized.experience.slice(0, MAX_EXPERIENCE_ENTRIES).map((exp) => ({
      role: sanitizeText(exp.role, MAX_PROFILE_FIELD_LENGTH),
      company: sanitizeText(exp.company, MAX_PROFILE_FIELD_LENGTH),
      period: sanitizeText(exp.period, MAX_PROFILE_FIELD_LENGTH),
      location: sanitizeText(exp.location, MAX_PROFILE_FIELD_LENGTH),
      highlights: exp.highlights
        .slice(0, MAX_HIGHLIGHTS_PER_EXP)
        .map((h) => sanitizeText(h, MAX_PROFILE_FIELD_LENGTH))
        .filter(Boolean),
    })),
    education: normalized.education.slice(0, MAX_EDUCATION_ENTRIES).map((edu) => ({
      degree: sanitizeText(edu.degree, MAX_PROFILE_FIELD_LENGTH),
      institution: sanitizeText(edu.institution, MAX_PROFILE_FIELD_LENGTH),
      period: sanitizeText(edu.period, MAX_PROFILE_FIELD_LENGTH),
      location: sanitizeText(edu.location, MAX_PROFILE_FIELD_LENGTH),
    })),
  };
}
