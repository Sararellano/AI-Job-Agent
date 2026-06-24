import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobSource } from "@/types/database";
import { getJobSyncConfig } from "@/services/job-search/config";
import { fetchGreenhouseJobs } from "@/services/job-search/connectors/greenhouse";
import { fetchLeverJobs } from "@/services/job-search/connectors/lever";
import { fetchRemoteOkJobs } from "@/services/job-search/connectors/remoteok";
import { upsertJobs, type UpsertJobsResult } from "@/services/job-search/upsert-jobs";

export interface ConnectorSyncResult extends UpsertJobsResult {
  source: JobSource;
  target: string;
  fetched: number;
}

export interface JobSyncSummary {
  results: ConnectorSyncResult[];
  totals: {
    fetched: number;
    inserted: number;
    skipped: number;
    errors: number;
  };
}

interface RunJobSyncOptions {
  keywords?: string[];
}

async function syncConnectorJobs(
  supabase: SupabaseClient,
  source: JobSource,
  target: string,
  jobs: Awaited<ReturnType<typeof fetchGreenhouseJobs>>
): Promise<ConnectorSyncResult> {
  const upsert = await upsertJobs(supabase, jobs);

  return {
    source,
    target,
    fetched: jobs.length,
    ...upsert,
  };
}

/**
 * Runs all configured job connectors and upserts new postings.
 */
export async function runJobSync(
  supabase: SupabaseClient,
  options: RunJobSyncOptions = {}
): Promise<JobSyncSummary> {
  const config = getJobSyncConfig();
  const keywords = options.keywords ?? config.keywords;
  const results: ConnectorSyncResult[] = [];

  for (const board of config.greenhouseBoards) {
    try {
      const jobs = await fetchGreenhouseJobs(board);
      results.push(await syncConnectorJobs(supabase, "greenhouse", board, jobs));
    } catch (error) {
      results.push({
        source: "greenhouse",
        target: board,
        fetched: 0,
        inserted: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : "Greenhouse sync failed"],
      });
    }
  }

  for (const company of config.leverCompanies) {
    try {
      const jobs = await fetchLeverJobs(company);
      results.push(await syncConnectorJobs(supabase, "lever", company, jobs));
    } catch (error) {
      results.push({
        source: "lever",
        target: company,
        fetched: 0,
        inserted: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : "Lever sync failed"],
      });
    }
  }

  if (config.remoteOkEnabled) {
    try {
      const jobs = await fetchRemoteOkJobs(keywords);
      results.push(
        await syncConnectorJobs(supabase, "remoteok", "remoteok.com", jobs)
      );
    } catch (error) {
      results.push({
        source: "remoteok",
        target: "remoteok.com",
        fetched: 0,
        inserted: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : "RemoteOK sync failed"],
      });
    }
  }

  const totals = results.reduce(
    (acc, result) => ({
      fetched: acc.fetched + result.fetched,
      inserted: acc.inserted + result.inserted,
      skipped: acc.skipped + result.skipped,
      errors: acc.errors + result.errors.length,
    }),
    { fetched: 0, inserted: 0, skipped: 0, errors: 0 }
  );

  return { results, totals };
}
