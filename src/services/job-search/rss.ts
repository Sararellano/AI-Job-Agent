import { stripHtml } from "@/services/job-search/text";

export interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
  category?: string;
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function extractTag(block: string, tag: string): string {
  const cdata = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`,
    "i"
  );
  const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = block.match(cdata) ?? block.match(plain);
  return match ? decodeXmlEntities(match[1].trim()) : "";
}

/**
 * Parses RSS 2.0 XML into job feed items.
 */
export function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match = itemRegex.exec(xml);

  while (match) {
    const block = match[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");

    if (title && link) {
      items.push({
        title,
        link,
        description: stripHtml(extractTag(block, "description")),
        pubDate: extractTag(block, "pubDate") || undefined,
        category: extractTag(block, "category") || undefined,
      });
    }

    match = itemRegex.exec(xml);
  }

  return items;
}

/**
 * Splits WWR titles formatted as "Company: Role".
 */
export function splitCompanyAndTitle(title: string): {
  company: string;
  role: string;
} {
  const parts = title.split(":");
  if (parts.length < 2) {
    return { company: "Unknown", role: title.trim() };
  }

  return {
    company: parts[0]?.trim() || "Unknown",
    role: parts.slice(1).join(":").trim() || title.trim(),
  };
}
