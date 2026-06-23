import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidUuid, resolveTemplateId } from "@/lib/security/validation";

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
    templateId: string;
  };

  if (
    !body.jobId ||
    !isValidUuid(body.jobId) ||
    !body.type ||
    (body.type !== "cv" && body.type !== "cover_letter") ||
    !body.templateId
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const templateId = resolveTemplateId(body.type, body.templateId);

  const field =
    body.type === "cv" ? "cv_template_id" : "cover_letter_template_id";

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

  const contentField =
    body.type === "cv" ? "custom_cv_content" : "cover_letter_content";
  const rawContent = existing[contentField as keyof typeof existing] as string | null;

  let updatedContent = rawContent;
  if (rawContent) {
    try {
      const parsed = JSON.parse(rawContent) as { templateId?: string };
      parsed.templateId = templateId;
      updatedContent = JSON.stringify(parsed);
    } catch {
      // legacy content — keep as is
    }
  }

  const { data, error } = await supabase
    .from("applications")
    .update({
      [field]: templateId,
      [contentField]: updatedContent,
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
