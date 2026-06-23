import type { UserProfile } from "@/types/documents";
import type { UserDocumentSettings } from "@/types/database";
import { EMPTY_PROFILE } from "@/types/documents";

export function settingsToProfile(
  settings: Partial<UserDocumentSettings> | null | undefined
): UserProfile {
  if (!settings) return { ...EMPTY_PROFILE };

  return {
    fullName: settings.full_name ?? "",
    targetRole: settings.target_role ?? "",
    email: settings.email ?? "",
    phone: settings.phone ?? "",
    mobile: settings.mobile ?? "",
    languages: settings.languages ?? "",
    location: settings.location ?? "",
    linkedinUrl: settings.linkedin_url ?? "",
    website: settings.website ?? "",
    githubUrl: settings.github_url ?? "",
    extraLink: settings.extra_link ?? "",
    salaryRange: settings.salary_range ?? "",
    additionalInfo: settings.additional_info ?? "",
  };
}

export function profileToDbFields(profile: UserProfile) {
  return {
    full_name: profile.fullName,
    target_role: profile.targetRole,
    email: profile.email,
    phone: profile.phone,
    mobile: profile.mobile,
    languages: profile.languages,
    location: profile.location,
    linkedin_url: profile.linkedinUrl,
    website: profile.website,
    github_url: profile.githubUrl,
    extra_link: profile.extraLink,
    salary_range: profile.salaryRange,
    additional_info: profile.additionalInfo,
  };
}

/** Profile lines for AI prompts — only non-empty fields. */
export function formatProfileForPrompt(profile: UserProfile): string {
  const lines: string[] = [];

  if (profile.fullName) lines.push(`Name: ${profile.fullName}`);
  if (profile.targetRole) lines.push(`Role: ${profile.targetRole}`);
  if (profile.email) lines.push(`Email: ${profile.email}`);
  if (profile.phone) lines.push(`Phone: ${profile.phone}`);
  if (profile.mobile) lines.push(`Mobile: ${profile.mobile}`);
  if (profile.languages) lines.push(`Languages: ${profile.languages}`);
  if (profile.location) lines.push(`Location: ${profile.location}`);
  if (profile.linkedinUrl) lines.push(`LinkedIn: ${profile.linkedinUrl}`);
  if (profile.website) lines.push(`Website: ${profile.website}`);
  if (profile.githubUrl) lines.push(`GitHub: ${profile.githubUrl}`);
  if (profile.extraLink) lines.push(`Extra link: ${profile.extraLink}`);
  if (profile.salaryRange) lines.push(`Expected salary: ${profile.salaryRange}`);
  if (profile.additionalInfo) lines.push(`Additional: ${profile.additionalInfo}`);

  return lines.join("\n");
}
