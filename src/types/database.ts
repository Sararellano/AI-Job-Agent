export type ApplicationStatus = "pending" | "applied" | "interview" | "rejected";

export type JobSource =
  | "greenhouse"
  | "lever"
  | "remoteok"
  | "linkedin"
  | "infojobs"
  | "workable"
  | "wellfound"
  | "manual"
  | "other";

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  summary: string | null;
  salary: string | null;
  url: string | null;
  source: string | null;
  requirements: string | null;
  created_at: string;
}

export interface CreateJobInput {
  title: string;
  company: string;
  description: string;
  url: string;
  source?: JobSource | null;
  summary?: string | null;
  salary?: string | null;
  requirements?: string | null;
}

export interface JobApplication {
  id: string;
  job_id: string;
  user_id: string;
  status: ApplicationStatus;
  cv_instructions: string | null;
  cover_letter_instructions: string | null;
  cv_photo_url: string | null;
  cover_letter_photo_url: string | null;
  cv_template_id: string | null;
  cover_letter_template_id: string | null;
  custom_cv_content: string | null;
  cover_letter_content: string | null;
  document_language: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserDocumentSettings {
  id: string;
  user_id: string;
  full_name: string | null;
  target_role: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  languages: string | null;
  location: string | null;
  linkedin_url: string | null;
  website: string | null;
  github_url: string | null;
  extra_link: string | null;
  salary_range: string | null;
  additional_info: string | null;
  default_cv_instructions: string;
  default_cover_letter_instructions: string;
  default_cv_photo_url: string | null;
  default_cover_letter_photo_url: string | null;
  default_cv_template_id: string | null;
  default_cover_letter_template_id: string | null;
  cv_file_url: string | null;
  cv_file_name: string | null;
  cv_parsed_raw: string | null;
  cv_parsed_structured: Record<string, unknown> | null;
  primary_track: string | null;
  skill_profile: Record<string, unknown>[] | null;
  question_answers: Record<string, string> | null;
  ai_cv_analysis: Record<string, unknown> | null;
  onboarding_completed: boolean | null;
  onboarding_step: number | null;
  updated_at: string;
}

export interface JobWithApplication extends Job {
  application: JobApplication | null;
}
