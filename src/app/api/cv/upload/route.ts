export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromCv } from "@/lib/cv/extract-text";
import { parseCvHeuristics } from "@/lib/cv/parse-heuristics";
import { buildSkillProfileFromCv } from "@/lib/skills/question-engine";
import { inferCareerContext } from "@/lib/skills/registry";
import {
  isAllowedCvUpload,
  MAX_CV_SIZE_MB,
} from "@/lib/security/validation";

const CV_BUCKET = "cv-documents";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_CV_SIZE_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `File must be under ${MAX_CV_SIZE_MB}MB` },
      { status: 400 }
    );
  }

  if (!isAllowedCvUpload(file.type, file.name)) {
    return NextResponse.json(
      { error: "Only PDF or DOCX files are allowed" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let rawText: string;

  try {
    rawText = await extractTextFromCv(buffer, file.type || file.name);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse file";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!rawText.trim()) {
    return NextResponse.json(
      { error: "Could not extract text. Try a PDF with selectable text." },
      { status: 400 }
    );
  }

  const parsed = parseCvHeuristics(rawText);
  const skillProfile = buildSkillProfileFromCv(parsed);
  const careerContext = inferCareerContext(parsed);

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
  const storagePath = `${user.id}/cv-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(CV_BUCKET)
    .upload(storagePath, buffer, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const cvFileUrl = `${CV_BUCKET}/${storagePath}`;

  const { data, error } = await supabase
    .from("user_document_settings")
    .upsert(
      {
        user_id: user.id,
        cv_file_url: cvFileUrl,
        cv_file_name: file.name,
        cv_parsed_raw: rawText.slice(0, 50000),
        cv_parsed_structured: parsed,
        primary_track: parsed.primaryTrack,
        sector: careerContext.sector,
        role_family: careerContext.roleFamily,
        target_role: careerContext.targetRole || null,
        skill_profile: skillProfile,
        onboarding_step: 1,
        onboarding_completed: false,
        ai_cv_analysis: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (parsed.emails[0]) {
    await supabase
      .from("user_document_settings")
      .update({ email: parsed.emails[0] })
      .eq("user_id", user.id);
  }

  return NextResponse.json({
    parsed,
    skillProfile,
    cvFileName: file.name,
    settings: data,
  });
}
