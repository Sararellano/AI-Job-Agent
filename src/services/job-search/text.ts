/**
 * Strips HTML tags and collapses whitespace for job descriptions.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Returns true when text matches at least one keyword (case-insensitive).
 * Empty keyword list matches everything.
 */
export function matchesKeywords(text: string, keywords: string[]): boolean {
  if (keywords.length === 0) {
    return true;
  }

  const haystack = text.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

/**
 * Formats a salary range label from min/max annual values.
 */
export function formatSalaryRange(
  min?: number | null,
  max?: number | null,
  currency = "USD"
): string | null {
  if (!min && !max) {
    return null;
  }

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  if (min && max) {
    return `${formatter.format(min)} – ${formatter.format(max)}`;
  }

  if (min) {
    return `${formatter.format(min)}+`;
  }

  return `Up to ${formatter.format(max!)}`;
}
