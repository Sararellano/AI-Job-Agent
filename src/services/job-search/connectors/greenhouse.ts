import type { CreateJobInput } from "@/types/database";
import { filterJobsByKeywords } from "@/services/job-search/keywords";
import { stripHtml } from "@/services/job-search/text";
import { fetchJson } from "@/services/job-search/connectors/http";

const GREENHOUSE_API_BASE = "https://boards-api.greenhouse.io/v1/boards";

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
    summary: department ? `${department} · ${location}` : location,
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
  boardToken: string,
  keywords: string[] = []
): Promise<CreateJobInput[]> {
  const data = await fetchJson<GreenhouseResponse>(
    `${GREENHOUSE_API_BASE}/${encodeURIComponent(boardToken)}/jobs?content=true`
  );

  const jobs = (data.jobs ?? [])
    .map((job) => mapGreenhouseJob(boardToken, job))
    .filter((job): job is CreateJobInput => job !== null);

  return filterJobsByKeywords(jobs, keywords);
}
