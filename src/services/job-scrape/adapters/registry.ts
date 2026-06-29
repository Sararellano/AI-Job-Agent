import { extractJsonLdJobPosting } from "../extract-json-ld";
import { extractMetaJobData } from "../extract-meta";
import type { JobBoardAdapter } from "../types";
import { glassdoorAdapter } from "./glassdoor";
import { indeedAdapter } from "./indeed";
import { infoJobsAdapter } from "./infojobs";
import { linkedInAdapter } from "./linkedin";
import { remoteCoAdapter } from "./remoteco";
import { tecnoempleoAdapter } from "./tecnoempleo";

const ADAPTERS: JobBoardAdapter[] = [
  linkedInAdapter,
  infoJobsAdapter,
  indeedAdapter,
  tecnoempleoAdapter,
  glassdoorAdapter,
  remoteCoAdapter,
];

/**
 * Resolves the best adapter for a job posting URL.
 */
export function resolveJobBoardAdapter(url: string): JobBoardAdapter | null {
  return ADAPTERS.find((adapter) => adapter.matchesUrl(url)) ?? null;
}

export const genericJsonLdAdapter: JobBoardAdapter = {
  id: "generic",
  matchesUrl: () => true,
  parse(content) {
    return extractJsonLdJobPosting(content) ?? extractMetaJobData(content);
  },
};

export {
  glassdoorAdapter,
  indeedAdapter,
  infoJobsAdapter,
  linkedInAdapter,
  remoteCoAdapter,
  tecnoempleoAdapter,
};
