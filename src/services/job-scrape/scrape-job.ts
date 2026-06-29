import { isGlassdoorBlocked } from "./adapters/glassdoor";
import { isIndeedBlocked } from "./adapters/indeed";
import { isInfoJobsBlocked } from "./adapters/infojobs";
import { isLinkedInLoginWall } from "./adapters/linkedin";
import { isRemoteCoBlocked } from "./adapters/remoteco";
import { isTecnoempleoBlocked } from "./adapters/tecnoempleo";
import {
  genericJsonLdAdapter,
  resolveJobBoardAdapter,
} from "./adapters/registry";
import { htmlToPlainText } from "./fetch-job-page";
import { fetchJobPage } from "./fetch-job-page";
import { parseJobWithAi, type ScrapedJobDraft } from "./parse-job-ai";
import {
  JobScrapeError,
  type JobBoardId,
  type ScrapeJobResult,
} from "./types";

const MIN_TEXT_LENGTH = 100;

function hasAiKeys(): boolean {
  return Boolean(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY);
}

function detectBlockedPage(
  board: JobBoardId | undefined,
  html: string,
  status: number
): JobScrapeError | null {
  if (status === 403 || status === 401) {
    return new JobScrapeError(
      "FETCH_BLOCKED",
      "The job board blocked automated access to this page.",
      { board, status }
    );
  }

  if (status === 429) {
    return new JobScrapeError(
      "RATE_LIMITED",
      "Too many requests to the job board.",
      { board, status }
    );
  }

  if (board === "linkedin" && isLinkedInLoginWall(html)) {
    return new JobScrapeError(
      "FETCH_BLOCKED",
      "LinkedIn requires sign-in for this job page.",
      { board }
    );
  }

  if (board === "indeed" && isIndeedBlocked(html)) {
    return new JobScrapeError(
      "FETCH_BLOCKED",
      "Indeed blocked automated access (captcha or bot check).",
      { board }
    );
  }

  if (board === "infojobs" && isInfoJobsBlocked(html)) {
    return new JobScrapeError(
      "FETCH_BLOCKED",
      "InfoJobs blocked automated access to this page.",
      { board }
    );
  }

  if (board === "tecnoempleo" && isTecnoempleoBlocked(html)) {
    return new JobScrapeError(
      "FETCH_BLOCKED",
      "Tecnoempleo blocked automated access to this page.",
      { board }
    );
  }

  if (board === "glassdoor" && isGlassdoorBlocked(html)) {
    return new JobScrapeError(
      "FETCH_BLOCKED",
      "Glassdoor blocked automated access (sign-in or captcha).",
      { board }
    );
  }

  if (board === "remoteco" && isRemoteCoBlocked(html)) {
    return new JobScrapeError(
      "FETCH_BLOCKED",
      "Remote.co blocked automated access to this page.",
      { board }
    );
  }

  return null;
}

function mergeDraft(
  primary: ScrapedJobDraft | null,
  fallback: ScrapedJobDraft | null
): ScrapedJobDraft | null {
  if (!primary?.description) return fallback;
  if (!fallback?.description) return primary;

  return {
    title: primary.title || fallback.title,
    company: primary.company || fallback.company,
    description: primary.description,
    summary: primary.summary || fallback.summary,
    requirements: primary.requirements || fallback.requirements,
    salary: primary.salary || fallback.salary,
  };
}

/**
 * Scrapes a job posting URL using board adapters and AI fallback.
 */
export async function scrapeJobFromUrl(url: string): Promise<ScrapeJobResult> {
  const adapter = resolveJobBoardAdapter(url);
  const board: JobBoardId = adapter?.id ?? "generic";

  let html = "";
  let fetchStatus = 200;

  if (adapter?.fetchContent) {
    const custom = await adapter.fetchContent(url);
    if (custom) {
      const draft = adapter.parse(custom, url);
      if (draft?.description) {
        return { draft, url, board };
      }
      html = custom;
    }
  }

  if (!html || !html.trim().startsWith("{")) {
    try {
      const fetched = await fetchJobPage(url);
      html = fetched.html;
      fetchStatus = fetched.status;
    } catch (err) {
      if (err instanceof JobScrapeError) throw err;
      const message = err instanceof Error ? err.message : "Fetch failed";
      if (message.includes("abort") || message.includes("timeout")) {
        throw new JobScrapeError(
          "FETCH_TIMEOUT",
          "The job page took too long to respond.",
          { board }
        );
      }
      throw new JobScrapeError("FETCH_FAILED", message, { board });
    }
  }

  const blocked = detectBlockedPage(board, html, fetchStatus);
  if (blocked) throw blocked;

  const adapterDraft = adapter?.parse(html, url) ?? null;
  const genericDraft = genericJsonLdAdapter.parse(html, url);
  let draft = mergeDraft(adapterDraft, genericDraft);

  const plainLength = htmlToPlainText(html).length;
  if (!draft?.description && plainLength < MIN_TEXT_LENGTH) {
    throw new JobScrapeError(
      "EMPTY_PAGE",
      "The page returned very little readable content (often JavaScript-only portals).",
      { board }
    );
  }

  if (!draft?.description) {
    if (!hasAiKeys()) {
      throw new JobScrapeError(
        "AI_UNAVAILABLE",
        "AI parsing is not configured on the server.",
        { board }
      );
    }

    draft = await parseJobWithAi(html, url);
  }

  if (!draft?.description) {
    throw new JobScrapeError(
      "PARSE_FAILED",
      "Could not extract job details from this page.",
      { board }
    );
  }

  return { draft, url, board };
}
