import { sanitizeText } from "@/lib/security/validation";
import {
  MAX_JOB_COMPANY_LENGTH,
  MAX_JOB_DESCRIPTION_LENGTH,
  MAX_JOB_SUMMARY_LENGTH,
  MAX_JOB_TITLE_LENGTH,
} from "@/lib/security/validation";
import type { ScrapedJobDraft } from "./parse-job-ai";

/**
 * Extracts job hints from Open Graph and standard meta tags.
 */
export function extractMetaJobData(html: string): ScrapedJobDraft | null {
  const title =
    readMeta(html, "og:title") ??
    readMeta(html, "twitter:title") ??
    readTag(html, "title");

  const description =
    readMeta(html, "og:description") ??
    readMeta(html, "description") ??
    readMeta(html, "twitter:description");

  const cleanTitle = sanitizeText(decodeEntities(title ?? ""), MAX_JOB_TITLE_LENGTH);
  const cleanDescription = sanitizeText(
    decodeEntities(description ?? ""),
    MAX_JOB_DESCRIPTION_LENGTH
  );

  if (!cleanDescription || cleanDescription.length < 80) return null;

  const { jobTitle, company } = splitTitle(cleanTitle);

  return {
    title: jobTitle,
    company,
    description: cleanDescription,
    summary: sanitizeText(cleanDescription.slice(0, 200), MAX_JOB_SUMMARY_LENGTH),
    requirements: "",
    salary: "",
  };
}

function readMeta(html: string, name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function readTag(html: string, tag: string): string | null {
  const match = html.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "i"));
  return match?.[1]?.trim() ?? null;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/**
 * Splits titles like "Frontend Dev - Acme | InfoJobs" into role and company.
 */
function splitTitle(title: string): { jobTitle: string; company: string } {
  const withoutSite = title.split("|")[0]?.trim() ?? title;
  const parts = withoutSite.split(/\s[-–—|]\s/);
  if (parts.length >= 2) {
    return {
      jobTitle: sanitizeText(parts[0] ?? "", MAX_JOB_TITLE_LENGTH),
      company: sanitizeText(parts[1] ?? "", MAX_JOB_COMPANY_LENGTH),
    };
  }
  return { jobTitle: sanitizeText(withoutSite, MAX_JOB_TITLE_LENGTH), company: "" };
}
