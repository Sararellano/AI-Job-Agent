import type { CreateJobInput, JobSource } from "@/types/database";
import type { QuestionAnswer } from "@/types/skills";
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
export const MAX_JOB_TITLE_LENGTH = 200;
export const MAX_JOB_COMPANY_LENGTH = 200;
export const MAX_JOB_DESCRIPTION_LENGTH = 20_000;
export const MAX_JOB_SUMMARY_LENGTH = 1_000;
export const MAX_JOB_SALARY_LENGTH = 100;
export const MAX_JOB_REQUIREMENTS_LENGTH = 5_000;
export const MAX_JOB_URL_LENGTH = 2_048;

const VALID_JOB_SOURCES = new Set<JobSource>([
  "greenhouse",
  "lever",
  "remoteok",
  "remotive",
  "weworkremotely",
  "remoteco",
  "getmanfred",
  "linkedin",
  "infojobs",
  "workable",
  "wellfound",
  "manual",
  "other",
]);

const BLOCKED_URL_PROTOCOLS = /^(javascript|data|vbscript|file):/i;

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
 * Normalizes job posting URLs for storage and deduplication.
 */
export function normalizeJobUrl(value: string): string | null {
  const trimmed = value.trim().slice(0, MAX_JOB_URL_LENGTH);
  if (!trimmed || BLOCKED_URL_PROTOCOLS.test(trimmed)) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    parsed.hash = "";
    let normalized = parsed.toString();
    if (normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return null;
  }
}

export function isValidJobUrl(value: string): boolean {
  return normalizeJobUrl(value) !== null;
}

export function isValidJobSource(value: string): value is JobSource {
  return VALID_JOB_SOURCES.has(value as JobSource);
}

/**
 * Infers ATS/portal source from a posting URL when the user did not pick one.
 */
export function inferJobSourceFromUrl(url: string): JobSource {
  const host = new URL(url).hostname.toLowerCase();

  if (host.includes("greenhouse.io") || host.includes("boards.greenhouse.io")) {
    return "greenhouse";
  }
  if (host.includes("lever.co") || host.includes("jobs.lever.co")) {
    return "lever";
  }
  if (host.includes("remoteok.com")) {
    return "remoteok";
  }
  if (host.includes("remotive.com")) {
    return "remotive";
  }
  if (host.includes("weworkremotely.com")) {
    return "weworkremotely";
  }
  if (host.includes("remote.co")) {
    return "remoteco";
  }
  if (host.includes("getmanfred.com")) {
    return "getmanfred";
  }
  if (host.includes("linkedin.com")) {
    return "linkedin";
  }
  if (host.includes("infojobs.net")) {
    return "infojobs";
  }
  if (host.includes("workable.com")) {
    return "workable";
  }
  if (host.includes("wellfound.com") || host.includes("angel.co")) {
    return "wellfound";
  }

  return "manual";
}

/**
 * Validates and sanitizes job posting payloads before database writes.
 */
export function sanitizeJobInput(raw: unknown): CreateJobInput | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const body = raw as Record<string, unknown>;
  const title = sanitizeText(String(body.title ?? ""), MAX_JOB_TITLE_LENGTH);
  const company = sanitizeText(
    String(body.company ?? ""),
    MAX_JOB_COMPANY_LENGTH
  );
  const description = sanitizeText(
    String(body.description ?? ""),
    MAX_JOB_DESCRIPTION_LENGTH
  );
  const url = normalizeJobUrl(String(body.url ?? ""));

  if (!title || !company || !description || !url) {
    return null;
  }

  const summary = sanitizeText(
    typeof body.summary === "string" ? body.summary : "",
    MAX_JOB_SUMMARY_LENGTH
  );
  const salary = sanitizeText(
    typeof body.salary === "string" ? body.salary : "",
    MAX_JOB_SALARY_LENGTH
  );
  const requirements = sanitizeText(
    typeof body.requirements === "string" ? body.requirements : "",
    MAX_JOB_REQUIREMENTS_LENGTH
  );

  const rawSource =
    typeof body.source === "string" ? body.source.trim().toLowerCase() : "";
  const source =
    rawSource && isValidJobSource(rawSource)
      ? rawSource
      : inferJobSourceFromUrl(url);

  return {
    title,
    company,
    description,
    url,
    source,
    summary: summary || null,
    salary: salary || null,
    requirements: requirements || null,
  };
}
