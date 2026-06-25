export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromCv } from "@/lib/cv/extract-text";
import { parseCvHeuristics } from "@/lib/cv/parse-heuristics";
import { extractAndApplyCvProfile } from "@/lib/cv/apply-extraction";
import { settingsToProfile } from "@/lib/documents/profile";
import { buildSkillProfileFromCv } from "@/lib/skills/question-engine";
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
  const extractProfile = formData.get("extractProfile") === "true";

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

  const { data: existingSettings } = await supabase
    .from("user_document_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

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
        skill_profile: skillProfile,
        onboarding_step: existingSettings?.onboarding_completed ? 4 : 1,
        onboarding_completed: existingSettings?.onboarding_completed ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (extractProfile) {
    try {
      const applied = await extractAndApplyCvProfile(
        supabase,
        user.id,
        rawText,
        parsed,
        settingsToProfile(existingSettings)
      );

      return NextResponse.json({
        parsed: applied.parsed,
        skillProfile: applied.skillProfile,
        cvFileName: file.name,
        settings: data,
        profile: applied.profile,
        cvInstructions: applied.cvInstructions,
        coverInstructions: applied.coverInstructions,
        extraction: applied.extraction,
        aiUsed: applied.ai !== null,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to extract profile";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({
    parsed,
    skillProfile,
    cvFileName: file.name,
    settings: data,
  });
}
