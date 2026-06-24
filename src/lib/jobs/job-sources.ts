import type { JobSource } from "@/types/database";

/** Ordered list of job sources for filters and forms. */
export const ALL_JOB_SOURCES: JobSource[] = [
  "remoteok",
  "remotive",
  "weworkremotely",
  "remoteco",
  "getmanfred",
  "wellfound",
  "infojobs",
  "greenhouse",
  "lever",
  "linkedin",
  "workable",
  "manual",
  "other",
];

const VALID_JOB_SOURCES = new Set<JobSource>(ALL_JOB_SOURCES);

const SOURCE_I18N_KEYS: Record<JobSource, `addJob.source.${JobSource}`> = {
  manual: "addJob.source.manual",
  greenhouse: "addJob.source.greenhouse",
  lever: "addJob.source.lever",
  remoteok: "addJob.source.remoteok",
  remotive: "addJob.source.remotive",
  weworkremotely: "addJob.source.weworkremotely",
  remoteco: "addJob.source.remoteco",
  getmanfred: "addJob.source.getmanfred",
  linkedin: "addJob.source.linkedin",
  infojobs: "addJob.source.infojobs",
  workable: "addJob.source.workable",
  wellfound: "addJob.source.wellfound",
  other: "addJob.source.other",
};

/**
 * Normalizes nullable DB source values to a known JobSource.
 */
export function normalizeJobSource(
  source: string | null | undefined
): JobSource {
  if (source && VALID_JOB_SOURCES.has(source as JobSource)) {
    return source as JobSource;
  }
  return "other";
}

/**
 * Returns the i18n key for a job source label.
 */
export function getJobSourceLabelKey(source: JobSource): `addJob.source.${JobSource}` {
  return SOURCE_I18N_KEYS[source];
}

/**
 * Collects unique sources from jobs, sorted by ALL_JOB_SOURCES order.
 */
export function collectJobSources<T extends { source: string | null }>(
  jobs: T[]
): JobSource[] {
  const present = new Set<JobSource>();
  for (const job of jobs) {
    present.add(normalizeJobSource(job.source));
  }

  return ALL_JOB_SOURCES.filter((source) => present.has(source));
}

/**
 * Filters jobs by selected platforms. Empty selection returns no jobs.
 */
export function filterJobsBySources<T extends { source: string | null }>(
  jobs: T[],
  selectedSources: ReadonlySet<JobSource>
): T[] {
  if (selectedSources.size === 0) {
    return [];
  }

  return jobs.filter((job) =>
    selectedSources.has(normalizeJobSource(job.source))
  );
}

/**
 * Counts jobs per source for filter badges.
 */
export function countJobsBySource<T extends { source: string | null }>(
  jobs: T[]
): Map<JobSource, number> {
  const counts = new Map<JobSource, number>();
  for (const job of jobs) {
    const source = normalizeJobSource(job.source);
    counts.set(source, (counts.get(source) ?? 0) + 1);
  }
  return counts;
}
