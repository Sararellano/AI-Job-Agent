import type { CreateJobInput } from "@/types/database";
import { filterJobsByKeywords } from "@/services/job-search/keywords";
import { stripHtml } from "@/services/job-search/text";
import { fetchJson } from "@/services/job-search/connectors/http";

const MANFRED_API_BASE = "https://www.getmanfred.com/api/v2/public/offers";
const DETAIL_FETCH_LIMIT = 50;

interface ManfredCompany {
  name?: string;
  web?: string;
}

interface ManfredOfferSummary {
  id: number;
  position: string;
  slug: string;
  salaryFrom?: number;
  salaryTo?: number;
  currency?: string;
  remotePercentage?: number;
  highlights?: string[];
  locations?: string[];
  company?: ManfredCompany;
}

interface ManfredOfferDetail extends ManfredOfferSummary {
  introduction?: string;
  responsibilities?: string[];
  requirements?: string[];
  techStack?: { name?: string }[];
}

function formatManfredSalary(offer: ManfredOfferSummary): string | null {
  const { salaryFrom, salaryTo, currency = "€" } = offer;
  if (!salaryFrom && !salaryTo) {
    return null;
  }
  if (salaryFrom && salaryTo) {
    return `${currency}${salaryFrom.toLocaleString("en-US")} – ${currency}${salaryTo.toLocaleString("en-US")}`;
  }
  if (salaryFrom) {
    return `${currency}${salaryFrom.toLocaleString("en-US")}+`;
  }
  return `Up to ${currency}${salaryTo!.toLocaleString("en-US")}`;
}

function buildManfredDescription(detail: ManfredOfferDetail): string {
  const parts = [
    detail.introduction ? stripHtml(detail.introduction) : "",
    detail.responsibilities?.length
      ? `Responsibilities: ${detail.responsibilities.map(stripHtml).join(" ")}`
      : "",
    detail.requirements?.length
      ? `Requirements: ${detail.requirements.map(stripHtml).join(" ")}`
      : "",
  ].filter(Boolean);

  return parts.join("\n\n") || detail.position;
}

function mapManfredOffer(
  summary: ManfredOfferSummary,
  detail?: ManfredOfferDetail
): CreateJobInput | null {
  const title = summary.position?.trim();
  const company = summary.company?.name?.trim();
  if (!title || !company) {
    return null;
  }

  const description = detail ? buildManfredDescription(detail) : title;
  const techStack =
    detail?.techStack?.map((tech) => tech.name).filter(Boolean).join(", ") ?? null;

  const summaryParts = [
    summary.remotePercentage !== undefined
      ? `${summary.remotePercentage}% remote`
      : null,
    summary.locations?.join(", "),
    summary.highlights?.slice(0, 3).join(", "),
  ].filter(Boolean);

  return {
    title,
    company,
    description,
    summary: summaryParts.join(" · ") || "Tech · Spain/EU",
    salary: formatManfredSalary(summary),
    url: `https://www.getmanfred.com/en/job-offers/${summary.slug}`,
    source: "getmanfred",
    requirements: techStack,
  };
}

async function fetchManfredSummaries(lang: "EN" | "ES"): Promise<ManfredOfferSummary[]> {
  return fetchJson<ManfredOfferSummary[]>(
    `${MANFRED_API_BASE}?onlyActive=true&lang=${lang}`
  );
}

async function fetchManfredDetail(
  id: number,
  lang: "EN" | "ES"
): Promise<ManfredOfferDetail> {
  return fetchJson<ManfredOfferDetail>(
    `${MANFRED_API_BASE}/${id}?lang=${lang}`
  );
}

/**
 * Fetches GetManfred tech offers via the public API (no API key required).
 */
export async function fetchGetManfredJobs(
  keywords: string[] = []
): Promise<CreateJobInput[]> {
  const [enOffers, esOffers] = await Promise.all([
    fetchManfredSummaries("EN"),
    fetchManfredSummaries("ES"),
  ]);

  const summaries = new Map<number, ManfredOfferSummary>();
  [...enOffers, ...esOffers].forEach((offer) => summaries.set(offer.id, offer));

  const filtered = filterJobsByKeywords(
    [...summaries.values()]
      .map((offer) => mapManfredOffer(offer))
      .filter((job): job is CreateJobInput => job !== null),
    keywords
  );

  const jobs: CreateJobInput[] = [];
  const toDetail = filtered.slice(0, DETAIL_FETCH_LIMIT);

  for (const job of toDetail) {
    const summary = [...summaries.values()].find(
      (offer) => `https://www.getmanfred.com/en/job-offers/${offer.slug}` === job.url
    );
    if (!summary) {
      jobs.push(job);
      continue;
    }

    try {
      const detail = await fetchManfredDetail(summary.id, "EN");
      const mapped = mapManfredOffer(summary, detail);
      if (mapped) {
        jobs.push(mapped);
      }
    } catch {
      jobs.push(job);
    }
  }

  const detailedUrls = new Set(jobs.map((job) => job.url));
  for (const job of filtered.slice(DETAIL_FETCH_LIMIT)) {
    if (!detailedUrls.has(job.url)) {
      jobs.push(job);
    }
  }

  return jobs;
}
