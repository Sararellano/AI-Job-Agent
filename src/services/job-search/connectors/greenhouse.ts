import type { CreateJobInput } from "@/types/database";
import { stripHtml } from "@/services/job-search/text";

const GREENHOUSE_API_BASE = "https://boards-api.greenhouse.io/v1/boards";
const FETCH_TIMEOUT_MS = 15_000;

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  content?: string;
  location?: { name?: string };
  departments?: { name?: string }[];
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
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

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function mapGreenhouseJob(boardToken: string, job: GreenhouseJob): CreateJobInput | null {
  const description = stripHtml(job.content ?? job.title);
  if (!description) {
    return null;
  }

  const location = job.location?.name ?? "Remote";
  const department = job.departments?.[0]?.name;

  return {
    title: job.title.trim(),
    company: boardToken,
    description,
    summary: department
      ? `${department} · ${location}`
      : location,
    salary: null,
    url: job.absolute_url,
    source: "greenhouse",
    requirements: null,
  };
}

/**
 * Fetches public job postings from a Greenhouse board token.
 */
export async function fetchGreenhouseJobs(
  boardToken: string
): Promise<CreateJobInput[]> {
  const data = await fetchJson<GreenhouseResponse>(
    `${GREENHOUSE_API_BASE}/${encodeURIComponent(boardToken)}/jobs?content=true`
  );

  return (data.jobs ?? [])
    .map((job) => mapGreenhouseJob(boardToken, job))
    .filter((job): job is CreateJobInput => job !== null);
}
