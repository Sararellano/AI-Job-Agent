import type { CareerTrack } from "@/types/skills";

export type WorkMode = "remote" | "hybrid" | "onsite" | "any";
export type SeniorityLevel = "junior" | "mid" | "senior" | "lead" | "any";

export interface JobPreferences {
  /** Desired job titles, e.g. ["Frontend Developer", "UI Engineer"] */
  targetRoles: string[];
  /** Preferred work mode */
  workMode: WorkMode;
  /** Preferred seniority level */
  seniority: SeniorityLevel;
  /** Career tracks to include in searches */
  tracks: CareerTrack[];
  /** Include PM / product owner roles */
  includeProductRoles: boolean;
  /** Include UX/design roles */
  includeDesignRoles: boolean;
  /** Preferred cities or regions, e.g. ["Madrid", "Remote EU"] */
  preferredLocations: string[];
  /** Terms that disqualify a posting, e.g. ["sales", "unpaid"] */
  excludedKeywords: string[];
  /** Minimum relevance score to show in dashboard (0–100) */
  minMatchScore: number;
}

export const DEFAULT_JOB_PREFERENCES: JobPreferences = {
  targetRoles: [],
  workMode: "any",
  seniority: "any",
  tracks: [],
  includeProductRoles: false,
  includeDesignRoles: false,
  preferredLocations: [],
  excludedKeywords: [],
  minMatchScore: 40,
};

/** Infers default preferences from a parsed career track. */
export function inferDefaultPreferences(
  primaryTrack: CareerTrack | null | undefined,
  targetRole: string | null | undefined
): Partial<JobPreferences> {
  const overrides: Partial<JobPreferences> = {};

  if (primaryTrack && primaryTrack !== "general") {
    overrides.tracks = [primaryTrack];
    if (primaryTrack === "frontend" || primaryTrack === "backend") {
      overrides.tracks = [primaryTrack, "fullstack"];
    }
  }

  if (targetRole?.trim()) {
    overrides.targetRoles = [targetRole.trim()];
  }

  const roleStr = (targetRole ?? "").toLowerCase();
  if (/\b(product|pm\b|owner|tpm)\b/.test(roleStr)) {
    overrides.includeProductRoles = true;
  }
  if (/\b(ux|ui|design|figma)\b/.test(roleStr)) {
    overrides.includeDesignRoles = true;
  }

  return overrides;
}

/**
 * Merges stored DB preferences with defaults, sanitizing unknown fields.
 */
export function parseJobPreferences(raw: unknown): JobPreferences {
  const defaults = { ...DEFAULT_JOB_PREFERENCES };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return defaults;
  }

  const r = raw as Record<string, unknown>;

  const VALID_WORK_MODES = new Set<WorkMode>(["remote", "hybrid", "onsite", "any"]);
  const VALID_SENIORITY = new Set<SeniorityLevel>(["junior", "mid", "senior", "lead", "any"]);

  return {
    targetRoles: parseStringArray(r.targetRoles, 10, 100),
    workMode: VALID_WORK_MODES.has(r.workMode as WorkMode)
      ? (r.workMode as WorkMode)
      : defaults.workMode,
    seniority: VALID_SENIORITY.has(r.seniority as SeniorityLevel)
      ? (r.seniority as SeniorityLevel)
      : defaults.seniority,
    tracks: parseStringArray(r.tracks, 7, 30).filter(isCareerTrack) as CareerTrack[],
    includeProductRoles: r.includeProductRoles === true,
    includeDesignRoles: r.includeDesignRoles === true,
    preferredLocations: parseStringArray(r.preferredLocations, 10, 80),
    excludedKeywords: parseStringArray(r.excludedKeywords, 20, 60),
    minMatchScore:
      typeof r.minMatchScore === "number" &&
      r.minMatchScore >= 0 &&
      r.minMatchScore <= 100
        ? Math.round(r.minMatchScore)
        : defaults.minMatchScore,
  };
}

const VALID_TRACKS = new Set<CareerTrack>([
  "frontend",
  "backend",
  "fullstack",
  "devops",
  "mobile",
  "data",
  "general",
]);

function isCareerTrack(value: string): boolean {
  return VALID_TRACKS.has(value as CareerTrack);
}

function parseStringArray(
  value: unknown,
  maxItems: number,
  maxItemLength: number
): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, maxItemLength))
    .filter((item) => item.length > 0)
    .slice(0, maxItems);
}
