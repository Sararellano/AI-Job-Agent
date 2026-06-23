import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { settingsToProfile } from "@/lib/documents/profile";
import { settingsToOnboarding } from "@/lib/onboarding/state";
import type { Job, JobApplication, JobWithApplication } from "@/types/database";
import {
  DEFAULT_CV_TEMPLATE,
  DEFAULT_COVER_TEMPLATE,
} from "@/types/documents";

export const dynamic = "force-dynamic";

const DEFAULT_CV =
  "Create a professional CV tailored to the job. Use clear sections: summary, experience, skills, education.";
const DEFAULT_COVER =
  "Write a one-page formal cover letter. Address the hiring manager, highlight relevant experience, and explain motivation for the role.";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id);

  let { data: settings } = await supabase
    .from("user_document_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!settings) {
    const { data: newSettings } = await supabase
      .from("user_document_settings")
      .insert({
        user_id: user.id,
        default_cv_instructions: DEFAULT_CV,
        default_cover_letter_instructions: DEFAULT_COVER,
        default_cv_template_id: DEFAULT_CV_TEMPLATE,
        default_cover_letter_template_id: DEFAULT_COVER_TEMPLATE,
      })
      .select()
      .single();
    settings = newSettings;
  }

  const applicationMap = new Map(
    (applications ?? []).map((a) => [a.job_id, a as JobApplication])
  );

  const jobsWithApplications: JobWithApplication[] = (jobs ?? []).map(
    (job) => ({
      ...(job as Job),
      application: applicationMap.get(job.id) ?? null,
    })
  );

  const profile = settingsToProfile(settings);
  const onboarding = settingsToOnboarding(settings);

  return (
    <main className="min-h-screen">
      <DashboardClient
        jobs={jobsWithApplications}
        profile={profile}
        onboarding={onboarding}
        defaultCvInstructions={settings?.default_cv_instructions ?? DEFAULT_CV}
        defaultCoverLetterInstructions={
          settings?.default_cover_letter_instructions ?? DEFAULT_COVER
        }
        defaultCvPhotoUrl={settings?.default_cv_photo_url ?? null}
        defaultCoverLetterPhotoUrl={
          settings?.default_cover_letter_photo_url ?? null
        }
        defaultCvTemplateId={
          settings?.default_cv_template_id ?? DEFAULT_CV_TEMPLATE
        }
        defaultCoverTemplateId={
          settings?.default_cover_letter_template_id ?? DEFAULT_COVER_TEMPLATE
        }
        userEmail={user.email ?? ""}
      />
    </main>
  );
}
