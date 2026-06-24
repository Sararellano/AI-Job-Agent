import type { CreateJobInput } from "@/types/database";
import {
  buildInfoJobsQueries,
  filterJobsByKeywords,
} from "@/services/job-search/keywords";
import { fetchJson } from "@/services/job-search/connectors/http";

const INFOJOBS_API_BASE = "https://api.infojobs.net/api/1/offer";
const INFOJOBS_COUNTRY = "espana";
const MAX_PAGES_PER_QUERY = 2;

interface InfoJobsOffer {
  id: string;
  title: string;
  link: string;
  city?: string;
  requirementMin?: string;
  author?: { name?: string };
  province?: { value?: string };
  category?: { value?: string };
  salaryMin?: { value?: string };
  salaryMax?: { value?: string };
}

interface InfoJobsResponse {
  offers?: InfoJobsOffer[];
  totalPages?: number;
}

function getInfoJobsAuthHeader(): string | null {
  const clientId = process.env.INFOJOBS_CLIENT_ID;
  const clientSecret = process.env.INFOJOBS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return null;
  }
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

function mapInfoJobsOffer(offer: InfoJobsOffer): CreateJobInput | null {
  const title = offer.title?.trim();
  const company = offer.author?.name?.trim();
  const description = offer.requirementMin?.trim() ?? title;
  const url = offer.link?.trim();

  if (!title || !company || !description || !url) {
    return null;
  }

  const location = [offer.city, offer.province?.value].filter(Boolean).join(", ");
  const salary = [offer.salaryMin?.value, offer.salaryMax?.value]
    .filter((value) => value && value.length > 0)
    .join(" – ");

  return {
    title,
    company,
    description,
    summary: [offer.category?.value, location].filter(Boolean).join(" · ") || null,
    salary: salary || null,
    url,
    source: "infojobs",
    requirements: offer.requirementMin ?? null,
  };
}

function buildInfoJobsParams(
  query: string,
  page: number,
  provinces: string[]
): URLSearchParams {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    maxResults: "30",
    order: "relevancia-desc",
  });

  if (provinces.length > 0) {
    for (const province of provinces) {
      params.append("province", province);
    }
  } else {
    params.set("country", INFOJOBS_COUNTRY);
  }

  return params;
}

async function fetchInfoJobsPage(
  query: string,
  page: number,
  provinces: string[] = []
): Promise<InfoJobsOffer[]> {
  const auth = getInfoJobsAuthHeader();
  if (!auth) {
    throw new Error("InfoJobs credentials are not configured");
  }

  const params = buildInfoJobsParams(query, page, provinces);
  const data = await fetchJson<InfoJobsResponse>(
    `${INFOJOBS_API_BASE}?${params.toString()}`,
    {
      headers: { Authorization: auth },
    }
  );

  return data.offers ?? [];
}

/**
 * Fetches InfoJobs offers using the official API and profile-driven queries.
 * When provinces is empty, searches all of Spain (country=espana).
 */
export async function fetchInfoJobsJobs(
  keywords: string[] = [],
  provinces: string[] = []
): Promise<CreateJobInput[]> {
  const queries = buildInfoJobsQueries(keywords);
  const deduped = new Map<string, CreateJobInput>();

  for (const query of queries) {
    for (let page = 1; page <= MAX_PAGES_PER_QUERY; page += 1) {
      const offers = await fetchInfoJobsPage(query, page, provinces);
      if (offers.length === 0) {
        break;
      }

      for (const offer of offers) {
        const job = mapInfoJobsOffer(offer);
        if (job) {
          deduped.set(job.url, job);
        }
      }
    }
  }

  return filterJobsByKeywords([...deduped.values()], keywords);
}

export function hasInfoJobsCredentials(): boolean {
  return getInfoJobsAuthHeader() !== null;
}

export function formatInfoJobsSyncTarget(provinces: string[]): string {
  if (provinces.length === 0) {
    return "espana";
  }
  return provinces.join(",");
}
