import { htmlToPlainText } from "./fetch-job-page";
import type { ScrapedJobDraft } from "./parse-job-ai";

const FETCH_TIMEOUT_MS = 15_000;

/**
 * Identifies which ATS platform (if any) a job URL belongs to.
 * Returns the platform key or null for generic/unknown URLs.
 */
export function detectAts(
  url: string
): "greenhouse" | "lever" | "workable" | null {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes("greenhouse.io")) return "greenhouse";
  if (host.includes("lever.co")) return "lever";
  if (host.includes("workable.com")) return "workable";
  return null;
}

/**
 * Attempts to fetch job data via the platform's public JSON API.
 * Returns a ScrapedJobDraft or null if the URL pattern is not recognised
 * or the API call fails.
 */
export async function fetchAtsJob(
  url: string
): Promise<ScrapedJobDraft | null> {
  const ats = detectAts(url);
  if (!ats) return null;

  try {
    if (ats === "greenhouse") return await fetchGreenhouseJob(url);
    if (ats === "lever") return await fetchLeverJob(url);
    if (ats === "workable") return await fetchWorkableJob(url);
  } catch (err) {
    console.error(`[ats-parsers] ${ats} fetch failed:`, err);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Greenhouse
// URL patterns:
//   https://boards.greenhouse.io/{board_token}/jobs/{job_id}
//   https://job-boards.greenhouse.io/{board_token}/jobs/{job_id}
//   https://boards.greenhouse.io/embed/job_app?for={board_token}&token={job_id}
// ---------------------------------------------------------------------------
async function fetchGreenhouseJob(url: string): Promise<ScrapedJobDraft | null> {
  const parsed = new URL(url);
  let boardToken: string | null = null;
  let jobId: string | null = null;

  // boards.greenhouse.io/{board}/jobs/{id}
  const pathMatch = parsed.pathname.match(/^\/([^/]+)\/jobs\/(\d+)/);
  if (pathMatch) {
    boardToken = pathMatch[1];
    jobId = pathMatch[2];
  }

  // embed form: ?for={board}&token={id}
  if (!boardToken) {
    const forParam = parsed.searchParams.get("for");
    const tokenParam = parsed.searchParams.get("token");
    if (forParam && tokenParam) {
      boardToken = forParam;
      jobId = tokenParam;
    }
  }

  if (!boardToken || !jobId) return null;

  const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs/${jobId}`;
  const res = await timedFetch(apiUrl);
  if (!res.ok) throw new Error(`Greenhouse API ${res.status}`);

  const data = (await res.json()) as GreenhouseJob;

  const companyRes = await timedFetch(
    `https://boards-api.greenhouse.io/v1/boards/${boardToken}`
  ).catch(() => null);
  const companyData = companyRes?.ok
    ? ((await companyRes.json()) as { name?: string })
    : null;

  const description = htmlToPlainText(data.content ?? "");
  if (!description) return null;

  const location =
    data.location?.name ??
    data.offices?.map((o) => o.name).join(", ") ??
    "";

  return {
    title: data.title ?? "",
    company: companyData?.name ?? boardToken,
    description,
    summary: buildSummary(data.title, companyData?.name ?? boardToken, location),
    requirements: extractRequirements(description),
    salary: "",
  };
}

interface GreenhouseJob {
  id: number;
  title: string;
  content: string;
  location?: { name: string };
  offices?: { name: string }[];
}

// ---------------------------------------------------------------------------
// Lever
// URL patterns:
//   https://jobs.lever.co/{company}/{posting_uuid}
//   https://jobs.lever.co/{company}/{posting_uuid}/apply
// ---------------------------------------------------------------------------
async function fetchLeverJob(url: string): Promise<ScrapedJobDraft | null> {
  const pathMatch = new URL(url).pathname.match(
    /^\/([^/]+)\/([0-9a-f-]{36})/i
  );
  if (!pathMatch) return null;

  const company = pathMatch[1];
  const postingId = pathMatch[2];
  const apiUrl = `https://api.lever.co/v0/postings/${company}/${postingId}?mode=json`;

  const res = await timedFetch(apiUrl);
  if (!res.ok) throw new Error(`Lever API ${res.status}`);

  const data = (await res.json()) as LeverPosting;

  const sections = [
    data.descriptionPlain ?? "",
    ...(data.lists ?? []).map((l) => `${l.text}:\n${l.content}`),
    data.additionalPlain ?? "",
  ]
    .filter(Boolean)
    .join("\n\n");

  if (!sections.trim()) return null;

  const requirements = (data.lists ?? [])
    .map((l) => `${l.text}:\n${l.content}`)
    .join("\n\n");

  return {
    title: data.text ?? "",
    company: data.categories?.team ?? company,
    description: sections,
    summary: buildSummary(
      data.text,
      data.categories?.team ?? company,
      data.categories?.location ?? ""
    ),
    requirements,
    salary: data.salaryRange
      ? `${data.salaryRange.min}–${data.salaryRange.max} ${data.salaryRange.currency ?? ""}`
      : "",
  };
}

interface LeverPosting {
  id: string;
  text: string;
  descriptionPlain?: string;
  additionalPlain?: string;
  lists?: { text: string; content: string }[];
  categories?: {
    team?: string;
    location?: string;
    commitment?: string;
    department?: string;
  };
  salaryRange?: { min: number; max: number; currency?: string };
}

// ---------------------------------------------------------------------------
// Workable
// URL patterns:
//   https://apply.workable.com/{company}/j/{slug}/
//   https://{company}.workable.com/j/{slug}
// ---------------------------------------------------------------------------
async function fetchWorkableJob(url: string): Promise<ScrapedJobDraft | null> {
  const parsed = new URL(url);
  let company: string | null = null;
  let slug: string | null = null;

  // apply.workable.com/{company}/j/{slug}
  const centralMatch = parsed.pathname.match(/^\/([^/]+)\/j\/([^/]+)/);
  if (centralMatch && parsed.hostname === "apply.workable.com") {
    company = centralMatch[1];
    slug = centralMatch[2];
  }

  // {company}.workable.com/j/{slug}
  const subdomain = parsed.hostname.match(/^([^.]+)\.workable\.com$/);
  if (!company && subdomain) {
    company = subdomain[1];
    const subSlugMatch = parsed.pathname.match(/^\/j\/([^/]+)/);
    if (subSlugMatch) slug = subSlugMatch[1];
  }

  if (!company || !slug) return null;

  // Workable widget API (public, no auth required)
  const apiUrl = `https://apply.workable.com/api/v1/widget/accounts/${company}/jobs/${slug}`;
  const res = await timedFetch(apiUrl);
  if (!res.ok) throw new Error(`Workable API ${res.status}`);

  const data = (await res.json()) as WorkableJob;

  const description = htmlToPlainText(data.description ?? "");
  if (!description) return null;

  const requirements = htmlToPlainText(data.requirements ?? "");
  const salary = data.salary_from
    ? `${data.salary_from}–${data.salary_to ?? ""} ${data.salary_currency ?? ""}`
    : "";

  return {
    title: data.title ?? "",
    company: data.account?.name ?? company,
    description,
    summary: buildSummary(
      data.title ?? "",
      data.account?.name ?? company,
      data.location?.city ?? ""
    ),
    requirements,
    salary,
  };
}

interface WorkableJob {
  title?: string;
  description?: string;
  requirements?: string;
  salary_from?: number;
  salary_to?: number;
  salary_currency?: string;
  location?: { city?: string; country?: string };
  account?: { name?: string };
}

// ---------------------------------------------------------------------------
// JSON-LD schema.org/JobPosting extractor
// Works on any page HTML that includes structured data for SEO.
// Many portals include this: LinkedIn, Indeed, Glassdoor, InfoJobs, etc.
// ---------------------------------------------------------------------------
/**
 * Extracts schema.org JobPosting structured data from raw HTML.
 * Returns a draft or null if no valid JobPosting block is found.
 */
export function extractJsonLdJob(html: string): ScrapedJobDraft | null {
  const scriptRegex =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const raw = JSON.parse(match[1].trim());
      const block = findJobPosting(raw);
      if (!block) continue;

      const description = cleanLdText(
        block.description ?? block.jobDescription ?? ""
      );
      if (!description) continue;

      const hiringOrg = block.hiringOrganization;
      const company =
        hiringOrg !== null && typeof hiringOrg === "object"
          ? cleanLdText((hiringOrg as Record<string, unknown>).name ?? "")
          : cleanLdText(String(hiringOrg ?? ""));

      const jobLocation = block.jobLocation;
      const address =
        jobLocation !== null && typeof jobLocation === "object"
          ? (jobLocation as Record<string, unknown>).address
          : undefined;
      const addressObj =
        address !== null && typeof address === "object" ? (address as Record<string, unknown>) : undefined;
      const location = cleanLdText(
        String(addressObj?.addressLocality ?? addressObj?.addressRegion ?? "")
      );

      const salary = extractLdSalary(block);
      const titleStr = cleanLdText(block.title ?? "");

      return {
        title: titleStr,
        company,
        description,
        summary: buildSummary(titleStr, company, location),
        requirements: extractRequirements(description),
        salary,
      };
    } catch {
      // malformed JSON-LD, try next block
    }
  }

  return null;
}

// Recursively search for the first @type=JobPosting in an LD graph
function findJobPosting(node: unknown): Record<string, unknown> | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const result = findJobPosting(item);
      if (result) return result;
    }
    return null;
  }
  const obj = node as Record<string, unknown>;
  const type = String(obj["@type"] ?? "");
  if (type === "JobPosting") return obj;

  // @graph array
  if (Array.isArray(obj["@graph"])) {
    return findJobPosting(obj["@graph"]);
  }
  return null;
}

function cleanLdText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20_000);
}

function extractLdSalary(block: Record<string, unknown>): string {
  const bs = block.baseSalary as Record<string, unknown> | undefined;
  if (!bs) return "";
  const value = bs.value as Record<string, unknown> | undefined;
  if (!value) return "";
  const min = value.minValue ?? value.value ?? "";
  const max = value.maxValue ?? "";
  const currency = String(bs.currency ?? "");
  if (!min) return "";
  return max ? `${min}–${max} ${currency}`.trim() : `${min} ${currency}`.trim();
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
function buildSummary(title: string, company: string, location: string): string {
  const parts = [title, company, location].filter(Boolean);
  return parts.join(" · ").slice(0, 200);
}

/**
 * Heuristically extracts requirements from plain text description.
 * Looks for sections labelled "requirements", "qualifications", etc.
 */
function extractRequirements(text: string): string {
  const markers = [
    /requirements?[:：]/i,
    /qualifications?[:：]/i,
    /what you.ll need[:：]/i,
    /what we.re looking for[:：]/i,
    /requisitos?[:：]/i,
    /perfil requerido[:：]/i,
  ];

  for (const marker of markers) {
    const idx = text.search(marker);
    if (idx !== -1) {
      return text.slice(idx, idx + 2000).trim();
    }
  }
  return "";
}

function timedFetch(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, {
    signal: controller.signal,
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AIJobAgent/1.0)" },
  }).finally(() => clearTimeout(timer));
}
