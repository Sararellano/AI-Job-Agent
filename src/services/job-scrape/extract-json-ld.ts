import { sanitizeText } from "@/lib/security/validation";
import {
  MAX_JOB_COMPANY_LENGTH,
  MAX_JOB_DESCRIPTION_LENGTH,
  MAX_JOB_REQUIREMENTS_LENGTH,
  MAX_JOB_SUMMARY_LENGTH,
  MAX_JOB_TITLE_LENGTH,
} from "@/lib/security/validation";
import { htmlToPlainText } from "./fetch-job-page";
import type { ScrapedJobDraft } from "./parse-job-ai";

const SCRIPT_REGEX =
  /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

interface JsonLdJobPosting {
  "@type"?: string | string[];
  title?: string;
  description?: string;
  hiringOrganization?: { name?: string } | string;
  baseSalary?:
    | {
        value?: { value?: number | string; minValue?: number; maxValue?: number; unitText?: string };
        currency?: string;
      }
    | string;
  qualifications?: string;
  responsibilities?: string;
  skills?: string;
  experienceRequirements?: string;
  educationRequirements?: string;
}

/**
 * Extracts a JobPosting from any <script type="application/ld+json"> block.
 * Most major ATS (Greenhouse, Lever, Workable, Workday, SmartRecruiters,
 * Recruitee, Personio, Teamtailor, Ashby, GetManfred…) embed this and it is
 * far more reliable than asking an LLM to parse rendered HTML text.
 */
export function extractJobPostingFromHtml(html: string): ScrapedJobDraft | null {
  const blocks: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = SCRIPT_REGEX.exec(html))) {
    if (match[1]) blocks.push(match[1]);
  }

  for (const block of blocks) {
    const posting = findJobPosting(block);
    if (posting) {
      const draft = jobPostingToDraft(posting);
      if (draft.description.length >= 50) {
        return draft;
      }
    }
  }

  return null;
}

function findJobPosting(rawJson: string): JsonLdJobPosting | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson.trim());
  } catch {
    return null;
  }

  const candidates: unknown[] = [];
  const pushCandidate = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(pushCandidate);
    } else if (value && typeof value === "object") {
      candidates.push(value);
      const graph = (value as { "@graph"?: unknown })["@graph"];
      if (graph) pushCandidate(graph);
    }
  };
  pushCandidate(parsed);

  for (const candidate of candidates) {
    const type = (candidate as JsonLdJobPosting)["@type"];
    if (matchesJobPosting(type)) {
      return candidate as JsonLdJobPosting;
    }
  }
  return null;
}

function matchesJobPosting(type: string | string[] | undefined): boolean {
  if (!type) return false;
  if (Array.isArray(type)) return type.includes("JobPosting");
  return type === "JobPosting";
}

function jobPostingToDraft(posting: JsonLdJobPosting): ScrapedJobDraft {
  const descriptionHtml = posting.description ?? "";
  const description = htmlToPlainText(descriptionHtml);

  const company =
    typeof posting.hiringOrganization === "string"
      ? posting.hiringOrganization
      : posting.hiringOrganization?.name ?? "";

  const requirements = [
    posting.qualifications,
    posting.skills,
    posting.experienceRequirements,
    posting.educationRequirements,
  ]
    .filter((v): v is string => Boolean(v) && typeof v === "string")
    .map((v) => htmlToPlainText(v))
    .join("\n")
    .trim();

  return {
    title: sanitizeText(posting.title ?? "", MAX_JOB_TITLE_LENGTH),
    company: sanitizeText(company, MAX_JOB_COMPANY_LENGTH),
    description: sanitizeText(description, MAX_JOB_DESCRIPTION_LENGTH),
    summary: sanitizeText(
      description.split(/(?<=\.)\s/)[0] ?? "",
      MAX_JOB_SUMMARY_LENGTH
    ),
    requirements: sanitizeText(requirements, MAX_JOB_REQUIREMENTS_LENGTH),
    salary: sanitizeText(formatSalary(posting.baseSalary), 100),
  };
}

function formatSalary(salary: JsonLdJobPosting["baseSalary"]): string {
  if (!salary) return "";
  if (typeof salary === "string") return salary;
  const value = salary.value;
  if (!value) return "";
  const currency = salary.currency ?? "";
  if (value.minValue && value.maxValue) {
    return `${value.minValue}-${value.maxValue} ${currency} ${value.unitText ?? ""}`.trim();
  }
  if (value.value) {
    return `${value.value} ${currency} ${value.unitText ?? ""}`.trim();
  }
  return "";
}
