import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidApplicationStatus, isValidUuid } from "@/lib/security/validation";

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
    status: string;
  };

  if (
    !body.jobId ||
    !isValidUuid(body.jobId) ||
    !body.status ||
    !isValidApplicationStatus(body.status)
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("applications")
    .select("*")
    .eq("job_id", body.jobId)
    .eq("user_id", user.id)
    .maybeSingle();

  let application;

  if (existing) {
    const { data, error } = await supabase
      .from("applications")
      .update({
        status: body.status,
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
        status: body.status,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    application = data;
  }

  return NextResponse.json({ application });
}
