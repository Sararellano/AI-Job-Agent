import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPlaceholderJobUrl } from "@/lib/security/validation";
import { filterAndRankJobs } from "@/services/job-search/relevance";
import { buildSearchKeywords } from "@/services/job-search/keywords";
import { settingsToJobSearchProfile } from "@/services/job-search";
import type { Job } from "@/types/database";

export interface JobWithRelevance extends Job {
  score: number;
  matchedKeywords: string[];
  reasons: string[];
}

export interface MatchedJobsResponse {
  jobs: JobWithRelevance[];
  total: number;
  matched: number;
  keywordsUsed: string[];
  minScore: number;
}

/**
 * GET /api/jobs/matched
 * Returns all jobs scored and filtered by the authenticated user's profile.
 * Query params:
 *   - minScore: override minimum score threshold (0–100)
 *   - all: "true" to return all jobs regardless of score (for "All offers" tab)
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const showAll = searchParams.get("all") === "true";
  const minScoreParam = searchParams.get("minScore");
  const minScoreOverride =
    minScoreParam !== null ? Math.max(0, Math.min(100, Number(minScoreParam))) : undefined;

  const { data: settings } = await supabase
    .from("user_document_settings")
    .select("target_role, primary_track, skill_profile, job_preferences")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: rawJobs } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  const jobs = (rawJobs ?? []).filter(
    (job) => !isPlaceholderJobUrl(job.url)
  ) as Job[];

  if (!settings || jobs.length === 0) {
    return NextResponse.json({
      jobs: jobs.map((j) => ({ ...j, score: 0, matchedKeywords: [], reasons: [] })),
      total: jobs.length,
      matched: jobs.length,
      keywordsUsed: [],
      minScore: 0,
    } satisfies MatchedJobsResponse);
  }

  const profile = settingsToJobSearchProfile(settings);

  if (showAll) {
    const scored = jobs.map((job) => {
      const { score, matchedKeywords, reasons } = filterAndRankJobs([job], profile, 0)[0]
        ?.relevance ?? { score: 0, matchedKeywords: [], reasons: [] };
      return { ...job, score, matchedKeywords, reasons };
    });
    return NextResponse.json({
      jobs: scored,
      total: jobs.length,
      matched: scored.length,
      keywordsUsed: [],
      minScore: 0,
    } satisfies MatchedJobsResponse);
  }

  const minScore = minScoreOverride ?? profile.jobPreferences?.minMatchScore ?? 0;
  const ranked = filterAndRankJobs(jobs, profile, minScore);

  const keywordsUsed = buildSearchKeywords(profile, "strict").slice(0, 20);

  const result: MatchedJobsResponse = {
    jobs: ranked.map(({ job, relevance }) => ({
      ...(job as Job),
      score: relevance.score,
      matchedKeywords: relevance.matchedKeywords,
      reasons: relevance.reasons,
    })),
    total: jobs.length,
    matched: ranked.length,
    keywordsUsed,
    minScore,
  };

  return NextResponse.json(result);
}
