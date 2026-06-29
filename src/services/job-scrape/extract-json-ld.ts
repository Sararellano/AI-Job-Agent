import { sanitizeText } from "@/lib/security/validation";
import {
  MAX_JOB_COMPANY_LENGTH,
  MAX_JOB_DESCRIPTION_LENGTH,
  MAX_JOB_REQUIREMENTS_LENGTH,
  MAX_JOB_SALARY_LENGTH,
  MAX_JOB_SUMMARY_LENGTH,
  MAX_JOB_TITLE_LENGTH,
} from "@/lib/security/validation";
import type { ScrapedJobDraft } from "./parse-job-ai";

interface JsonLdNode {
  "@type"?: string | string[];
  title?: string;
  name?: string;
  description?: string;
  hiringOrganization?: { name?: string };
  baseSalary?: { value?: { value?: number; unitText?: string } };
  occupationalCategory?: string;
  skills?: string | string[];
  qualifications?: string;
  responsibilities?: string;
  experienceRequirements?: string;
  educationRequirements?: string;
}

/**
 * Extracts JobPosting fields from application/ld+json blocks in HTML.
 */
export function extractJsonLdJobPosting(html: string): ScrapedJobDraft | null {
  const blocks = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  if (!blocks) return null;

  for (const block of blocks) {
    const raw = block
      .replace(/<script[^>]*>/i, "")
      .replace(/<\/script>/i, "")
      .trim();
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw) as JsonLdNode | JsonLdNode[];
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        const draft = nodeToDraft(node);
        if (draft?.description) return draft;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function nodeToDraft(node: JsonLdNode): ScrapedJobDraft | null {
  if (!isJobPosting(node)) return null;

  const title = sanitizeText(String(node.title ?? node.name ?? ""), MAX_JOB_TITLE_LENGTH);
  const company = sanitizeText(
    String(node.hiringOrganization?.name ?? ""),
    MAX_JOB_COMPANY_LENGTH
  );
  const description = sanitizeText(
    stripHtml(String(node.description ?? "")),
    MAX_JOB_DESCRIPTION_LENGTH
  );

  if (!description) return null;

  const requirementsParts = [
    node.qualifications,
    node.experienceRequirements,
    node.educationRequirements,
    formatSkills(node.skills),
    node.responsibilities,
  ].filter(Boolean);

  const salary = formatSalary(node.baseSalary);

  return {
    title,
    company,
    description,
    summary: sanitizeText(description.slice(0, 200), MAX_JOB_SUMMARY_LENGTH),
    requirements: sanitizeText(
      requirementsParts.join("\n"),
      MAX_JOB_REQUIREMENTS_LENGTH
    ),
    salary: sanitizeText(salary, MAX_JOB_SALARY_LENGTH),
  };
}

function isJobPosting(node: JsonLdNode): boolean {
  const type = node["@type"];
  if (!type) return false;
  const types = Array.isArray(type) ? type : [type];
  return types.some((t) => t.toLowerCase().includes("jobposting"));
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function formatSkills(skills: string | string[] | undefined): string {
  if (!skills) return "";
  return Array.isArray(skills) ? skills.join(", ") : skills;
}

function formatSalary(
  baseSalary: JsonLdNode["baseSalary"]
): string {
  const value = baseSalary?.value?.value;
  const unit = baseSalary?.value?.unitText;
  if (value == null) return "";
  return unit ? `${value} ${unit}` : String(value);
}
