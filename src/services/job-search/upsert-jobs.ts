import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateJobInput } from "@/types/database";
import { normalizeJobUrl } from "@/lib/security/validation";

export interface UpsertJobsResult {
  inserted: number;
  skipped: number;
  errors: string[];
}

function toRow(job: CreateJobInput & { url: string }) {
  return {
    title: job.title,
    company: job.company,
    description: job.description,
    summary: job.summary,
    salary: job.salary,
    url: job.url,
    source: job.source,
    requirements: job.requirements,
  };
}

/**
 * Inserts new job postings and skips URLs that already exist.
 */
export async function upsertJobs(
  supabase: SupabaseClient,
  jobs: CreateJobInput[]
): Promise<UpsertJobsResult> {
  const validJobs = jobs
    .map((job) => {
      const url = normalizeJobUrl(job.url);
      if (!url) {
        return null;
      }
      return { ...job, url };
    })
    .filter((job): job is CreateJobInput & { url: string } => job !== null);

  if (validJobs.length === 0) {
    return { inserted: 0, skipped: 0, errors: [] };
  }

  const urls = [...new Set(validJobs.map((job) => job.url))];
  const { data: existingRows, error: selectError } = await supabase
    .from("jobs")
    .select("url")
    .in("url", urls);

  if (selectError) {
    return { inserted: 0, skipped: 0, errors: [selectError.message] };
  }

  const existingUrls = new Set((existingRows ?? []).map((row) => row.url));
  const toInsert = validJobs.filter((job) => !existingUrls.has(job.url));
  const skipped = validJobs.length - toInsert.length;

  if (toInsert.length === 0) {
    return { inserted: 0, skipped, errors: [] };
  }

  const { error: insertError } = await supabase
    .from("jobs")
    .insert(toInsert.map(toRow));

  if (!insertError) {
    return { inserted: toInsert.length, skipped, errors: [] };
  }

  if (insertError.code !== "23505") {
    return { inserted: 0, skipped, errors: [insertError.message] };
  }

  let inserted = 0;
  const errors: string[] = [];

  for (const job of toInsert) {
    const { error } = await supabase.from("jobs").insert(toRow(job));
    if (error) {
      if (error.code === "23505") {
        continue;
      }
      errors.push(`${job.url}: ${error.message}`);
      continue;
    }
    inserted += 1;
  }

  return {
    inserted,
    skipped: skipped + (toInsert.length - inserted - errors.length),
    errors,
  };
}
