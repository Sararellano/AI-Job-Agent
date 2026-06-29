export { fetchJobPage, htmlToPlainText, type FetchJobPageResult } from "./fetch-job-page";
export { parseJobWithAi, type ScrapedJobDraft } from "./parse-job-ai";
export { scrapeJobFromUrl } from "./scrape-job";
export {
  JobScrapeError,
  type JobBoardId,
  type ScrapeErrorCode,
  type ScrapeJobResult,
} from "./types";
export { extractLinkedInJobId } from "./adapters/linkedin";
export { extractIndeedJobKey } from "./adapters/indeed";
