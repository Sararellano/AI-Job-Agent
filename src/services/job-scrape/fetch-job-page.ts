const FETCH_TIMEOUT_MS = 15_000;
const MAX_HTML_LENGTH = 500_000;

// Realistic desktop User-Agent — many ATS / job portals reject obvious bot UAs.
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export type FetchJobPageErrorCode =
  | "timeout"
  | "network"
  | "http-403"
  | "http-404"
  | "http-other"
  | "blocked-bot"
  | "login-wall"
  | "empty-page";

export class FetchJobPageError extends Error {
  readonly code: FetchJobPageErrorCode;
  readonly status?: number;

  constructor(code: FetchJobPageErrorCode, message: string, status?: number) {
    super(message);
    this.name = "FetchJobPageError";
    this.code = code;
    this.status = status;
  }
}

export interface FetchedJobPage {
  html: string;
  finalUrl: string;
  contentType: string;
}

/**
 * Fetches a job posting page server-side. Throws FetchJobPageError on bot
 * blocks, login walls, timeouts or other unrecoverable problems so the API
 * layer can surface a precise message to the user.
 */
export async function fetchJobPage(url: string): Promise<FetchedJobPage> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": BROWSER_UA,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
        "Cache-Control": "no-cache",
      },
      redirect: "follow",
    });
  } catch (err) {
    clearTimeout(timeout);
    if ((err as Error).name === "AbortError") {
      throw new FetchJobPageError("timeout", "Request timed out");
    }
    throw new FetchJobPageError("network", (err as Error).message);
  }
  clearTimeout(timeout);

  if (!res.ok) {
    const status = res.status;
    if (status === 403 || status === 401) {
      throw new FetchJobPageError("http-403", `HTTP ${status}`, status);
    }
    if (status === 404) {
      throw new FetchJobPageError("http-404", `HTTP ${status}`, status);
    }
    throw new FetchJobPageError("http-other", `HTTP ${status}`, status);
  }

  const contentType = res.headers.get("content-type") ?? "";
  const html = (await res.text()).slice(0, MAX_HTML_LENGTH);

  if (!html.trim()) {
    throw new FetchJobPageError("empty-page", "Empty response body");
  }

  if (looksLikeAntiBot(html)) {
    throw new FetchJobPageError("blocked-bot", "Anti-bot challenge detected");
  }
  if (looksLikeLoginWall(html, res.url)) {
    throw new FetchJobPageError("login-wall", "Login required");
  }

  return { html, finalUrl: res.url, contentType };
}

const ANTI_BOT_MARKERS = [
  "Just a moment",
  "cf-browser-verification",
  "Attention Required! | Cloudflare",
  "Access denied | ",
  "px-captcha",
  "Please verify you are a human",
  "Pardon Our Interruption",
];

function looksLikeAntiBot(html: string): boolean {
  return ANTI_BOT_MARKERS.some((marker) => html.includes(marker));
}

const LOGIN_WALL_MARKERS: Record<string, string[]> = {
  "linkedin.com": [
    "authwall",
    "session_redirect",
    "Sign in to see who has applied",
    "Join LinkedIn",
  ],
  "indeed.com": ["Please verify you're a human"],
};

function looksLikeLoginWall(html: string, finalUrl: string): boolean {
  let host = "";
  try {
    host = new URL(finalUrl).hostname.toLowerCase();
  } catch {
    return false;
  }

  for (const [domain, markers] of Object.entries(LOGIN_WALL_MARKERS)) {
    if (host.endsWith(domain) && markers.some((m) => html.includes(m))) {
      return true;
    }
  }
  return false;
}

/**
 * Strips HTML to plain text for AI parsing.
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12_000);
}
