import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { profileToDbFields } from "@/lib/documents/profile";
import type { UserProfile } from "@/types/documents";
import {
  resolveTemplateId,
  sanitizeText,
  MAX_INSTRUCTIONS_LENGTH,
  MAX_PROFILE_FIELD_LENGTH,
  MAX_ADDITIONAL_INFO_LENGTH,
} from "@/lib/security/validation";

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    default_cv_instructions?: string;
    default_cover_letter_instructions?: string;
    default_cv_photo_url?: string | null;
    default_cover_letter_photo_url?: string | null;
    default_cv_template_id?: string;
    default_cover_letter_template_id?: string;
    profile?: UserProfile;
  };

  const profileFields = body.profile
    ? profileToDbFields(sanitizeProfile(body.profile))
    : {};

  const { data, error } = await supabase
    .from("user_document_settings")
    .upsert(
      {
        user_id: user.id,
        default_cv_instructions: sanitizeText(
          body.default_cv_instructions,
          MAX_INSTRUCTIONS_LENGTH
        ),
        default_cover_letter_instructions: sanitizeText(
          body.default_cover_letter_instructions,
          MAX_INSTRUCTIONS_LENGTH
        ),
        default_cv_photo_url: body.default_cv_photo_url ?? null,
        default_cover_letter_photo_url: body.default_cover_letter_photo_url ?? null,
        default_cv_template_id: resolveTemplateId(
          "cv",
          body.default_cv_template_id
        ),
        default_cover_letter_template_id: resolveTemplateId(
          "cover_letter",
          body.default_cover_letter_template_id
        ),
        ...profileFields,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}

function sanitizeProfile(profile: UserProfile): UserProfile {
  return {
    fullName: sanitizeText(profile.fullName, MAX_PROFILE_FIELD_LENGTH),
    targetRole: sanitizeText(profile.targetRole, MAX_PROFILE_FIELD_LENGTH),
    email: sanitizeText(profile.email, MAX_PROFILE_FIELD_LENGTH),
    phone: sanitizeText(profile.phone, MAX_PROFILE_FIELD_LENGTH),
    mobile: sanitizeText(profile.mobile, MAX_PROFILE_FIELD_LENGTH),
    languages: sanitizeText(profile.languages, MAX_PROFILE_FIELD_LENGTH),
    location: sanitizeText(profile.location, MAX_PROFILE_FIELD_LENGTH),
    linkedinUrl: sanitizeText(profile.linkedinUrl, MAX_PROFILE_FIELD_LENGTH),
    website: sanitizeText(profile.website, MAX_PROFILE_FIELD_LENGTH),
    githubUrl: sanitizeText(profile.githubUrl, MAX_PROFILE_FIELD_LENGTH),
    extraLink: sanitizeText(profile.extraLink, MAX_PROFILE_FIELD_LENGTH),
    salaryRange: sanitizeText(profile.salaryRange, MAX_PROFILE_FIELD_LENGTH),
    additionalInfo: sanitizeText(
      profile.additionalInfo,
      MAX_ADDITIONAL_INFO_LENGTH
    ),
  };
}
