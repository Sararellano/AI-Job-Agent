import type { UserProfile } from "@/types/documents";

function sanitizeFilenamePart(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/_+/g, "_") || "document"
  );
}

/**
 * Builds a download filename: {person}_{CV|Cover_Letter}_{company|default}.
 */
export function buildDocumentFilename(
  type: "cv" | "cover_letter",
  profile: Pick<UserProfile, "fullName">,
  company: string
): string {
  const person = sanitizeFilenamePart(profile.fullName.trim() || "candidate");
  const org = sanitizeFilenamePart(company.trim() || "default");
  const docLabel = type === "cv" ? "CV" : "Cover_Letter";

  return `${person}_${docLabel}_${org}`.slice(0, 120);
}
