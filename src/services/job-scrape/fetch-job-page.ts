const FETCH_TIMEOUT_MS = 15_000;
const MAX_HTML_LENGTH = 500_000;

/**
 * Fetches a job posting page HTML server-side.
 * Uses a realistic browser User-Agent to reduce bot-detection blocks.
 */
export async function fetchJobPage(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();
    return html.slice(0, MAX_HTML_LENGTH);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Strips HTML to plain text for AI parsing.
 * Attempts to isolate the main content area before stripping tags.
 */
export function htmlToPlainText(html: string): string {
  // Remove non-content blocks first
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  // Prefer the primary content container if present
  const main = extractMainContent(stripped);
  const source = main ?? stripped;

  return source
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12_000);
}

/**
 * Extracts the innerHTML of the most likely main content element.
 * Checks <main>, <article>, and common job-content CSS class patterns.
 */
function extractMainContent(html: string): string | null {
  const candidates = [
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    // Common job-board container class names
    /<[^>]+class="[^"]*(?:job-description|jobDescription|job_description|posting-content|job-content|job-details|jobDetails|description-content|jd-content)[^"]*"[^>]*>([\s\S]*?)<\/[a-z]+>/i,
    /<[^>]+id="[^"]*(?:job-description|jobDescription|posting-content|job-content|jobDetails)[^"]*"[^>]*>([\s\S]*?)<\/[a-z]+>/i,
  ];

  for (const pattern of candidates) {
    const match = pattern.exec(html);
    if (match?.[1] && match[1].length > 200) {
      return match[1];
    }
  }

  return null;
}
