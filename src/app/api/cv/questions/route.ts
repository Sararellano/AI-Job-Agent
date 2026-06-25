import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCvQuestions } from "@/lib/ai/generate-cv-questions";
import { buildQuestionQueue } from "@/lib/skills/question-engine";
import type {
  AiCvAnalysis,
  CustomCvAnswer,
  CustomCvQuestion,
  ParsedCvLocal,
} from "@/types/skills";
import { sanitizeText } from "@/lib/security/validation";

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
      "cv_parsed_structured, ai_cv_analysis, cv_parsed_raw, cv_custom_questions, question_answers"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (!settings?.cv_parsed_structured) {
    return NextResponse.json({ questions: [], answers: {} });
  }

  const parsed = settings.cv_parsed_structured as ParsedCvLocal;
  const ai = (settings.ai_cv_analysis as AiCvAnalysis | null) ?? null;
  let questions = (settings.cv_custom_questions as CustomCvQuestion[] | null) ?? [];

  if (questions.length === 0) {
    questions = await generateCvQuestions(
      parsed,
      ai,
      settings.cv_parsed_raw ?? undefined
    );

    if (questions.length === 0) {
      const fallback = buildQuestionQueue(parsed)
        .filter((q) => q.category !== "imposter")
        .slice(0, 12)
        .map((q) => ({
          id: q.id,
          text: q.text,
          type: "yes_no" as const,
          category: "skill" as const,
        }));
      questions = fallback;
    }

    if (questions.length > 0) {
      await supabase
        .from("user_document_settings")
        .update({
          cv_custom_questions: questions,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }
  }

  return NextResponse.json({
    questions,
    answers: settings.question_answers ?? {},
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    answers?: Record<string, CustomCvAnswer | string>;
  };

  if (!body.answers || typeof body.answers !== "object") {
    return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
  }

  const sanitized: Record<string, CustomCvAnswer> = {};
  for (const [key, val] of Object.entries(body.answers).slice(0, 30)) {
    if (typeof val === "string") {
      sanitized[key] = {
        type: ["yes", "somewhat", "no", "skip"].includes(val) ? "yes_no" : "text",
        value: sanitizeText(val, 1000),
      };
    } else if (val && typeof val === "object" && "value" in val) {
      sanitized[key] = {
        type: val.type === "text" ? "text" : "yes_no",
        value: sanitizeText(String(val.value), 1000),
      };
    }
  }

  const answersText = Object.entries(sanitized)
    .map(([id, a]) => `${id}: ${a.value}`)
    .join("\n");

  const { data: settings } = await supabase
    .from("user_document_settings")
    .select("additional_info")
    .eq("user_id", user.id)
    .maybeSingle();

  const additionalInfo = [settings?.additional_info, `CV Q&A:\n${answersText}`]
    .filter(Boolean)
    .join("\n\n");

  const { error } = await supabase
    .from("user_document_settings")
    .update({
      question_answers: sanitized,
      additional_info: additionalInfo,
      onboarding_step: 3,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
