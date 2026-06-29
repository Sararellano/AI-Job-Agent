import { sanitizeText } from "@/lib/security/validation";
import {
  MAX_JOB_COMPANY_LENGTH,
  MAX_JOB_DESCRIPTION_LENGTH,
  MAX_JOB_REQUIREMENTS_LENGTH,
  MAX_JOB_SUMMARY_LENGTH,
  MAX_JOB_TITLE_LENGTH,
} from "@/lib/security/validation";
import { extractJsonLdJobPosting } from "../extract-json-ld";
import { extractMetaJobData } from "../extract-meta";
import { htmlToPlainText } from "../fetch-job-page";
import type { ScrapedJobDraft } from "../parse-job-ai";
import type { JobBoardAdapter } from "../types";

function parseInfoJobsHtml(html: string): ScrapedJobDraft | null {
  const jsonLd = extractJsonLdJobPosting(html);
  if (jsonLd?.description) return jsonLd;

  const meta = extractMetaJobData(html);
  if (meta?.description) return meta;

  const titleMatch = html.match(
    /<h1[^>]*class="[^"]*ij-OfferCardContent-description-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i
  );
  const companyMatch = html.match(
    /<a[^>]*class="[^"]*ij-OfferCardContent-description-subtitle[^"]*"[^>]*>([\s\S]*?)<\/a>/i
  );
  const descriptionMatch = html.match(
    /<div[^>]*class="[^"]*ij-OfferPage-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  );

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

  const requirementsMatch = html.match(
    /<div[^>]*class="[^"]*ij-OfferPage-requirements[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  );
  const requirements = sanitizeText(
    stripTags(requirementsMatch?.[1] ?? ""),
    MAX_JOB_REQUIREMENTS_LENGTH
  );

  return {
    title,
    company,
    description,
    summary: sanitizeText(description.slice(0, 200), MAX_JOB_SUMMARY_LENGTH),
    requirements,
    salary: "",
  };
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, "\n").replace(/\n+/g, "\n").trim();
}

export const infoJobsAdapter: JobBoardAdapter = {
  id: "infojobs",
  matchesUrl(url) {
    try {
      return new URL(url).hostname.toLowerCase().includes("infojobs.net");
    } catch {
      return false;
    }
  },
  parse(content) {
    const parsed = parseInfoJobsHtml(content);
    if (parsed?.description) return parsed;

    const plain = htmlToPlainText(content);
    if (plain.length < 120) return null;

    return extractMetaJobData(content);
  },
};

export function isInfoJobsBlocked(html: string): boolean {
  const lower = html.toLowerCase();
  return (
    lower.includes("captcha") ||
    lower.includes("acceso denegado") ||
    lower.includes("access denied")
  );
}
