const FETCH_TIMEOUT_MS = 15_000;
const MAX_HTML_LENGTH = 500_000;

/**
 * Fetches a job posting page HTML server-side.
 */
export async function fetchJobPage(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AIJobAgent/1.0; +https://github.com/ai-job-agent)",
        Accept: "text/html,application/xhtml+xml",
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
