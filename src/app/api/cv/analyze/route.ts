import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractAndApplyCvProfile } from "@/lib/cv/apply-extraction";
import { settingsToProfile } from "@/lib/documents/profile";
import { checkRateLimit } from "@/lib/security/rate-limit";
import type { ParsedCvLocal } from "@/types/skills";

const AI_RATE_LIMIT = 5;
const AI_RATE_WINDOW_MS = 60_000;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimit(
    `cv-analyze:${user.id}`,
    AI_RATE_LIMIT,
    AI_RATE_WINDOW_MS
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many AI requests. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  const { data: settings } = await supabase
    .from("user_document_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!settings?.cv_parsed_raw) {
    return NextResponse.json(
      { error: "Upload a CV first" },
      { status: 400 }
    );
  }

  const parsed = settings.cv_parsed_structured as ParsedCvLocal;

  try {
    const applied = await extractAndApplyCvProfile(
      supabase,
      user.id,
      settings.cv_parsed_raw,
      parsed,
      settingsToProfile(settings)
    );

    return NextResponse.json({
      ai: applied.ai,
      parsed: applied.parsed,
      skillProfile: applied.skillProfile,
      profile: applied.profile,
      cvInstructions: applied.cvInstructions,
      coverInstructions: applied.coverInstructions,
      extraction: applied.extraction,
      aiUsed: applied.ai !== null,
      settings,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
