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

const GUEST_API =
  "https://www.linkedin.com/jobs-guest/jobs/api/jobPosting";

/**
 * Extracts LinkedIn job id from public job view URLs.
 */
export function extractLinkedInJobId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/jobs\/view\/(?:[^/]*-)?(\d+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

async function fetchLinkedInGuestApi(jobId: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(`${GUEST_API}/${jobId}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json,text/html",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
      },
      redirect: "follow",
    });

    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function parseLinkedInGuestJson(raw: string): ScrapedJobDraft | null {
  try {
    const data = JSON.parse(raw) as {
      title?: string;
      description?: string | { text?: string };
      companyDetails?: {
        company?: string;
        companyName?: string;
      };
      companyName?: string;
      formattedLocation?: string;
      listedAt?: number;
    };

    const description =
      typeof data.description === "string"
        ? data.description
        : data.description?.text ?? "";

    const title = sanitizeText(String(data.title ?? ""), MAX_JOB_TITLE_LENGTH);
    const company = sanitizeText(
      String(
        data.companyDetails?.company ??
          data.companyDetails?.companyName ??
          data.companyName ??
          ""
      ),
      MAX_JOB_COMPANY_LENGTH
    );
    const cleanDescription = sanitizeText(
      stripHtml(description),
      MAX_JOB_DESCRIPTION_LENGTH
    );

    if (!cleanDescription) return null;

    const location = data.formattedLocation
      ? `Location: ${data.formattedLocation}`
      : "";

    return {
      title,
      company,
      description: cleanDescription,
      summary: sanitizeText(cleanDescription.slice(0, 200), MAX_JOB_SUMMARY_LENGTH),
      requirements: sanitizeText(location, MAX_JOB_REQUIREMENTS_LENGTH),
      salary: "",
    };
  } catch {
    return null;
  }
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, "\n").replace(/\n+/g, "\n").trim();
}

function parseLinkedInHtml(html: string): ScrapedJobDraft | null {
  return extractJsonLdJobPosting(html) ?? extractMetaJobData(html);
}

export const linkedInAdapter: JobBoardAdapter = {
  id: "linkedin",
  matchesUrl(url) {
    try {
      return new URL(url).hostname.toLowerCase().includes("linkedin.com");
    } catch {
      return false;
    }
  },
  async fetchContent(url) {
    const jobId = extractLinkedInJobId(url);
    if (!jobId) return null;
    return fetchLinkedInGuestApi(jobId);
  },
  parse(content, url) {
    const trimmed = content.trim();
    if (trimmed.startsWith("{")) {
      return parseLinkedInGuestJson(trimmed);
    }

    const fromHtml = parseLinkedInHtml(content);
    if (fromHtml?.description) return fromHtml;

    const plain = htmlToPlainText(content);
    if (plain.length < 120) return null;

    return extractMetaJobData(
      `<meta property="og:description" content="${plain.slice(0, 5000)}" />`
    );
  },
};

export function isLinkedInLoginWall(html: string): boolean {
  const lower = html.toLowerCase();
  return (
    lower.includes("authwall") ||
    lower.includes("sign in to linkedin") ||
    lower.includes("join linkedin") ||
    (lower.includes("<title>linkedin</title>") && htmlToPlainText(html).length < 200)
  );
}
