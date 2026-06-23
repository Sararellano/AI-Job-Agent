import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  analyzeCvWithAi,
  mergeAiIntoParsedSignals,
} from "@/lib/ai/parse-cv-ai";
import { buildSkillProfileFromCv } from "@/lib/skills/question-engine";
import { checkRateLimit } from "@/lib/security/rate-limit";
import type { ParsedCvLocal, SkillEvidence } from "@/types/skills";

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

  const ai = await analyzeCvWithAi(settings.cv_parsed_raw);

  if (!ai) {
    return NextResponse.json(
      {
        error: "No AI provider configured",
        hint: "Add GROQ_API_KEY or GEMINI_API_KEY to .env.local (optional)",
      },
      { status: 503 }
    );
  }

  const parsed = settings.cv_parsed_structured as ParsedCvLocal;
  const mergedParsed: ParsedCvLocal = {
    ...parsed,
    primaryTrack: ai.primaryTrack || parsed.primaryTrack,
    secondaryTracks: [
      ...new Set([...ai.secondaryTracks, ...parsed.secondaryTracks]),
    ],
    yearsExperienceEstimate:
      ai.yearsExperience ?? parsed.yearsExperienceEstimate,
    detectedSkills: [
      ...new Set([...parsed.detectedSkills, ...ai.claimedSkills]),
    ],
    skillConfidence: { ...parsed.skillConfidence, ...ai.skillConfidence },
    signals: mergeAiIntoParsedSignals(parsed.signals, ai),
  };

  const skillProfile: SkillEvidence[] = buildSkillProfileFromCv(mergedParsed);
  for (const name of ai.claimedSkills) {
    if (!skillProfile.find((s) => s.name === name)) {
      skillProfile.push({
        name,
        level: "touched",
        sources: ["ai"],
        confidence: ai.skillConfidence[name] ?? "medium",
      });
    }
  }

  const { data, error } = await supabase
    .from("user_document_settings")
    .update({
      cv_parsed_structured: mergedParsed,
      primary_track: mergedParsed.primaryTrack,
      skill_profile: skillProfile,
      ai_cv_analysis: ai,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ai, parsed: mergedParsed, skillProfile, settings: data });
}
