import { JobScrapeError } from "./types";

const FETCH_TIMEOUT_MS = 15_000;
const MAX_HTML_LENGTH = 500_000;

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
  "Cache-Control": "no-cache",
  "Upgrade-Insecure-Requests": "1",
};

export interface FetchJobPageResult {
  html: string;
  status: number;
  finalUrl: string;
}

/**
 * Fetches a job posting page HTML server-side.
 */
export async function fetchJobPage(url: string): Promise<FetchJobPageResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: DEFAULT_HEADERS,
      redirect: "follow",
    });

    const html = (await res.text()).slice(0, MAX_HTML_LENGTH);

    if (!res.ok) {
      if (res.status === 403 || res.status === 401) {
        throw new JobScrapeError(
          "FETCH_BLOCKED",
          `HTTP ${res.status}`,
          { status: res.status }
        );
      }
      if (res.status === 429) {
        throw new JobScrapeError("RATE_LIMITED", `HTTP ${res.status}`, {
          status: res.status,
        });
      }
      throw new JobScrapeError("FETCH_FAILED", `HTTP ${res.status}`, {
        status: res.status,
      });
    }

    return {
      html,
      status: res.status,
      finalUrl: res.url,
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new JobScrapeError("FETCH_TIMEOUT", "Request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Strips HTML to plain text for AI parsing.
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12_000);
}
