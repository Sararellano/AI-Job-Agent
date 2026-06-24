import type { CreateJobInput } from "@/types/database";
import {
  formatSalaryRange,
  matchesKeywords,
  stripHtml,
} from "@/services/job-search/text";

const REMOTEOK_API_URL = "https://remoteok.com/api";
const FETCH_TIMEOUT_MS = 20_000;

interface RemoteOkJob {
  id?: string;
  slug?: string;
  url?: string;
  position?: string;
  company?: string;
  description?: string;
  tags?: string[];
  salary_min?: number | null;
  salary_max?: number | null;
  location?: string;
}

async function fetchRemoteOkPayload(): Promise<RemoteOkJob[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(REMOTEOK_API_URL, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "AI-Job-Agent/1.0 (+https://github.com/Sararellano/AI-Job-Agent)",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as RemoteOkJob[];
    return Array.isArray(data) ? data.slice(1) : [];
  } finally {
    clearTimeout(timeout);
  }
}

function mapRemoteOkJob(job: RemoteOkJob): CreateJobInput | null {
  const title = job.position?.trim();
  const company = job.company?.trim();
  const description = stripHtml(job.description ?? "");

  if (!title || !company || !description) {
    return null;
  }

  const url =
    job.url ??
    (job.slug ? `https://remoteok.com/remote-jobs/${job.slug}` : null);

  if (!url) {
    return null;
  }

  const tags = (job.tags ?? []).join(", ");
  const location = job.location?.trim();

  return {
    title,
    company,
    description,
    summary: [location, tags].filter(Boolean).join(" · ") || "Remote",
    salary: formatSalaryRange(job.salary_min, job.salary_max),
    url,
    source: "remoteok",
    requirements: tags || null,
  };
}

/**
 * Fetches RemoteOK postings and optionally filters by keywords.
 */
export async function fetchRemoteOkJobs(
  keywords: string[] = []
): Promise<CreateJobInput[]> {
  const jobs = await fetchRemoteOkPayload();

  return jobs
    .map((job) => mapRemoteOkJob(job))
    .filter((job): job is CreateJobInput => job !== null)
    .filter((job) =>
      matchesKeywords(
        `${job.title} ${job.company} ${job.description} ${job.requirements ?? ""}`,
        keywords
      )
    );
}
