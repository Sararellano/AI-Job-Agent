import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  parseJobPreferences,
  inferDefaultPreferences,
  DEFAULT_JOB_PREFERENCES,
  type JobPreferences,
} from "@/types/job-preferences";
import type { CareerTrack, ParsedCvLocal } from "@/types/skills";

const MAX_STRING_FIELD = 500;

function sanitizePreferencesInput(raw: unknown): JobPreferences | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  return parseJobPreferences(raw);
}

/**
 * GET /api/onboarding/preferences
 * Returns current preferences merged with defaults inferred from CV.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: settings } = await supabase
    .from("user_document_settings")
    .select("job_preferences, primary_track, target_role, cv_parsed_structured")
    .eq("user_id", user.id)
    .maybeSingle();

  const stored = settings?.job_preferences
    ? parseJobPreferences(settings.job_preferences)
    : null;

  const inferred = inferDefaultPreferences(
    (settings?.primary_track as CareerTrack | null) ?? null,
    settings?.target_role ?? null
  );

  const parsed = settings?.cv_parsed_structured as ParsedCvLocal | null;
  const suggestedRoles = parsed?.roles?.map((r) => r.title).slice(0, 5) ?? [];

  const preferences: JobPreferences = stored
    ? stored
    : { ...DEFAULT_JOB_PREFERENCES, ...inferred };

  return NextResponse.json({ preferences, suggestedRoles });
}

/**
 * POST /api/onboarding/preferences
 * Saves job search preferences for the authenticated user.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const preferences = sanitizePreferencesInput(body);
  if (!preferences) {
    return NextResponse.json({ error: "Invalid preferences payload" }, { status: 400 });
  }

  const targetRole =
    preferences.targetRoles[0]?.trim().slice(0, MAX_STRING_FIELD) ?? null;

  const { error } = await supabase
    .from("user_document_settings")
    .update({
      job_preferences: preferences,
      ...(targetRole ? { target_role: targetRole } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ preferences });
}
