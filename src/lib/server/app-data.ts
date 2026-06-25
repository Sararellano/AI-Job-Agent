import { createClient } from "@/lib/supabase/server";
import { settingsToProfile } from "@/lib/documents/profile";
import { settingsToOnboarding } from "@/lib/onboarding/state";
import { isPlaceholderJobUrl } from "@/lib/security/validation";
import type { Job, JobApplication, JobWithApplication } from "@/types/database";
import type { UserProfile } from "@/types/documents";
import type { OnboardingState } from "@/types/skills";
import {
  DEFAULT_CV_TEMPLATE,
  DEFAULT_COVER_TEMPLATE,
} from "@/types/documents";

export const DEFAULT_CV_INSTRUCTIONS =
  "Create a professional CV tailored to the job. Use clear sections: summary, experience, skills, education.";
export const DEFAULT_COVER_INSTRUCTIONS =
  "Write a one-page formal cover letter. Address the hiring manager, highlight relevant experience, and explain motivation for the role.";

export interface AppUserContext {
  userId: string;
  userEmail: string;
  profile: UserProfile;
  onboarding: OnboardingState;
  defaultCvInstructions: string;
  defaultCoverLetterInstructions: string;
  defaultCvPhotoUrl: string | null;
  defaultCoverLetterPhotoUrl: string | null;
  defaultCvTemplateId: string;
  defaultCoverTemplateId: string;
}

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function ensureUserSettings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  let { data: settings } = await supabase
    .from("user_document_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!settings) {
    const { data: newSettings } = await supabase
      .from("user_document_settings")
      .insert({
        user_id: userId,
        default_cv_instructions: DEFAULT_CV_INSTRUCTIONS,
        default_cover_letter_instructions: DEFAULT_COVER_INSTRUCTIONS,
        default_cv_template_id: DEFAULT_CV_TEMPLATE,
        default_cover_letter_template_id: DEFAULT_COVER_TEMPLATE,
      })
      .select()
      .single();
    settings = newSettings;
  }

  return settings;
}

export async function loadAppUserContext(): Promise<AppUserContext | null> {
  const { supabase, user } = await requireUser();
  if (!user) return null;

  const settings = await ensureUserSettings(supabase, user.id);

  return {
    userId: user.id,
    userEmail: user.email ?? "",
    profile: settingsToProfile(settings),
    onboarding: settingsToOnboarding(settings),
    defaultCvInstructions: settings?.default_cv_instructions ?? DEFAULT_CV_INSTRUCTIONS,
    defaultCoverLetterInstructions:
      settings?.default_cover_letter_instructions ?? DEFAULT_COVER_INSTRUCTIONS,
    defaultCvPhotoUrl: settings?.default_cv_photo_url ?? null,
    defaultCoverLetterPhotoUrl: settings?.default_cover_letter_photo_url ?? null,
    defaultCvTemplateId: settings?.default_cv_template_id ?? DEFAULT_CV_TEMPLATE,
    defaultCoverTemplateId:
      settings?.default_cover_letter_template_id ?? DEFAULT_COVER_TEMPLATE,
  };
}

export async function loadJobsWithApplications(
  userId: string
): Promise<JobWithApplication[]> {
  const supabase = await createClient();

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!applications?.length) {
    return [];
  }

  const jobIds = applications.map((a) => a.job_id);
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .in("id", jobIds);

  const jobMap = new Map((jobs ?? []).map((job) => [job.id, job as Job]));

  return applications
    .map((application): JobWithApplication | null => {
      const job = jobMap.get(application.job_id);
      if (!job || isPlaceholderJobUrl(job.url)) {
        return null;
      }
      return {
        ...job,
        application: application as JobApplication,
      };
    })
    .filter((entry): entry is JobWithApplication => entry !== null);
}

export async function loadJobWithApplication(
  userId: string,
  jobId: string
): Promise<JobWithApplication | null> {
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();

  if (!job) return null;

  const { data: application } = await supabase
    .from("applications")
    .select("*")
    .eq("job_id", jobId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!application) return null;

  if (isPlaceholderJobUrl(job.url)) return null;

  return {
    ...(job as Job),
    application: (application as JobApplication) ?? null,
  };
}
