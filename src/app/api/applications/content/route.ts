import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidUuid } from "@/lib/security/validation";
import {
  parseCvContent,
  parseCoverLetterContent,
  serializeCvContent,
  serializeCoverLetterContent,
} from "@/lib/documents/parse-content";
import type { CvDocument, CoverLetterDocument } from "@/types/documents";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    jobId: string;
    type: "cv" | "cover_letter";
    content: CvDocument | CoverLetterDocument;
  };

  if (
    !body.jobId ||
    !isValidUuid(body.jobId) ||
    !body.type ||
    (body.type !== "cv" && body.type !== "cover_letter") ||
    !body.content
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const contentField =
    body.type === "cv" ? "custom_cv_content" : "cover_letter_content";

  let serialized: string;
  if (body.type === "cv") {
    const parsed = body.content as CvDocument;
    if (parsed.version !== 1) {
      return NextResponse.json({ error: "Invalid CV format" }, { status: 400 });
    }
    serialized = serializeCvContent(parsed);
  } else {
    const parsed = body.content as CoverLetterDocument;
    if (parsed.version !== 1) {
      return NextResponse.json({ error: "Invalid cover letter format" }, { status: 400 });
    }
    serialized = serializeCoverLetterContent(parsed);
  }

  const { data: existing } = await supabase
    .from("applications")
    .select("*")
    .eq("job_id", body.jobId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json(
      { error: "Generate the document first" },
      { status: 404 }
    );
  }

  const verify =
    body.type === "cv"
      ? parseCvContent(serialized)
      : parseCoverLetterContent(serialized);

  if (!verify) {
    return NextResponse.json({ error: "Invalid document content" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("applications")
    .update({
      [contentField]: serialized,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ application: data });
}
