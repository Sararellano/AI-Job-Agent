import {
  MAX_JOB_COMPANY_LENGTH,
  MAX_JOB_DESCRIPTION_LENGTH,
  MAX_JOB_REQUIREMENTS_LENGTH,
  MAX_JOB_SUMMARY_LENGTH,
  MAX_JOB_TITLE_LENGTH,
  sanitizeText,
} from "@/lib/security/validation";
import { htmlToPlainText } from "./fetch-job-page";

export interface FallbackJobDraft {
  title: string;
  company: string;
  description: string;
  summary: string;
  requirements: string;
  salary: string;
}

const LOGIN_WALL_PATTERNS = [
  /sign in to continue/i,
  /sign in to view/i,
  /join linkedin/i,
  /log in to continue/i,
  /please log in/i,
];

const BOT_BLOCK_PATTERNS = [
  /verify you are human/i,
  /captcha/i,
  /attention required/i,
  /access denied/i,
  /request unsuccessful/i,
  /temporarily blocked/i,
];

/**
 * Detects login walls and bot challenges that make scraping impossible.
 */
export function detectJobPageBlock(html: string): "login_wall" | "bot_blocked" | null {
  const plain = htmlToPlainText(html).slice(0, 4_000);

  if (LOGIN_WALL_PATTERNS.some((pattern) => pattern.test(plain))) {
    return "login_wall";
  }

  if (BOT_BLOCK_PATTERNS.some((pattern) => pattern.test(plain))) {
    return "bot_blocked";
  }

  return null;
}

/**
 * Extracts a job draft from public HTML without relying on AI.
 */
export function extractJobDraftFromHtml(html: string, sourceUrl: string): FallbackJobDraft | null {
  if (detectJobPageBlock(html)) {
    return null;
  }

  const jsonLdDraft = extractJsonLdJobDraft(html);
  const metaDraft = extractMetaJobDraft(html, sourceUrl);
  const pageTitle = readTitleTag(html);
  const fallbackTitleDraft = pageTitle ? inferTitleAndCompany(pageTitle) : null;
  const plainText = htmlToPlainText(html);

  const title =
    jsonLdDraft?.title ||
    metaDraft.title ||
    fallbackTitleDraft?.title ||
    "";
  const company =
    jsonLdDraft?.company ||
    metaDraft.company ||
    fallbackTitleDraft?.company ||
    "";
  const description =
    jsonLdDraft?.description ||
    (plainText.length >= 220 ? plainText : metaDraft.description) ||
    metaDraft.description ||
    "";
  const requirements =
    jsonLdDraft?.requirements ||
    extractRequirementsSection(html) ||
    "";
  const salary = jsonLdDraft?.salary || metaDraft.salary || "";
  const summary =
    jsonLdDraft?.summary ||
    metaDraft.summary ||
    buildSummary(description, title, company);

  const draft = sanitizeDraft({
    title,
    company,
    description,
    summary,
    requirements,
    salary,
  });

  if (!draft.description || (!draft.title && !draft.company)) {
    return null;
  }

  return draft;
}

/**
 * Returns true when the fallback draft is reliable enough to skip AI.
 */
export function isStrongJobDraft(draft: FallbackJobDraft | null): boolean {
  if (!draft) return false;
  return (
    draft.description.length >= 220 &&
    draft.title.length >= 3 &&
    draft.company.length >= 2
  );
}

function extractJsonLdJobDraft(html: string): Partial<FallbackJobDraft> | null {
  const scripts = Array.from(
    html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    )
  );

  for (const match of scripts) {
    const raw = match[1]?.trim();
    if (!raw) continue;

    const parsed = parseJsonLd(raw);
    if (!parsed) continue;

    const jobPosting = findJobPostingNode(parsed);
    if (!jobPosting) continue;

    const description = readString(jobPosting.description);
    const title = readString(jobPosting.title) || readString(jobPosting.name);
    const company =
      readString(jobPosting.hiringOrganization?.name) ||
      readString(jobPosting.organization?.name) ||
      readString(jobPosting.identifier?.name);
    const requirements = [
      readString(jobPosting.qualifications),
      readString(jobPosting.responsibilities),
      readString(jobPosting.skills),
      readString(jobPosting.experienceRequirements),
    ]
      .filter(Boolean)
      .join("\n\n");

    return {
      title,
      company,
      description: description ? htmlToPlainText(description) : "",
      requirements,
      salary: readSalary(jobPosting.baseSalary),
      summary: buildSummary(description ? htmlToPlainText(description) : "", title, company),
    };
  }

  return null;
}

function extractMetaJobDraft(html: string, sourceUrl: string): Partial<FallbackJobDraft> {
  const meta = readMetaTags(html);
  const rawTitle =
    meta.get("og:title") ||
    meta.get("twitter:title") ||
    meta.get("title") ||
    readTitleTag(html) ||
    "";
  const inferred = inferTitleAndCompany(rawTitle);
  const description =
    meta.get("og:description") ||
    meta.get("description") ||
    meta.get("twitter:description") ||
    "";

  return {
    title: inferred?.title || rawTitle,
    company:
      inferred?.company ||
      meta.get("og:site_name") ||
      inferCompanyFromHost(sourceUrl),
    description: sanitizeText(description, MAX_JOB_DESCRIPTION_LENGTH),
    summary: buildSummary(description, inferred?.title || rawTitle, inferred?.company || ""),
    salary: "",
  };
}

function readMetaTags(html: string): Map<string, string> {
  const tags = Array.from(html.matchAll(/<meta\s+[^>]*>/gi));
  const meta = new Map<string, string>();

  for (const tagMatch of tags) {
    const tag = tagMatch[0];
    const attrs = readAttributes(tag);
    const key = (attrs.property || attrs.name || "").toLowerCase();
    const content = attrs.content;

    if (key && content) {
      meta.set(key, decodeHtmlEntities(content));
    }
  }

  return meta;
}

function readAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const matches = tag.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*["']([^"']*)["']/g);

  for (const match of matches) {
    attrs[match[1].toLowerCase()] = match[2];
  }

  return attrs;
}

function readTitleTag(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return decodeHtmlEntities(stripTags(match?.[1] || ""));
}

function inferTitleAndCompany(value: string): { title: string; company: string } | null {
  const clean = normalizeWhitespace(value);
  if (!clean) return null;

  const separators = [" at ", " | ", " - ", " — ", " – "];

  for (const separator of separators) {
    if (!clean.includes(separator)) continue;

    const [left, ...rest] = clean.split(separator);
    const right = rest.join(separator).trim();
    const title = left.trim();
    const company = right
      .replace(/\b(job|jobs|careers?|empleo|oferta)\b/gi, "")
      .trim();

    if (title && company) {
      return { title, company };
    }
  }

  return { title: clean, company: "" };
}

function inferCompanyFromHost(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, "");
    const parts = host.split(".");
    if (!parts.length) return "";
    const primary = parts[0] || "";
    const company =
      /^(jobs?|careers?|apply|talent)$/i.test(primary) && parts.length > 1
        ? parts[1]
        : primary;
    return company
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  } catch {
    return "";
  }
}

function extractRequirementsSection(html: string): string {
  const section = html.match(
    /<(section|div)[^>]*>[\s\S]{0,400}?(requirements|qualifications|what you bring|what you'll bring|must have|nice to have)[\s\S]{0,4000}?<\/\1>/i
  );

  if (!section?.[0]) return "";
  return sanitizeText(htmlToPlainText(section[0]), MAX_JOB_REQUIREMENTS_LENGTH);
}

function buildSummary(description: string, title: string, company: string): string {
  const cleanDescription = normalizeWhitespace(description);
  const firstSentence = cleanDescription.match(/(.{40,220}?[.!?])(?:\s|$)/)?.[1]?.trim();

  if (firstSentence) {
    return sanitizeText(firstSentence, MAX_JOB_SUMMARY_LENGTH);
  }

  const fallback = [title, company].filter(Boolean).join(" at ");
  if (fallback) {
    return sanitizeText(`Job opening: ${fallback}`, MAX_JOB_SUMMARY_LENGTH);
  }

  return "";
}

function sanitizeDraft(draft: Partial<FallbackJobDraft>): FallbackJobDraft {
  return {
    title: sanitizeText(draft.title ?? "", MAX_JOB_TITLE_LENGTH),
    company: sanitizeText(draft.company ?? "", MAX_JOB_COMPANY_LENGTH),
    description: sanitizeText(draft.description ?? "", MAX_JOB_DESCRIPTION_LENGTH),
    summary: sanitizeText(draft.summary ?? "", MAX_JOB_SUMMARY_LENGTH),
    requirements: sanitizeText(draft.requirements ?? "", MAX_JOB_REQUIREMENTS_LENGTH),
    salary: sanitizeText(draft.salary ?? "", 100),
  };
}

function parseJsonLd(raw: string): unknown {
  const attempts = [
    raw,
    raw.replace(/^\s*<!--/, "").replace(/-->\s*$/, ""),
    raw.replace(/&quot;/g, '"'),
  ];

  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch {
      continue;
    }
  }

  return null;
}

function findJobPostingNode(input: unknown): Record<string, unknown> | null {
  if (!input) return null;

  if (Array.isArray(input)) {
    for (const item of input) {
      const nested = findJobPostingNode(item);
      if (nested) return nested;
    }
    return null;
  }

  if (typeof input !== "object") {
    return null;
  }

  const node = input as Record<string, unknown>;
  const type = node["@type"];

  if (
    type === "JobPosting" ||
    (Array.isArray(type) && type.includes("JobPosting"))
  ) {
    return node;
  }

  return (
    findJobPostingNode(node["@graph"]) ||
    findJobPostingNode(node.mainEntity) ||
    findJobPostingNode(node.itemListElement)
  );
}

function readString(value: unknown): string {
  if (typeof value === "string") {
    return decodeHtmlEntities(stripTags(value));
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => readString(item))
      .filter(Boolean)
      .join("\n");
  }

  if (value && typeof value === "object" && "name" in value) {
    return readString((value as Record<string, unknown>).name);
  }

  return "";
}

function readSalary(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const salary = value as Record<string, unknown>;
  const text = readString(salary.text);
  if (text) return text;

  const nested = salary.value;
  if (!nested || typeof nested !== "object") {
    return "";
  }

  const valueRecord = nested as Record<string, unknown>;
  const minValue = valueRecord.minValue;
  const maxValue = valueRecord.maxValue;
  const currency = readString(salary.currency) || readString(valueRecord.currency);
  const unit = readString(valueRecord.unitText);

  const range = [minValue, maxValue].filter((item) => item !== undefined).join(" - ");
  return normalizeWhitespace([range, currency, unit].filter(Boolean).join(" "));
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ");
}

function normalizeWhitespace(value: string): string {
  return decodeHtmlEntities(value).replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}
