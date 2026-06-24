import type { CreateJobInput } from "@/types/database";
import { filterJobsByKeywords } from "@/services/job-search/keywords";
import { parseRss, splitCompanyAndTitle } from "@/services/job-search/rss";
import { fetchText } from "@/services/job-search/connectors/http";

const REMOTE_CO_FEEDS = [
  "https://remote.co/remote-jobs/feed/",
  "https://www.remote.co/remote-jobs/feed/",
];

function mapRemoteCoItem(item: {
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
    source: "remoteco",
    requirements: null,
  };
}

/**
 * Fetches Remote.co listings from the public RSS feed.
 */
export async function fetchRemoteCoJobs(
  keywords: string[] = []
): Promise<CreateJobInput[]> {
  let lastError: Error | null = null;

  for (const feedUrl of REMOTE_CO_FEEDS) {
    try {
      const xml = await fetchText(feedUrl, { timeoutMs: 30_000 });
      const jobs = parseRss(xml)
        .map((item) => mapRemoteCoItem(item))
        .filter((job): job is CreateJobInput => job !== null);

      return filterJobsByKeywords(jobs, keywords);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Remote.co sync failed");
    }
  }

  throw lastError ?? new Error("Remote.co RSS feed is unavailable");
}
