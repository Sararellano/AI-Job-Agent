import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { isValidJobUrl } from "@/lib/security/validation";
import { fetchJobPage, parseJobWithAi } from "@/services/job-scrape";
import { detectJobPageBlock } from "@/services/job-scrape/extract-job-fallback";

const SCRAPE_RATE_LIMIT = 10;
const SCRAPE_RATE_WINDOW_MS = 60 * 60 * 1_000;

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

  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url || !isValidJobUrl(url)) {
    return NextResponse.json({ error: "Valid http(s) URL required" }, { status: 400 });
  }

  try {
    const html = await fetchJobPage(url);
    const pageBlock = detectJobPageBlock(html);

    if (pageBlock === "login_wall") {
      return NextResponse.json(
        {
          code: "blocked_page",
          error: "This job page requires login and cannot be read automatically.",
        },
        { status: 422 }
      );
    }

    if (pageBlock === "bot_blocked") {
      return NextResponse.json(
        {
          code: "blocked_page",
          error: "This site is blocking automated access to the job page.",
        },
        { status: 422 }
      );
    }

    const draft = await parseJobWithAi(html, url);

    if (!draft?.description) {
      return NextResponse.json(
        {
          code:
            process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY
              ? "parse_failed"
              : "no_extractor",
          error:
            process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY
              ? "Could not extract job details from this page."
              : "No AI provider is configured and this page does not expose enough public job data.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ draft, url });
  } catch (err) {
    console.error("Job scrape failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch or parse this URL" },
      { status: 502 }
    );
  }
}
