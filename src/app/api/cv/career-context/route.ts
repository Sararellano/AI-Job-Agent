import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  inferCareerContext,
  isValidRoleFamily,
  isValidSector,
} from "@/lib/skills/registry";
import {
  sanitizeCareerContext,
  sanitizeText,
} from "@/lib/security/validation";
import type { EmploymentSector } from "@/types/career";
import type { ParsedCvLocal } from "@/types/skills";

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
      "sector, role_family, target_role, cv_parsed_structured, onboarding_step"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (!settings?.cv_parsed_structured) {
    return NextResponse.json({ error: "Upload CV first" }, { status: 400 });
  }

  const parsed = settings.cv_parsed_structured as ParsedCvLocal;
  const suggested = inferCareerContext(parsed, {
    sector: isValidSector(settings.sector ?? "")
      ? (settings.sector as EmploymentSector)
      : undefined,
    roleFamily: settings.role_family ?? undefined,
    targetRole: settings.target_role ?? undefined,
  });

  return NextResponse.json({
    careerContext: {
      sector: settings.sector ?? suggested.sector,
      roleFamily: settings.role_family ?? suggested.roleFamily,
      targetRole: settings.target_role ?? suggested.targetRole,
    },
    suggested,
    onboardingStep: settings.onboarding_step ?? 1,
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
    sector?: string;
    roleFamily?: string;
    targetRole?: string;
    advanceStep?: number;
  };

  const { data: settings } = await supabase
    .from("user_document_settings")
    .select("cv_parsed_structured, sector, role_family, target_role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!settings?.cv_parsed_structured) {
    return NextResponse.json({ error: "Upload CV first" }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.advanceStep !== undefined) {
    const step = Math.min(4, Math.max(2, Math.floor(body.advanceStep)));
    update.onboarding_step = step;
  } else {
    const sanitized = sanitizeCareerContext({
      sector: body.sector,
      roleFamily: body.roleFamily,
      targetRole: body.targetRole,
    });

    if (!sanitized) {
      return NextResponse.json({ error: "Invalid career context" }, { status: 400 });
    }

    if (
      !isValidSector(sanitized.sector) ||
      !isValidRoleFamily(sanitized.sector, sanitized.roleFamily)
    ) {
      return NextResponse.json({ error: "Invalid sector or role" }, { status: 400 });
    }

    update.sector = sanitized.sector;
    update.role_family = sanitized.roleFamily;
    update.target_role = sanitizeText(sanitized.targetRole, 500);
    update.onboarding_step = 2;

    if (sanitized.sector === "tech") {
      update.primary_track = sanitized.roleFamily;
    }
  }

  const { data, error } = await supabase
    .from("user_document_settings")
    .update(update)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}
