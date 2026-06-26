import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeCvProfileExtraction } from "@/lib/cv/sanitize-extraction";
import { normalizeCvProfileExtraction } from "@/lib/cv/normalize-extraction";
import type { CvProfileExtraction } from "@/types/skills";
import { isValidUuid } from "@/lib/security/validation";

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
    cvProfileData: CvProfileExtraction;
  };

  if (!body.jobId || !isValidUuid(body.jobId) || !body.cvProfileData) {
    return NextResponse.json(
      { error: "jobId and cvProfileData are required" },
      { status: 400 }
    );
  }

  const sanitized = sanitizeCvProfileExtraction(body.cvProfileData);
  if (!sanitized) {
    return NextResponse.json({ error: "Invalid cvProfileData" }, { status: 400 });
  }

  const { data: application, error } = await supabase
    .from("applications")
    .upsert(
      {
        job_id: body.jobId,
        user_id: user.id,
        cv_profile_data: normalizeCvProfileExtraction(sanitized),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "job_id,user_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ application });
}
