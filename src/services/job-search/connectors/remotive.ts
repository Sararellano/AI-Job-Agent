import type { CreateJobInput } from "@/types/database";
import { filterJobsByKeywords } from "@/services/job-search/keywords";
import { stripHtml } from "@/services/job-search/text";
import { fetchJson } from "@/services/job-search/connectors/http";

const REMOTIVE_API_URL = "https://remotive.com/api/remote-jobs";

export const DEFAULT_REMOTIVE_CATEGORIES = [
  "software-dev",
  "devops-sysadmin",
  "product",
  "data",
  "qa",
  "finance-legal",
  "customer-support",
];

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  category: string;
  job_type?: string;
  publication_date: string;
  candidate_required_location?: string;
  salary?: string;
  description: string;
  tags?: string[];
}

interface RemotiveResponse {
  jobs: RemotiveJob[];
}

function mapRemotiveJob(job: RemotiveJob): CreateJobInput | null {
  const description = stripHtml(job.description);
  if (!description) {
    return null;
  }

  const summaryParts = [
    job.category,
    job.candidate_required_location,
    job.job_type?.replace(/_/g, " "),
  ].filter(Boolean);

  return {
    title: job.title.trim(),
    company: job.company_name.trim(),
    description,
    summary: summaryParts.join(" · ") || "Remote",
    salary: job.salary?.trim() || null,
    url: job.url,
    source: "remotive",
    requirements: job.tags?.join(", ") || null,
  };
}

/**
 * Fetches Remotive postings (24h delayed per Remotive API terms).
 */
export async function fetchRemotiveJobs(
  keywords: string[] = [],
  categories: string[] = DEFAULT_REMOTIVE_CATEGORIES
): Promise<CreateJobInput[]> {
  const deduped = new Map<string, CreateJobInput>();

  for (const category of categories) {
    const data = await fetchJson<RemotiveResponse>(
      `${REMOTIVE_API_URL}?category=${encodeURIComponent(category)}`
    );

    for (const job of data.jobs ?? []) {
      const mapped = mapRemotiveJob(job);
      if (mapped) {
        deduped.set(mapped.url, mapped);
      }
    }
  }

  return filterJobsByKeywords([...deduped.values()], keywords);
}
