import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobSource } from "@/types/database";
import type { CareerTrack, SkillEvidence } from "@/types/skills";
import { getJobSyncConfig } from "@/services/job-search/config";
import { fetchGreenhouseJobs } from "@/services/job-search/connectors/greenhouse";
import {
  fetchInfoJobsJobs,
  hasInfoJobsCredentials,
} from "@/services/job-search/connectors/infojobs";
import { fetchLeverJobs } from "@/services/job-search/connectors/lever";
import { fetchGetManfredJobs } from "@/services/job-search/connectors/getmanfred";
import { fetchRemoteCoJobs } from "@/services/job-search/connectors/remoteco";
import { fetchRemotiveJobs } from "@/services/job-search/connectors/remotive";
import { fetchRemoteOkJobs } from "@/services/job-search/connectors/remoteok";
import { fetchWeWorkRemotelyJobs } from "@/services/job-search/connectors/weworkremotely";
import { fetchWellfoundJobs } from "@/services/job-search/connectors/wellfound";
import {
  buildSearchKeywords,
  type JobSearchProfile,
} from "@/services/job-search/keywords";
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
  keywordsUsed: string[];
}

interface RunJobSyncOptions {
  profile?: JobSearchProfile;
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
  const keywords = buildSearchKeywords({
    ...options.profile,
    additionalKeywords: config.keywords,
  });
  const results: ConnectorSyncResult[] = [];

  for (const board of config.greenhouseBoards) {
    try {
      const jobs = await fetchGreenhouseJobs(board, keywords);
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
      const jobs = await fetchLeverJobs(company, keywords);
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

  if (config.remotiveEnabled) {
    try {
      const jobs = await fetchRemotiveJobs(keywords, config.remotiveCategories);
      results.push(
        await syncConnectorJobs(supabase, "remotive", "remotive.com", jobs)
      );
    } catch (error) {
      results.push({
        source: "remotive",
        target: "remotive.com",
        fetched: 0,
        inserted: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : "Remotive sync failed"],
      });
    }
  }

  if (config.wwrEnabled) {
    try {
      const jobs = await fetchWeWorkRemotelyJobs(keywords, config.wwrCategories);
      results.push(
        await syncConnectorJobs(
          supabase,
          "weworkremotely",
          "weworkremotely.com",
          jobs
        )
      );
    } catch (error) {
      results.push({
        source: "weworkremotely",
        target: "weworkremotely.com",
        fetched: 0,
        inserted: 0,
        skipped: 0,
        errors: [
          error instanceof Error ? error.message : "We Work Remotely sync failed",
        ],
      });
    }
  }

  if (config.remoteCoEnabled) {
    try {
      const jobs = await fetchRemoteCoJobs(keywords);
      results.push(
        await syncConnectorJobs(supabase, "remoteco", "remote.co", jobs)
      );
    } catch (error) {
      results.push({
        source: "remoteco",
        target: "remote.co",
        fetched: 0,
        inserted: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : "Remote.co sync failed"],
      });
    }
  }

  if (config.getManfredEnabled) {
    try {
      const jobs = await fetchGetManfredJobs(keywords);
      results.push(
        await syncConnectorJobs(supabase, "getmanfred", "getmanfred.com", jobs)
      );
    } catch (error) {
      results.push({
        source: "getmanfred",
        target: "getmanfred.com",
        fetched: 0,
        inserted: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : "GetManfred sync failed"],
      });
    }
  }

  if (config.wellfoundEnabled && config.wellfoundRoleSlugs.length > 0) {
    try {
      const jobs = await fetchWellfoundJobs(config.wellfoundRoleSlugs, keywords);
      results.push(
        await syncConnectorJobs(supabase, "wellfound", "wellfound.com", jobs)
      );
    } catch (error) {
      results.push({
        source: "wellfound",
        target: "wellfound.com",
        fetched: 0,
        inserted: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : "Wellfound sync failed"],
      });
    }
  }

  if (config.infoJobsEnabled && hasInfoJobsCredentials()) {
    try {
      const jobs = await fetchInfoJobsJobs(keywords, config.infoJobsProvince ?? undefined);
      results.push(
        await syncConnectorJobs(
          supabase,
          "infojobs",
          config.infoJobsProvince ?? "spain",
          jobs
        )
      );
    } catch (error) {
      results.push({
        source: "infojobs",
        target: config.infoJobsProvince ?? "spain",
        fetched: 0,
        inserted: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : "InfoJobs sync failed"],
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

  return { results, totals, keywordsUsed: keywords.slice(0, 20) };
}

/**
 * Maps persisted user settings to a job search profile.
 */
export function settingsToJobSearchProfile(settings: {
  target_role?: string | null;
  primary_track?: string | null;
  skill_profile?: unknown;
} | null): JobSearchProfile {
  return {
    targetRole: settings?.target_role ?? null,
    primaryTrack: (settings?.primary_track as CareerTrack | null) ?? null,
    skillProfile: (settings?.skill_profile as SkillEvidence[] | null) ?? [],
  };
}
