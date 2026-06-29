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

const API_TIMEOUT_MS = 10_000;

/**
 * Detects known ATS public JSON endpoints from a posting URL.
 * Returns null if the URL doesn't match a supported ATS.
 */
export function buildAtsApiUrl(postingUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(postingUrl);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname;

  // Greenhouse: https://boards.greenhouse.io/{org}/jobs/{id}
  if (host === "boards.greenhouse.io") {
    const match = path.match(/^\/([^/]+)\/jobs\/(\d+)/);
    if (match) {
      const [, org, id] = match;
      return `https://boards-api.greenhouse.io/v1/boards/${org}/jobs/${id}?questions=false`;
    }
  }

  // Lever: https://jobs.lever.co/{org}/{uuid}
  if (host === "jobs.lever.co") {
    const match = path.match(
      /^\/([^/]+)\/([0-9a-f-]{36})/i
    );
    if (match) {
      const [, org, id] = match;
      return `https://api.lever.co/v0/postings/${org}/${id}?mode=json`;
    }
  }

  return null;
}

/**
 * Fetches a draft via known ATS JSON APIs (Greenhouse, Lever).
 * Returns null on any non-2xx or parsing failure so callers can fall back.
 */
export async function fetchDraftFromAtsApi(
  postingUrl: string
): Promise<ScrapedJobDraft | null> {
  const apiUrl = buildAtsApiUrl(postingUrl);
  if (!apiUrl) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(apiUrl, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;

    if (apiUrl.includes("greenhouse.io")) {
      return mapGreenhouse(data);
    }
    if (apiUrl.includes("lever.co")) {
      return mapLever(data);
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function mapGreenhouse(data: Record<string, unknown>): ScrapedJobDraft | null {
  const title = typeof data.title === "string" ? data.title : "";
  const descriptionHtml =
    typeof data.content === "string" ? data.content : "";
  const description = htmlToPlainText(descriptionHtml);
  if (!description) return null;

  const company =
    (data.company_name as string | undefined) ??
    ((data.departments as Array<{ name?: string }> | undefined)?.[0]?.name ??
      "");

  return {
    title: sanitizeText(title, MAX_JOB_TITLE_LENGTH),
    company: sanitizeText(company, MAX_JOB_COMPANY_LENGTH),
    description: sanitizeText(description, MAX_JOB_DESCRIPTION_LENGTH),
    summary: sanitizeText(
      description.split(/(?<=\.)\s/)[0] ?? "",
      MAX_JOB_SUMMARY_LENGTH
    ),
    requirements: "",
    salary: "",
  };
}

function mapLever(data: Record<string, unknown>): ScrapedJobDraft | null {
  const text = typeof data.text === "string" ? data.text : "";
  const descriptionPlain =
    typeof data.descriptionPlain === "string"
      ? data.descriptionPlain
      : typeof data.description === "string"
        ? htmlToPlainText(data.description)
        : "";

  const listsField = Array.isArray(data.lists)
    ? (data.lists as Array<{ text?: string; content?: string }>)
    : [];
  const requirements = listsField
    .map((list) =>
      `${list.text ? `${list.text}: ` : ""}${htmlToPlainText(list.content ?? "")}`
    )
    .filter(Boolean)
    .join("\n");

  if (!descriptionPlain) return null;

  return {
    title: sanitizeText(text, MAX_JOB_TITLE_LENGTH),
    company: sanitizeText(
      (data.categories as { team?: string } | undefined)?.team ?? "",
      MAX_JOB_COMPANY_LENGTH
    ),
    description: sanitizeText(descriptionPlain, MAX_JOB_DESCRIPTION_LENGTH),
    summary: sanitizeText(
      descriptionPlain.split(/(?<=\.)\s/)[0] ?? "",
      MAX_JOB_SUMMARY_LENGTH
    ),
    requirements: sanitizeText(requirements, MAX_JOB_REQUIREMENTS_LENGTH),
    salary: "",
  };
}
