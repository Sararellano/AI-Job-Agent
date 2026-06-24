import type { CreateJobInput } from "@/types/database";
import type { CareerTrack, SkillEvidence } from "@/types/skills";
import type { JobPreferences } from "@/types/job-preferences";

export interface JobSearchProfile {
  targetRole?: string | null;
  primaryTrack?: CareerTrack | null;
  skillProfile?: SkillEvidence[];
  additionalKeywords?: string[];
  /** When set, strict mode uses preferences instead of broad defaults. */
  jobPreferences?: JobPreferences | null;
}

/**
 * Keyword build mode.
 * - "broad": includes DEFAULT_TECH_KEYWORDS; used by cron/global sync.
 * - "strict": only profile-derived keywords; used by manual sync + matching.
 */
export type KeywordMode = "broad" | "strict";

/** Role-title keywords per engineering track. */
export const TRACK_ROLE_KEYWORDS: Record<CareerTrack, string[]> = {
  frontend: [
    "frontend",
    "front-end",
    "front end",
    "react",
    "vue",
    "angular",
    "ui engineer",
    "web developer",
    "javascript developer",
    "typescript developer",
  ],
  backend: [
    "backend",
    "back-end",
    "back end",
    "api developer",
    "server",
    "microservices",
    "java developer",
    "node",
    "python developer",
    "go developer",
    "golang",
    ".net developer",
  ],
  fullstack: [
    "full stack",
    "fullstack",
    "full-stack",
    "software engineer",
    "web developer",
  ],
  devops: [
    "devops",
    "sre",
    "site reliability",
    "platform engineer",
    "infrastructure",
    "cloud engineer",
    "kubernetes",
    "terraform",
    "aws engineer",
    "azure engineer",
    "gcp engineer",
  ],
  mobile: [
    "mobile",
    "ios",
    "android",
    "react native",
    "flutter",
    "swift",
    "kotlin",
    "mobile developer",
  ],
  data: [
    "data engineer",
    "data scientist",
    "ml engineer",
    "machine learning",
    "analytics engineer",
    "ai engineer",
    "business intelligence",
    "etl",
  ],
  general: [
    "software engineer",
    "software developer",
    "developer",
    "engineer",
    "programmer",
  ],
};

/** Product management and adjacent roles. */
export const PRODUCT_KEYWORDS = [
  "product manager",
  "product owner",
  "product lead",
  "head of product",
  "group product manager",
  "technical product manager",
  "tpm",
  "associate product manager",
  "senior product manager",
  "principal product manager",
  "product designer",
  "product marketing manager",
  "growth product manager",
  "platform product manager",
];

/** Design and UX roles often grouped with product teams. */
export const DESIGN_KEYWORDS = [
  "ux designer",
  "ui designer",
  "ux researcher",
  "product designer",
  "interaction designer",
  "design systems",
];

/** QA, security and other common tech verticals. */
export const OTHER_TECH_KEYWORDS = [
  "qa engineer",
  "test engineer",
  "quality assurance",
  "automation engineer",
  "security engineer",
  "cybersecurity",
  "penetration tester",
  "database administrator",
  "dba",
  "solutions architect",
  "systems architect",
  "engineering manager",
  "tech lead",
  "scrum master",
  "agile coach",
];

/** Broad defaults when the profile has no signals yet. */
export const DEFAULT_TECH_KEYWORDS = [
  ...TRACK_ROLE_KEYWORDS.frontend,
  ...TRACK_ROLE_KEYWORDS.backend,
  ...TRACK_ROLE_KEYWORDS.fullstack,
  ...TRACK_ROLE_KEYWORDS.devops,
  ...TRACK_ROLE_KEYWORDS.mobile,
  ...TRACK_ROLE_KEYWORDS.data,
  ...PRODUCT_KEYWORDS,
  ...DESIGN_KEYWORDS,
  ...OTHER_TECH_KEYWORDS,
  "desarrollador",
  "programador",
  "ingeniero software",
  "ingeniero informático",
  "científico de datos",
  "analista de datos",
  "administrador de sistemas",
  "arquitecto software",
];

const PRODUCT_TRACK_HINT =
  /\b(product|pm\b|owner|tpm|roadmap|backlog|producto)\b/i;

const DESIGN_TRACK_HINT = /\b(ux|ui|design|diseño|figma)\b/i;

const MIN_KEYWORD_LENGTH = 3;
const MAX_KEYWORDS = 120;
const MAX_INFOJOBS_QUERIES = 12;

/**
 * Extracts searchable terms from onboarding skill evidence.
 */
export function extractSkillKeywords(skillProfile: SkillEvidence[]): string[] {
  return skillProfile
    .filter(
      (skill) =>
        skill.level !== "touched" ||
        skill.confidence === "medium" ||
        skill.confidence === "high"
    )
    .map((skill) => skill.name.trim())
    .filter((name) => name.length >= MIN_KEYWORD_LENGTH);
}

function addKeyword(keywords: Set<string>, value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || normalized.length < MIN_KEYWORD_LENGTH) {
    return;
  }
  keywords.add(normalized);
}

function addPhraseTokens(keywords: Set<string>, phrase: string) {
  addKeyword(keywords, phrase);
  phrase
    .split(/[\s,/|+-]+/)
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length >= MIN_KEYWORD_LENGTH)
    .forEach((token) => keywords.add(token));
}

/**
 * Builds a keyword set from the profile.
 *
 * mode = "strict" → only profile-derived terms (used by manual sync + relevance scoring).
 * mode = "broad"  → adds DEFAULT_TECH_KEYWORDS fallback (used by cron global sync).
 */
export function buildSearchKeywords(
  profile: JobSearchProfile,
  mode: KeywordMode = "broad"
): string[] {
  const keywords = new Set<string>();
  const prefs = profile.jobPreferences;

  // Extra env/caller-supplied keywords always included
  profile.additionalKeywords?.forEach((keyword) => addPhraseTokens(keywords, keyword));

  // Target roles: prefer preferences list, fall back to single targetRole field
  const roleStrings: string[] = prefs?.targetRoles?.length
    ? prefs.targetRoles
    : profile.targetRole?.trim()
      ? [profile.targetRole.trim()]
      : [];

  for (const role of roleStrings) {
    addPhraseTokens(keywords, role);
  }

  // Tracks: prefer preferences list, fall back to single primary_track
  const tracks: CareerTrack[] = prefs?.tracks?.length
    ? prefs.tracks
    : profile.primaryTrack
      ? [profile.primaryTrack]
      : [];

  for (const track of tracks) {
    TRACK_ROLE_KEYWORDS[track].forEach((keyword) => keywords.add(keyword));
    if (track === "frontend" || track === "backend") {
      TRACK_ROLE_KEYWORDS.fullstack.forEach((keyword) => keywords.add(keyword));
    }
  }

  // Confirmed skills from onboarding
  extractSkillKeywords(profile.skillProfile ?? []).forEach((keyword) =>
    addKeyword(keywords, keyword)
  );

  // Product / design role expansions
  const allRoleText = roleStrings.join(" ");
  const includeProduct = prefs?.includeProductRoles ??
    PRODUCT_TRACK_HINT.test(allRoleText) ??
    PRODUCT_TRACK_HINT.test(profile.targetRole ?? "");
  const includeDesign = prefs?.includeDesignRoles ??
    DESIGN_TRACK_HINT.test(allRoleText) ??
    DESIGN_TRACK_HINT.test(profile.targetRole ?? "");

  if (includeProduct) {
    PRODUCT_KEYWORDS.forEach((keyword) => keywords.add(keyword));
  }
  if (includeDesign) {
    DESIGN_KEYWORDS.forEach((keyword) => keywords.add(keyword));
  }

  // Broad mode only: add catch-all defaults so cron keeps fetching wide variety
  if (mode === "broad") {
    DEFAULT_TECH_KEYWORDS.forEach((keyword) => keywords.add(keyword));
  }

  // Remove excluded keywords (strict mode only, no point in broad)
  if (mode === "strict" && prefs?.excludedKeywords?.length) {
    for (const excluded of prefs.excludedKeywords) {
      keywords.delete(excluded.toLowerCase().trim());
    }
  }

  return [...keywords].slice(0, MAX_KEYWORDS);
}

/**
 * Picks focused search queries for InfoJobs (one API call per query).
 */
export function buildInfoJobsQueries(keywords: string[]): string[] {
  const queries = new Set<string>();

  const sorted = [...keywords].sort((a, b) => b.length - a.length);
  for (const keyword of sorted) {
    if (keyword.length >= 4) {
      queries.add(keyword);
    }
    if (queries.size >= MAX_INFOJOBS_QUERIES) {
      break;
    }
  }

  if (queries.size === 0) {
    [
      "desarrollador software",
      "devops",
      "product manager",
      "data engineer",
      "frontend",
      "backend",
    ].forEach((query) => queries.add(query));
  }

  return [...queries].slice(0, MAX_INFOJOBS_QUERIES);
}

/**
 * Returns true when posting text matches at least one keyword.
 */
export function matchesJobPosting(text: string, keywords: string[]): boolean {
  if (keywords.length === 0) {
    return true;
  }

  const haystack = text.toLowerCase();
  return keywords.some((keyword) => {
    const normalized = keyword.trim().toLowerCase();
    return (
      normalized.length >= MIN_KEYWORD_LENGTH && haystack.includes(normalized)
    );
  });
}

/**
 * Filters normalized job postings by keyword relevance.
 */
export function filterJobsByKeywords(
  jobs: CreateJobInput[],
  keywords: string[]
): CreateJobInput[] {
  return jobs.filter((job) =>
    matchesJobPosting(
      `${job.title} ${job.company} ${job.description} ${job.summary ?? ""} ${job.requirements ?? ""}`,
      keywords
    )
  );
}
