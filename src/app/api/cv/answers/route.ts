import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { UserCareerContext } from "@/types/career";
import {
  applyQuestionAnswers,
  buildQuestionQueue,
} from "@/lib/skills/question-engine";
import { careerContextFromSettings } from "@/lib/skills/registry";
import { sanitizeQuestionAnswers } from "@/lib/security/validation";
import type {
  ParsedCvLocal,
  QuestionAnswer,
  SkillEvidence,
} from "@/types/skills";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    answers?: Record<string, unknown>;
    complete?: boolean;
  };

  const sanitizedAnswers = sanitizeQuestionAnswers(body.answers);
  if (!sanitizedAnswers || Object.keys(sanitizedAnswers).length === 0) {
    return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
  }

  const { data: settings } = await supabase
    .from("user_document_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!settings?.cv_parsed_structured) {
    return NextResponse.json({ error: "Upload CV first" }, { status: 400 });
  }

  const parsed = settings.cv_parsed_structured as ParsedCvLocal;
  const careerContext = careerContextFromSettings(settings);
  const questions = buildQuestionQueue(parsed, careerContext);
  const baseProfile = (settings.skill_profile as SkillEvidence[]) ?? [];
  const mergedAnswers = {
    ...(settings.question_answers as Record<string, QuestionAnswer>),
    ...sanitizedAnswers,
  };

  const skillProfile = applyQuestionAnswers(
    baseProfile,
    questions,
    mergedAnswers
  );

  const skillsText = skillProfile.map((s) => s.name).join(", ");
  const additionalInfo = [
    settings.additional_info,
    skillProfile.length > 0 ? `Confirmed skills: ${skillsText}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const { data, error } = await supabase
    .from("user_document_settings")
    .update({
      question_answers: mergedAnswers,
      skill_profile: skillProfile,
      additional_info: additionalInfo,
      onboarding_step: body.complete ? 4 : 3,
      onboarding_completed: body.complete ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ skillProfile, settings: data });
}

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
    .select(
      "cv_parsed_structured, question_answers, skill_profile, sector, role_family, target_role"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (!settings?.cv_parsed_structured) {
    return NextResponse.json({ questions: [] });
  }

  const parsed = settings.cv_parsed_structured as ParsedCvLocal;
  const careerContext = careerContextFromSettings(settings);
  const questions = buildQuestionQueue(parsed, careerContext);

  return NextResponse.json({
    questions,
    answers: settings.question_answers ?? {},
    skillProfile: settings.skill_profile ?? [],
  });
}
