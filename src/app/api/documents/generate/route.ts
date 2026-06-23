import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateDocument } from "@/lib/ai/generate-document";
import { settingsToProfile } from "@/lib/documents/profile";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  isValidUuid,
  resolveTemplateId,
  sanitizeText,
  MAX_INSTRUCTIONS_LENGTH,
} from "@/lib/security/validation";

const GENERATE_RATE_LIMIT = 10;
const GENERATE_RATE_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimit(
    `doc-generate:${user.id}`,
    GENERATE_RATE_LIMIT,
    GENERATE_RATE_WINDOW_MS
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many generation requests. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  const body = (await request.json()) as {
    jobId: string;
    type: "cv" | "cover_letter";
    instructions: string;
    photoUrl?: string | null;
    templateId?: string;
  };

  const instructions = sanitizeText(body.instructions, MAX_INSTRUCTIONS_LENGTH);

  if (
    !body.jobId ||
    !isValidUuid(body.jobId) ||
    !body.type ||
    (body.type !== "cv" && body.type !== "cover_letter") ||
    !instructions
  ) {
    return NextResponse.json(
      { error: "jobId, type, and instructions are required" },
      { status: 400 }
    );
  }

  const { data: settings } = await supabase
    .from("user_document_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const profile = settingsToProfile(settings);

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", body.jobId)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const userDefault =
    body.type === "cv"
      ? settings?.default_cv_template_id
      : settings?.default_cover_letter_template_id;

  const templateId = resolveTemplateId(
    body.type,
    body.templateId ?? userDefault ?? undefined
  );

  let content: string;
  try {
    content = await generateDocument({
      type: body.type,
      job: {
        title: job.title,
        company: job.company,
        description: job.description,
        summary: job.summary,
        salary: job.salary,
      },
      instructions,
      photoUrl: body.photoUrl ?? null,
      profile,
      templateId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { data: existing } = await supabase
    .from("applications")
    .select("*")
    .eq("job_id", body.jobId)
    .eq("user_id", user.id)
    .maybeSingle();

  const updatePayload =
    body.type === "cv"
      ? {
          cv_instructions: instructions,
          cv_photo_url: body.photoUrl ?? null,
          cv_template_id: templateId,
          custom_cv_content: content,
        }
      : {
          cover_letter_instructions: instructions,
          cover_letter_photo_url: body.photoUrl ?? null,
          cover_letter_template_id: templateId,
          cover_letter_content: content,
        };

  let application;

  if (existing) {
    const { data, error } = await supabase
      .from("applications")
      .update({
        ...updatePayload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    application = data;
  } else {
    const { data, error } = await supabase
      .from("applications")
      .insert({
        job_id: body.jobId,
        user_id: user.id,
        status: "pending",
        ...updatePayload,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    application = data;
  }

  return NextResponse.json({ content, application });
}
