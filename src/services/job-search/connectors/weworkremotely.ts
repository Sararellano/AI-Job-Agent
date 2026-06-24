import type { CreateJobInput } from "@/types/database";
import { filterJobsByKeywords } from "@/services/job-search/keywords";
import { parseRss, splitCompanyAndTitle } from "@/services/job-search/rss";
import { fetchText } from "@/services/job-search/connectors/http";

const WWR_BASE = "https://weworkremotely.com";

export const DEFAULT_WWR_CATEGORIES = [
  "remote-programming-jobs",
  "remote-full-stack-programming-jobs",
  "remote-back-end-programming-jobs",
  "remote-front-end-programming-jobs",
  "remote-devops-sysadmin-jobs",
  "remote-product-jobs",
  "remote-management-and-finance-jobs",
  "all-other-remote-jobs",
];

function mapWwrItem(item: {
  title: string;
  link: string;
  description: string;
  category?: string;
}): CreateJobInput | null {
  const { company, role } = splitCompanyAndTitle(item.title);
  const description = item.description.trim() || role;

  if (!role || !description) {
    return null;
  }

  return {
    title: role,
    company,
    description,
    summary: item.category ?? "Remote",
    salary: null,
    url: item.link,
    source: "weworkremotely",
    requirements: null,
  };
}

/**
 * Fetches We Work Remotely listings from public RSS feeds.
 */
export async function fetchWeWorkRemotelyJobs(
  keywords: string[] = [],
  categories: string[] = DEFAULT_WWR_CATEGORIES
): Promise<CreateJobInput[]> {
  const deduped = new Map<string, CreateJobInput>();

  for (const category of categories) {
    const xml = await fetchText(`${WWR_BASE}/categories/${category}.rss`);
    const items = parseRss(xml);

    for (const item of items) {
      const mapped = mapWwrItem(item);
      if (mapped) {
        deduped.set(mapped.url, mapped);
      }
    }
  }

  return filterJobsByKeywords([...deduped.values()], keywords);
}
