import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { isValidJobUrl } from "@/lib/security/validation";
import { scrapeJobFromUrl } from "@/services/job-scrape/scrape-job";
import { JobScrapeError } from "@/services/job-scrape/types";

const SCRAPE_RATE_LIMIT = 10;
const SCRAPE_RATE_WINDOW_MS = 60 * 60 * 1_000;

function scrapeErrorResponse(err: JobScrapeError) {
  const statusByCode: Record<JobScrapeError["code"], number> = {
    INVALID_URL: 400,
    UNAUTHORIZED: 401,
    RATE_LIMITED: 429,
    FETCH_BLOCKED: 422,
    FETCH_TIMEOUT: 504,
    FETCH_FAILED: 502,
    EMPTY_PAGE: 422,
    PARSE_FAILED: 422,
    AI_UNAVAILABLE: 503,
  };

  return NextResponse.json(
    {
      error: err.message,
      code: err.code,
      board: err.board ?? null,
    },
    { status: statusByCode[err.code] ?? 502 }
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const rateLimit = checkRateLimit(
    `job-scrape:${user.id}`,
    SCRAPE_RATE_LIMIT,
    SCRAPE_RATE_WINDOW_MS
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many scrape requests. Try again later.",
        code: "RATE_LIMITED",
      },
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
    return NextResponse.json(
      { error: "Invalid JSON body", code: "INVALID_URL" },
      { status: 400 }
    );
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url || !isValidJobUrl(url)) {
    return NextResponse.json(
      { error: "Valid http(s) URL required", code: "INVALID_URL" },
      { status: 400 }
    );
  }

  try {
    const result = await scrapeJobFromUrl(url);
    return NextResponse.json({
      draft: result.draft,
      url: result.url,
      board: result.board,
    });
  } catch (err) {
    if (err instanceof JobScrapeError) {
      console.error("Job scrape failed:", err.code, err.message);
      return scrapeErrorResponse(err);
    }

    console.error("Job scrape failed:", err);
    return NextResponse.json(
      {
        error: "Failed to fetch or parse this URL",
        code: "FETCH_FAILED",
      },
      { status: 502 }
    );
  }
}
