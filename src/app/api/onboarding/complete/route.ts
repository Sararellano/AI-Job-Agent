import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeText, MAX_PROFILE_FIELD_LENGTH } from "@/lib/security/validation";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;

  const { error } = await supabase
    .from("user_document_settings")
    .update({
      full_name: sanitizeText(String(body.fullName ?? ""), MAX_PROFILE_FIELD_LENGTH),
      target_role: sanitizeText(String(body.targetRole ?? ""), MAX_PROFILE_FIELD_LENGTH),
      email: sanitizeText(String(body.email ?? user.email ?? ""), MAX_PROFILE_FIELD_LENGTH),
      phone: sanitizeText(String(body.phone ?? ""), MAX_PROFILE_FIELD_LENGTH),
      mobile: sanitizeText(String(body.mobile ?? ""), MAX_PROFILE_FIELD_LENGTH),
      location: sanitizeText(String(body.location ?? ""), MAX_PROFILE_FIELD_LENGTH),
      linkedin_url: sanitizeText(String(body.linkedinUrl ?? ""), MAX_PROFILE_FIELD_LENGTH),
      onboarding_step: 4,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
