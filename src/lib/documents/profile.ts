import type { UserProfile } from "@/types/documents";
import type { UserDocumentSettings } from "@/types/database";
import { EMPTY_PROFILE } from "@/types/documents";

/** Primary phone line for documents — mobile only, with legacy phone fallback. */
export function getContactPhone(profile: UserProfile): string {
  return profile.mobile || profile.phone;
}

export function settingsToProfile(
  settings: Partial<UserDocumentSettings> | null | undefined
): UserProfile {
  if (!settings) return { ...EMPTY_PROFILE };

  const legacyPhone = settings.phone ?? "";
  const mobile = settings.mobile?.trim() ? settings.mobile : legacyPhone;

  return {
    fullName: settings.full_name ?? "",
    targetRole: settings.target_role ?? "",
    email: settings.email ?? "",
    phone: "",
    mobile,
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
    phone: "",
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
  const contactPhone = getContactPhone(profile);
  if (contactPhone) lines.push(`Mobile: ${contactPhone}`);
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
