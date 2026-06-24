import type { CreateJobInput } from "@/types/database";
import { filterJobsByKeywords } from "@/services/job-search/keywords";
import { stripHtml } from "@/services/job-search/text";
import { fetchText } from "@/services/job-search/connectors/http";

const WELLFOUND_BASE = "https://wellfound.com";

interface WellfoundRawJob {
  title?: string;
  slug?: string;
  url?: string;
  jobUrl?: string;
  companyName?: string;
  company?: { name?: string };
  startup?: { name?: string };
  description?: string;
  compensation?: string;
  remote?: boolean;
  locationNames?: string[];
}

/**
 * Extracts job-like nodes from Wellfound __NEXT_DATA__ payloads.
 */
export function parseWellfoundHtml(html: string): WellfoundRawJob[] {
  const match = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
  );
  if (!match?.[1]) {
    return [];
  }

  try {
    const payload = JSON.parse(match[1]) as unknown;
    return collectWellfoundJobs(payload);
  } catch {
    return [];
  }
}

function collectWellfoundJobs(node: unknown, results: WellfoundRawJob[] = []): WellfoundRawJob[] {
  if (!node || typeof node !== "object") {
    return results;
  }

  if (Array.isArray(node)) {
    node.forEach((item) => collectWellfoundJobs(item, results));
    return results;
  }

  const record = node as Record<string, unknown>;
  const title =
    typeof record.title === "string"
      ? record.title
      : typeof record.jobTitle === "string"
        ? record.jobTitle
        : null;
  const url =
    typeof record.url === "string"
      ? record.url
      : typeof record.jobUrl === "string"
        ? record.jobUrl
        : typeof record.slug === "string"
          ? `${WELLFOUND_BASE}/jobs/${record.slug}`
          : null;

  if (title && url) {
    results.push(record as WellfoundRawJob);
  }

  Object.values(record).forEach((value) => collectWellfoundJobs(value, results));
  return results;
}

function mapWellfoundJob(job: WellfoundRawJob): CreateJobInput | null {
  const title = job.title?.trim();
  const company =
    job.companyName?.trim() ??
    job.company?.name?.trim() ??
    job.startup?.name?.trim();
  const description = stripHtml(job.description ?? title ?? "");

  if (!title || !company || !description) {
    return null;
  }

  const url = job.url ?? job.jobUrl;
  if (!url) {
    return null;
  }

  const location = job.locationNames?.join(", ");
  const summaryParts = [
    location,
    job.remote ? "Remote" : null,
    job.compensation,
  ].filter(Boolean);

  return {
    title,
    company,
    description,
    summary: summaryParts.length > 0 ? summaryParts.join(" · ") : "Startup",
    salary: job.compensation ?? null,
    url: url.startsWith("http") ? url : `${WELLFOUND_BASE}${url}`,
    source: "wellfound",
    requirements: null,
  };
}

/**
 * Fetches Wellfound role listings. May be blocked by bot protection in production.
 */
export async function fetchWellfoundJobs(
  roleSlugs: string[],
  keywords: string[] = []
): Promise<CreateJobInput[]> {
  const deduped = new Map<string, CreateJobInput>();

  for (const slug of roleSlugs) {
    const html = await fetchText(`${WELLFOUND_BASE}/role/l/${encodeURIComponent(slug)}`);

    if (html.includes("captcha-delivery.com") || html.includes("Please enable JS")) {
      throw new Error(
        "Wellfound blocked automated access (DataDome). Configure other connectors or retry later."
      );
    }

    const parsed = parseWellfoundHtml(html)
      .map((job) => mapWellfoundJob(job))
      .filter((job): job is CreateJobInput => job !== null);

    for (const job of parsed) {
      deduped.set(job.url, job);
    }
  }

  return filterJobsByKeywords([...deduped.values()], keywords);
}
