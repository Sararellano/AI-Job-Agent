import { sanitizeText } from "@/lib/security/validation";
import {
  MAX_JOB_COMPANY_LENGTH,
  MAX_JOB_DESCRIPTION_LENGTH,
  MAX_JOB_SUMMARY_LENGTH,
  MAX_JOB_TITLE_LENGTH,
} from "@/lib/security/validation";
import { extractJsonLdJobPosting } from "../extract-json-ld";
import { extractMetaJobData } from "../extract-meta";
import { htmlToPlainText } from "../fetch-job-page";
import type { ScrapedJobDraft } from "../parse-job-ai";
import type { JobBoardAdapter } from "../types";

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, "\n").replace(/\n+/g, "\n").trim();
}

function parseGlassdoorHtml(html: string): ScrapedJobDraft | null {
  const jsonLd = extractJsonLdJobPosting(html);
  if (jsonLd?.description) return jsonLd;

  const meta = extractMetaJobData(html);
  if (meta?.description) return meta;

  const titleMatch =
    html.match(/<h1[^>]*data-test=["']job-title["'][^>]*>([\s\S]*?)<\/h1>/i) ??
    html.match(/<h1[^>]*class="[^"]*JobDetails_jobTitle[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) ??
    html.match(/<div[^>]*class="[^"]*jobTitle[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  const companyMatch =
    html.match(/<div[^>]*data-test=["']employer-name["'][^>]*>([\s\S]*?)<\/div>/i) ??
    html.match(/<span[^>]*class="[^"]*EmployerProfile_employerName[^"]*"[^>]*>([\s\S]*?)<\/span>/i);

  const descriptionMatch =
    html.match(/<div[^>]*class="[^"]*jobDescriptionContent[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ??
    html.match(/<div[^>]*data-test=["']job-description["'][^>]*>([\s\S]*?)<\/div>/i) ??
    html.match(/<section[^>]*id=["']JobDescription["'][^>]*>([\s\S]*?)<\/section>/i);

  const title = sanitizeText(stripTags(titleMatch?.[1] ?? ""), MAX_JOB_TITLE_LENGTH);
  const company = sanitizeText(
    stripTags(companyMatch?.[1] ?? ""),
    MAX_JOB_COMPANY_LENGTH
  );
  const description = sanitizeText(
    stripTags(descriptionMatch?.[1] ?? ""),
    MAX_JOB_DESCRIPTION_LENGTH
  );

  if (!description || description.length < 80) return null;

  return {
    title,
    company,
    description,
    summary: sanitizeText(description.slice(0, 200), MAX_JOB_SUMMARY_LENGTH),
    requirements: "",
    salary: "",
  };
}

export const glassdoorAdapter: JobBoardAdapter = {
  id: "glassdoor",
  matchesUrl(url) {
    try {
      return new URL(url).hostname.toLowerCase().includes("glassdoor.");
    } catch {
      return false;
    }
  },
  parse(content) {
    const parsed = parseGlassdoorHtml(content);
    if (parsed?.description) return parsed;

    const plain = htmlToPlainText(content);
    if (plain.length < 120) return null;

    return extractMetaJobData(content);
  },
};

export function isGlassdoorBlocked(html: string): boolean {
  const lower = html.toLowerCase();
  return (
    lower.includes("sign in to view") ||
    lower.includes("sign in to see") ||
    lower.includes("create an account") ||
    lower.includes("captcha") ||
    lower.includes("unusual traffic") ||
    (lower.includes("glassdoor") && htmlToPlainText(html).length < 200)
  );
}
