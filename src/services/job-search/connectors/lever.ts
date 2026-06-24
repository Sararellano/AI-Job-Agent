import type { CreateJobInput } from "@/types/database";
import { stripHtml } from "@/services/job-search/text";

const LEVER_API_BASE = "https://api.lever.co/v0/postings";
const FETCH_TIMEOUT_MS = 15_000;

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

function mapLeverPosting(company: string, posting: LeverPosting): CreateJobInput | null {
  const description = (
    posting.descriptionPlain ??
    stripHtml(posting.description ?? "")
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
export async function fetchLeverJobs(company: string): Promise<CreateJobInput[]> {
  const data = await fetchJson<LeverPosting[]>(
    `${LEVER_API_BASE}/${encodeURIComponent(company)}?mode=json`
  );

  return data
    .map((posting) => mapLeverPosting(company, posting))
    .filter((job): job is CreateJobInput => job !== null);
}
