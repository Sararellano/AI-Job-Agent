import { NextResponse } from "next/server";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import { runJobSync } from "@/services/job-search";

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

/**
 * Daily cron endpoint to sync jobs from external connectors.
 * Secured with CRON_SECRET bearer token.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasAdminCredentials()) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured" },
      { status: 503 }
    );
  }

  try {
    const supabase = createAdminClient();
    const summary = await runJobSync(supabase);
    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Job sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
