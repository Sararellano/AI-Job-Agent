import type { QuestionAnswer } from "@/types/skills";
import type { EmploymentSector, UserCareerContext } from "@/types/career";
import { isValidRoleFamily, isValidSector } from "@/lib/skills/registry";
import {
  COVER_LETTER_TEMPLATES,
  CV_TEMPLATES,
  DEFAULT_COVER_TEMPLATE,
  DEFAULT_CV_TEMPLATE,
} from "@/types/documents";

export const MAX_INSTRUCTIONS_LENGTH = 8_000;
export const MAX_PROFILE_FIELD_LENGTH = 500;
export const MAX_ADDITIONAL_INFO_LENGTH = 4_000;
export const MAX_ANSWER_KEYS = 50;
export const MAX_CV_SIZE_MB = 10;
export const MAX_PHOTO_SIZE_MB = 5;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VALID_ANSWERS = new Set<QuestionAnswer>([
  "yes",
  "somewhat",
  "no",
  "skip",
]);

const VALID_STATUSES = new Set([
  "pending",
  "applied",
  "interview",
  "rejected",
]);

const CV_TEMPLATE_IDS = new Set(CV_TEMPLATES.map((t) => t.id));
const COVER_TEMPLATE_IDS = new Set(COVER_LETTER_TEMPLATES.map((t) => t.id));

const ALLOWED_CV_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

/**
 * Trims and caps free-text fields used in prompts and DB writes.
 */
export function sanitizeText(
  value: string | undefined | null,
  maxLength: number
): string {
  if (!value) return "";
  return value.trim().slice(0, maxLength);
}

export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function isValidApplicationStatus(status: string): boolean {
  return VALID_STATUSES.has(status);
}

export function isValidQuestionAnswer(value: unknown): value is QuestionAnswer {
  return typeof value === "string" && VALID_ANSWERS.has(value as QuestionAnswer);
}

/**
 * Filters answer map to known question ids and valid enum values.
 */
export function sanitizeQuestionAnswers(
  answers: unknown
): Record<string, QuestionAnswer> | null {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return null;
  }

  const sanitized: Record<string, QuestionAnswer> = {};
  const entries = Object.entries(answers as Record<string, unknown>).slice(
    0,
    MAX_ANSWER_KEYS
  );

  for (const [key, value] of entries) {
    if (typeof key !== "string" || key.length > 80 || !/^[a-z][\w-]*$/i.test(key)) {
      continue;
    }
    if (!isValidQuestionAnswer(value)) continue;
    sanitized[key] = value;
  }

  return sanitized;
}

export function resolveTemplateId(
  type: "cv" | "cover_letter",
  templateId: string | undefined
): string {
  const fallback =
    type === "cv" ? DEFAULT_CV_TEMPLATE : DEFAULT_COVER_TEMPLATE;
  if (!templateId) return fallback;

  const allowed = type === "cv" ? CV_TEMPLATE_IDS : COVER_TEMPLATE_IDS;
  return allowed.has(templateId) ? templateId : fallback;
}

export function isAllowedCvUpload(
  mimeType: string,
  fileName: string
): boolean {
  const normalizedMime = mimeType.toLowerCase();
  const hasAllowedMime = ALLOWED_CV_MIME_TYPES.has(normalizedMime);
  const hasAllowedExt = /\.(pdf|docx)$/i.test(fileName);

  return hasAllowedMime && hasAllowedExt;
}

export function isAllowedPhotoType(mimeType: string): boolean {
  return ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
    mimeType
  );
}

/**
 * Validates and normalizes sector / role family from onboarding forms.
 */
export function sanitizeCareerContext(input: {
  sector?: unknown;
  roleFamily?: unknown;
  targetRole?: unknown;
}): UserCareerContext | null {
  if (typeof input.sector !== "string" || !isValidSector(input.sector)) {
    return null;
  }

  const sector = input.sector as EmploymentSector;
  const roleFamily =
    typeof input.roleFamily === "string" ? input.roleFamily.trim() : "";

  if (!roleFamily || !isValidRoleFamily(sector, roleFamily)) {
    return null;
  }

  return {
    sector,
    roleFamily,
    targetRole: sanitizeText(
      typeof input.targetRole === "string" ? input.targetRole : "",
      MAX_PROFILE_FIELD_LENGTH
    ),
  };
}
