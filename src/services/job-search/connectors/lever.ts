import type { CreateJobInput } from "@/types/database";
import { filterJobsByKeywords } from "@/services/job-search/keywords";
import { stripHtml } from "@/services/job-search/text";
import { fetchJson } from "@/services/job-search/connectors/http";

const LEVER_API_BASE = "https://api.lever.co/v0/postings";

interface LeverPosting {
  id: string;
  text: string;
  hostedUrl: string;
  description?: string;
  descriptionPlain?: string;
  categories?: {
    team?: string;
    location?: string;
    commitment?: string;
  };
}

function mapLeverPosting(company: string, posting: LeverPosting): CreateJobInput | null {
  const description = (
    posting.descriptionPlain ?? stripHtml(posting.description ?? "")
  ).trim();

  if (!description) {
    return null;
  }

  const location = posting.categories?.location ?? "Remote";
  const team = posting.categories?.team;
  const commitment = posting.categories?.commitment;
  const summaryParts = [team, location, commitment].filter(Boolean);

  return {
    title: posting.text.trim(),
    company,
    description,
    summary: summaryParts.length > 0 ? summaryParts.join(" · ") : null,
    salary: null,
    url: posting.hostedUrl,
    source: "lever",
    requirements: null,
  };
}

/**
 * Fetches public job postings from a Lever company slug.
 */
export async function fetchLeverJobs(
  company: string,
  keywords: string[] = []
): Promise<CreateJobInput[]> {
  const data = await fetchJson<LeverPosting[]>(
    `${LEVER_API_BASE}/${encodeURIComponent(company)}?mode=json`
  );

  const jobs = data
    .map((posting) => mapLeverPosting(company, posting))
    .filter((job): job is CreateJobInput => job !== null);

  return filterJobsByKeywords(jobs, keywords);
}
