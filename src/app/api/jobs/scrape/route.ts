import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { isValidJobUrl, normalizeJobUrl } from "@/lib/security/validation";
import {
  FetchJobPageError,
  type FetchJobPageErrorCode,
  type ScrapedJobDraft,
  extractJobPostingFromHtml,
  fetchDraftFromAtsApi,
  fetchJobPage,
  parseJobWithAi,
} from "@/services/job-scrape";

const SCRAPE_RATE_LIMIT = 10;
const SCRAPE_RATE_WINDOW_MS = 60 * 60 * 1_000;

/**
 * Hostnames known to block server-side scraping unconditionally.
 * We short-circuit instead of wasting fetches and AI budget.
 */
const UNSUPPORTED_HOSTS = new Map<string, "login" | "antibot">([
  ["linkedin.com", "login"],
  ["www.linkedin.com", "login"],
  ["es.linkedin.com", "login"],
  ["indeed.com", "antibot"],
  ["www.indeed.com", "antibot"],
  ["es.indeed.com", "antibot"],
  ["glassdoor.com", "antibot"],
  ["www.glassdoor.com", "antibot"],
  ["www.welcometothejungle.com", "antibot"],
]);

interface ScrapeErrorResponse {
  error: string;
  code: FetchJobPageErrorCode | "unsupported-host" | "empty-extraction";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimit(
    `job-scrape:${user.id}`,
    SCRAPE_RATE_LIMIT,
    SCRAPE_RATE_WINDOW_MS
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many scrape requests. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawUrl = typeof body.url === "string" ? body.url.trim() : "";
  const normalized = rawUrl ? normalizeJobUrl(rawUrl) : null;
  if (!normalized || !isValidJobUrl(normalized)) {
    return NextResponse.json(
      { error: "Valid http(s) URL required", code: "network" },
      { status: 400 }
    );
  }

  const host = new URL(normalized).hostname.toLowerCase();
  const unsupported = UNSUPPORTED_HOSTS.get(host);
  if (unsupported) {
    return jsonError(
      415,
      unsupported === "login"
        ? "This site requires authentication and cannot be scraped automatically. Paste the description manually."
        : "This site blocks automated access. Paste the description manually.",
      "unsupported-host"
    );
  }

  try {
    const atsDraft = await fetchDraftFromAtsApi(normalized);
    if (atsDraft && atsDraft.description.length >= 50) {
      return NextResponse.json({ draft: atsDraft, url: normalized });
    }

    const page = await fetchJobPage(normalized);
    const jsonLdDraft = extractJobPostingFromHtml(page.html);
    if (jsonLdDraft && jsonLdDraft.description.length >= 50) {
      return NextResponse.json({ draft: jsonLdDraft, url: normalized });
    }

    const aiDraft = await parseJobWithAi(page.html, page.finalUrl);
    if (!aiDraft?.description || aiDraft.description.length < 50) {
      return jsonError(
        422,
        "Could not extract job details from this page",
        "empty-extraction"
      );
    }
    return NextResponse.json({ draft: aiDraft satisfies ScrapedJobDraft, url: normalized });
  } catch (err) {
    if (err instanceof FetchJobPageError) {
      return scrapeErrorResponse(err);
    }
    console.error("Job scrape failed:", err);
    return jsonError(502, "Failed to fetch or parse this URL", "network");
  }
}

function scrapeErrorResponse(err: FetchJobPageError): NextResponse {
  switch (err.code) {
    case "timeout":
      return jsonError(
        504,
        "The job page took too long to respond. Try again or paste the description.",
        err.code
      );
    case "http-403":
      return jsonError(
        403,
        "The job page blocked our request (403). Paste the description manually.",
        err.code
      );
    case "http-404":
      return jsonError(404, "Job posting not found (404).", err.code);
    case "blocked-bot":
      return jsonError(
        451,
        "This page is behind an anti-bot challenge. Paste the description manually.",
        err.code
      );
    case "login-wall":
      return jsonError(
        451,
        "This page requires login to view the offer. Paste the description manually.",
        err.code
      );
    case "empty-page":
      return jsonError(
        422,
        "The page returned no content. Paste the description manually.",
        err.code
      );
    default:
      return jsonError(502, "Failed to fetch this URL.", err.code);
  }
}

function jsonError(
  status: number,
  message: string,
  code: ScrapeErrorResponse["code"]
): NextResponse {
  return NextResponse.json({ error: message, code } as ScrapeErrorResponse, {
    status,
  });
}
