import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getJobSyncConfig } from "@/services/job-search/config";
import { hasInfoJobsCredentials } from "@/services/job-search/connectors/infojobs";
import { runJobSync, settingsToJobSearchProfile } from "@/services/job-search";

const SYNC_RATE_LIMIT = 5;
const SYNC_RATE_WINDOW_MS = 60 * 60 * 1_000;

/**
 * Triggers a manual job sync for the authenticated user.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimit(
    `job-sync:${user.id}`,
    SYNC_RATE_LIMIT,
    SYNC_RATE_WINDOW_MS
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many sync requests. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  const config = getJobSyncConfig();
  const hasConnectors =
    config.greenhouseBoards.length > 0 ||
    config.leverCompanies.length > 0 ||
    config.remoteOkEnabled ||
    config.remotiveEnabled ||
    config.wwrEnabled ||
    config.remoteCoEnabled ||
    config.getManfredEnabled ||
    (config.wellfoundEnabled && config.wellfoundRoleSlugs.length > 0) ||
    (config.infoJobsEnabled && hasInfoJobsCredentials());

  if (!hasConnectors) {
    return NextResponse.json(
      {
        error:
          "No job connectors are configured. Enable RemoteOK or add API credentials.",
      },
      { status: 503 }
    );
  }

  const { data: settings } = await supabase
    .from("user_document_settings")
    .select("target_role, primary_track, skill_profile, job_preferences")
    .eq("user_id", user.id)
    .maybeSingle();

  try {
    const summary = await runJobSync(supabase, {
      profile: settingsToJobSearchProfile(settings),
      keywordMode: "strict",
    });
    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Job sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
