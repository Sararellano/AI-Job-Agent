import type { EnKeys } from "@/lib/i18n";
import type { JobBoardId, ScrapeErrorCode } from "@/services/job-scrape/types";

type TranslateFn = (key: EnKeys, vars?: Record<string, string | number>) => string;

const BOARD_BLOCKED_KEYS: Partial<Record<JobBoardId, EnKeys>> = {
  linkedin: "newJob.scrapeError.linkedin.blocked",
  indeed: "newJob.scrapeError.indeed.blocked",
  infojobs: "newJob.scrapeError.infojobs.blocked",
};

const CODE_KEYS: Record<ScrapeErrorCode, EnKeys> = {
  INVALID_URL: "newJob.scrapeError.INVALID_URL",
  UNAUTHORIZED: "newJob.scrapeError.UNAUTHORIZED",
  RATE_LIMITED: "newJob.scrapeError.RATE_LIMITED",
  FETCH_BLOCKED: "newJob.scrapeError.FETCH_BLOCKED",
  FETCH_TIMEOUT: "newJob.scrapeError.FETCH_TIMEOUT",
  FETCH_FAILED: "newJob.scrapeError.FETCH_FAILED",
  EMPTY_PAGE: "newJob.scrapeError.EMPTY_PAGE",
  PARSE_FAILED: "newJob.scrapeError.PARSE_FAILED",
  AI_UNAVAILABLE: "newJob.scrapeError.AI_UNAVAILABLE",
};

function isScrapeErrorCode(value: string): value is ScrapeErrorCode {
  return value in CODE_KEYS;
}

function isJobBoardId(value: string): value is JobBoardId {
  return value === "linkedin" || value === "indeed" || value === "infojobs" || value === "generic";
}

/**
 * Maps scrape API error payloads to localized user-facing messages.
 */
export function resolveScrapeErrorMessage(
  t: TranslateFn,
  payload: { code?: string; board?: string | null; error?: string }
): string {
  const code = payload.code && isScrapeErrorCode(payload.code)
    ? payload.code
    : null;

  if (code === "FETCH_BLOCKED" && payload.board && isJobBoardId(payload.board)) {
    const boardKey = BOARD_BLOCKED_KEYS[payload.board];
    if (boardKey) return t(boardKey);
  }

  if (code) {
    return t(CODE_KEYS[code]);
  }

  return payload.error ?? t("newJob.scrapeFailed");
}
