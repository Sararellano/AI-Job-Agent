import type { Job } from "@/types/database";
import type { JobPreferences } from "@/types/job-preferences";
import type { JobSearchProfile } from "@/services/job-search/keywords";
import {
  TRACK_ROLE_KEYWORDS,
  PRODUCT_KEYWORDS,
  DESIGN_KEYWORDS,
  extractSkillKeywords,
} from "@/services/job-search/keywords";

export interface JobRelevanceResult {
  score: number;
  matchedKeywords: string[];
  reasons: string[];
  /** True when an excludedKeyword is found — job should be hidden. */
  excluded: boolean;
}

const REMOTE_SIGNALS = [
  "remote",
  "remoto",
  "full remote",
  "100% remote",
  "distributed",
  "work from home",
  "wfh",
  "teletrabajo",
  "trabajo remoto",
];

const ONSITE_SIGNALS = [
  "on-site",
  "onsite",
  "on site",
  "presencial",
  "in-office",
  "in office",
  "office only",
];

/** Score contribution constants */
const SCORE = {
  ROLE_TITLE_MATCH: 35,
  TRACK_KEYWORD_MATCH: 25,
  PER_SKILL_MATCH: 8,
  MAX_SKILL_CONTRIBUTION: 32,
  REMOTE_BONUS: 15,
  ONSITE_PENALTY: -25,
  SENIORITY_MATCH: 10,
  SENIORITY_MISMATCH: -10,
} as const;

const SENIORITY_SIGNALS: Record<string, string[]> = {
  junior: ["junior", "entry level", "entry-level", "graduate", "intern", "trainee", "becario", "junior dev"],
  mid: ["mid", "mid-level", "intermediate", "experienced"],
  senior: ["senior", "sr.", "sr ", "experienced senior", "principal", "staff", "especialista"],
  lead: ["lead", "tech lead", "staff", "principal", "architect", "manager", "head of", "jefe"],
};

function buildJobText(job: Pick<Job, "title" | "company" | "description" | "summary" | "requirements">): string {
  return [job.title, job.company, job.description, job.summary ?? "", job.requirements ?? ""]
    .join(" ")
    .toLowerCase();
}

/**
 * Scores a single job against the user's search profile.
 * Returns a 0–100 relevance score, matched keywords, human-readable reasons,
 * and an excluded flag when the job contains a blocked keyword.
 */
export function scoreJobRelevance(
  job: Pick<Job, "title" | "company" | "description" | "summary" | "requirements">,
  profile: JobSearchProfile
): JobRelevanceResult {
  const prefs: JobPreferences | null | undefined = profile.jobPreferences;
  const text = buildJobText(job);
  const titleLower = job.title.toLowerCase();
  const matchedKeywords: string[] = [];
  const reasons: string[] = [];
  let score = 0;

  // 1. Exclusion check — hard stop
  if (prefs?.excludedKeywords?.length) {
    for (const excluded of prefs.excludedKeywords) {
      const normalized = excluded.toLowerCase().trim();
      if (normalized && text.includes(normalized)) {
        return { score: 0, matchedKeywords: [], reasons: [`Excluded: ${excluded}`], excluded: true };
      }
    }
  }

  // 2. Target role match (title)
  const roleStrings = prefs?.targetRoles?.length
    ? prefs.targetRoles
    : profile.targetRole
      ? [profile.targetRole]
      : [];

  for (const role of roleStrings) {
    const roleLower = role.toLowerCase();
    if (titleLower.includes(roleLower) || roleLower.includes(titleLower.split(" ")[0] ?? "")) {
      score += SCORE.ROLE_TITLE_MATCH;
      matchedKeywords.push(role);
      reasons.push(`Title matches target role: ${role}`);
      break;
    }
  }

  // 3. Track keyword match (title)
  const tracks = prefs?.tracks?.length
    ? prefs.tracks
    : profile.primaryTrack
      ? [profile.primaryTrack]
      : [];

  let trackHit = false;
  for (const track of tracks) {
    const trackKeywords = TRACK_ROLE_KEYWORDS[track] ?? [];
    for (const kw of trackKeywords) {
      if (titleLower.includes(kw)) {
        if (!trackHit) {
          score += SCORE.TRACK_KEYWORD_MATCH;
          trackHit = true;
        }
        matchedKeywords.push(kw);
        reasons.push(`Track keyword in title: ${kw}`);
        break;
      }
    }
    if (trackHit) break;
  }

  // 4. Skill matches in description
  const skills = extractSkillKeywords(profile.skillProfile ?? []);
  let skillScore = 0;
  for (const skill of skills) {
    if (skillScore >= SCORE.MAX_SKILL_CONTRIBUTION) break;
    if (text.includes(skill.toLowerCase())) {
      const points = Math.min(SCORE.PER_SKILL_MATCH, SCORE.MAX_SKILL_CONTRIBUTION - skillScore);
      skillScore += points;
      matchedKeywords.push(skill);
      reasons.push(`Skill match: ${skill}`);
    }
  }
  score += skillScore;

  // 5. Product / design role bonuses
  if (prefs?.includeProductRoles) {
    for (const kw of PRODUCT_KEYWORDS) {
      if (titleLower.includes(kw)) {
        score += SCORE.TRACK_KEYWORD_MATCH;
        matchedKeywords.push(kw);
        reasons.push(`Product role match: ${kw}`);
        break;
      }
    }
  }
  if (prefs?.includeDesignRoles) {
    for (const kw of DESIGN_KEYWORDS) {
      if (titleLower.includes(kw)) {
        score += SCORE.TRACK_KEYWORD_MATCH;
        matchedKeywords.push(kw);
        reasons.push(`Design role match: ${kw}`);
        break;
      }
    }
  }

  // 6. Work mode signals
  if (prefs?.workMode === "remote") {
    const hasRemote = REMOTE_SIGNALS.some((s) => text.includes(s));
    const hasOnsite = ONSITE_SIGNALS.some((s) => text.includes(s));
    if (hasRemote) {
      score += SCORE.REMOTE_BONUS;
      reasons.push("Remote-friendly posting");
    }
    if (hasOnsite && !hasRemote) {
      score += SCORE.ONSITE_PENALTY;
      reasons.push("On-site posting penalised");
    }
  }

  // 7. Seniority signals
  if (prefs?.seniority && prefs.seniority !== "any") {
    const senSignals = SENIORITY_SIGNALS[prefs.seniority] ?? [];
    const opposite = getOppositeSeniority(prefs.seniority);
    const hasMatch = senSignals.some((s) => text.includes(s));
    const hasMismatch = opposite.some((s) => text.includes(s));

    if (hasMatch) {
      score += SCORE.SENIORITY_MATCH;
      reasons.push(`Seniority match: ${prefs.seniority}`);
    } else if (hasMismatch) {
      score += SCORE.SENIORITY_MISMATCH;
      reasons.push(`Seniority mismatch`);
    }
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  return { score: finalScore, matchedKeywords, reasons, excluded: false };
}

/**
 * Filters and ranks a list of jobs by relevance score.
 * Jobs marked excluded are removed entirely.
 * Jobs below minScore are removed (unless minScore is 0).
 */
export function filterAndRankJobs(
  jobs: Pick<Job, "id" | "title" | "company" | "description" | "summary" | "requirements">[],
  profile: JobSearchProfile,
  minScore?: number
): Array<{ job: typeof jobs[number]; relevance: JobRelevanceResult }> {
  const threshold = minScore ?? profile.jobPreferences?.minMatchScore ?? 0;

  return jobs
    .map((job) => ({ job, relevance: scoreJobRelevance(job, profile) }))
    .filter(({ relevance }) => !relevance.excluded && relevance.score >= threshold)
    .sort((a, b) => b.relevance.score - a.relevance.score);
}

function getOppositeSeniority(level: string): string[] {
  if (level === "senior" || level === "lead") {
    return [...SENIORITY_SIGNALS.junior, ...SENIORITY_SIGNALS.mid];
  }
  if (level === "junior") {
    return [...SENIORITY_SIGNALS.senior, ...SENIORITY_SIGNALS.lead];
  }
  return [];
}
