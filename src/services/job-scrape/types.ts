import type { ScrapedJobDraft } from "./parse-job-ai";

export type ScrapeErrorCode =
  | "INVALID_URL"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "FETCH_BLOCKED"
  | "FETCH_TIMEOUT"
  | "FETCH_FAILED"
  | "EMPTY_PAGE"
  | "PARSE_FAILED"
  | "AI_UNAVAILABLE";

export type JobBoardId =
  | "linkedin"
  | "infojobs"
  | "indeed"
  | "generic";

export interface ScrapeJobResult {
  draft: ScrapedJobDraft;
  url: string;
  board: JobBoardId;
}

export interface JobBoardAdapter {
  id: JobBoardId;
  matchesUrl: (url: string) => boolean;
  /**
   * Optional custom fetch before HTML parsing (e.g. LinkedIn guest API).
   */
  fetchContent?: (url: string) => Promise<string | null>;
  parse: (content: string, url: string) => ScrapedJobDraft | null;
}

export class JobScrapeError extends Error {
  readonly code: ScrapeErrorCode;
  readonly board?: JobBoardId;
  readonly status?: number;

  constructor(
    code: ScrapeErrorCode,
    message: string,
    options?: { board?: JobBoardId; status?: number }
  ) {
    super(message);
    this.name = "JobScrapeError";
    this.code = code;
    this.board = options?.board;
    this.status = options?.status;
  }
}
