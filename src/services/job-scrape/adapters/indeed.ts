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

/**
 * Extracts Indeed job key (jk) from posting URLs.
 */
export function extractIndeedJobKey(url: string): string | null {
  try {
    const parsed = new URL(url);
    return (
      parsed.searchParams.get("jk") ??
      parsed.searchParams.get("vjk") ??
      parsed.pathname.match(/\/viewjob\?jk=([^&]+)/)?.[1] ??
      null
    );
  } catch {
    return null;
  }
}

function parseIndeedEmbeddedState(html: string): ScrapedJobDraft | null {
  const titleCompany = html.match(
    /"jobKey":"([^"]+)","jobTitle":"([^"]+)","companyName":"([^"]+)"/
  );
  if (titleCompany) {
    const [, , title, company] = titleCompany;
    const description = extractIndeedDescriptionBlock(html);
    if (!description) return null;

    return buildDraft(title ?? "", company ?? "", description);
  }

  const ld = extractJsonLdJobPosting(html);
  if (ld?.description) return ld;

  const meta = extractMetaJobData(html);
  if (meta?.description) return meta;

  const description = extractIndeedDescriptionBlock(html);
  if (!description) return null;

  const heading = html.match(/<h1[^>]*class="[^"]*jobsearch-JobInfoHeader-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i);
  const companyNode = html.match(
    /data-company-name="([^"]+)"|class="[^"]*jobsearch-InlineCompanyRating[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  );

  const title = sanitizeText(
    stripTags(heading?.[1] ?? ""),
    MAX_JOB_TITLE_LENGTH
  );
  const company = sanitizeText(
    companyNode?.[1] ?? stripTags(companyNode?.[2] ?? ""),
    MAX_JOB_COMPANY_LENGTH
  );

  return buildDraft(title, company, description);
}

function extractIndeedDescriptionBlock(html: string): string {
  const match = html.match(
    /<div[^>]*id=["']jobDescriptionText["'][^>]*>([\s\S]*?)<\/div>/i
  );
  if (!match?.[1]) return "";
  return stripTags(match[1]);
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function buildDraft(
  title: string,
  company: string,
  description: string
): ScrapedJobDraft | null {
  const cleanDescription = sanitizeText(description, MAX_JOB_DESCRIPTION_LENGTH);
  if (!cleanDescription || cleanDescription.length < 80) return null;

  return {
    title: sanitizeText(title, MAX_JOB_TITLE_LENGTH),
    company: sanitizeText(company, MAX_JOB_COMPANY_LENGTH),
    description: cleanDescription,
    summary: sanitizeText(cleanDescription.slice(0, 200), MAX_JOB_SUMMARY_LENGTH),
    requirements: "",
    salary: "",
  };
}

export const indeedAdapter: JobBoardAdapter = {
  id: "indeed",
  matchesUrl(url) {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return host.includes("indeed.") || host === "indeed.com";
    } catch {
      return false;
    }
  },
  parse(content) {
    const fromState = parseIndeedEmbeddedState(content);
    if (fromState?.description) return fromState;

    const plain = htmlToPlainText(content);
    if (plain.length < 120) return null;

    return extractMetaJobData(content);
  },
};

export function isIndeedBlocked(html: string): boolean {
  const lower = html.toLowerCase();
  return (
    lower.includes("verify you are human") ||
    lower.includes("captcha") ||
    lower.includes("unusual traffic")
  );
}
