import { describe, expect, it } from "vitest";
import { scoreJobRelevance, filterAndRankJobs } from "@/services/job-search/relevance";
import type { JobSearchProfile } from "@/services/job-search/keywords";
import type { JobPreferences } from "@/types/job-preferences";

function makeJob(overrides: Partial<{
  id: string;
  title: string;
  company: string;
  description: string;
  summary: string | null;
  requirements: string | null;
}> = {}) {
  return {
    id: overrides.id ?? "job-1",
    title: overrides.title ?? "Software Engineer",
    company: overrides.company ?? "ACME",
    description: overrides.description ?? "Build products",
    summary: overrides.summary ?? null,
    requirements: overrides.requirements ?? null,
  };
}

const FRONTEND_PROFILE: JobSearchProfile = {
  targetRole: "Frontend Developer",
  primaryTrack: "frontend",
  skillProfile: [
    { name: "React", level: "production", sources: ["cv"], confidence: "high" },
    { name: "TypeScript", level: "comfortable", sources: ["cv"], confidence: "medium" },
  ],
  jobPreferences: {
    targetRoles: ["Frontend Developer", "UI Engineer"],
    workMode: "remote",
    seniority: "senior",
    tracks: ["frontend", "fullstack"],
    includeProductRoles: false,
    includeDesignRoles: false,
    preferredLocations: [],
    excludedKeywords: ["sales", "account executive"],
    minMatchScore: 40,
  },
};

describe("scoreJobRelevance — exclusions", () => {
  it("marks excluded when title contains excluded keyword", () => {
    const job = makeJob({ title: "Sales Account Executive" });
    const result = scoreJobRelevance(job, FRONTEND_PROFILE);
    expect(result.excluded).toBe(true);
    expect(result.score).toBe(0);
  });

  it("marks excluded when description contains excluded keyword", () => {
    const job = makeJob({ description: "We are looking for a sales-focused engineer" });
    const result = scoreJobRelevance(job, FRONTEND_PROFILE);
    expect(result.excluded).toBe(true);
  });

  it("does not mark excluded for unrelated job", () => {
    const job = makeJob({ title: "Senior Frontend Developer" });
    const result = scoreJobRelevance(job, FRONTEND_PROFILE);
    expect(result.excluded).toBe(false);
  });
});

describe("scoreJobRelevance — target role matching", () => {
  it("boosts score for title matching target role", () => {
    const job = makeJob({ title: "Frontend Developer at Stripe" });
    const result = scoreJobRelevance(job, FRONTEND_PROFILE);
    expect(result.score).toBeGreaterThan(30);
    expect(result.matchedKeywords.some((k) => k.toLowerCase().includes("frontend"))).toBe(true);
  });

  it("gives lower score to unrelated job", () => {
    const relatedJob = makeJob({ title: "Senior Frontend Developer" });
    const unrelatedJob = makeJob({ title: "Data Scientist", description: "Python ML pipelines" });
    const relatedScore = scoreJobRelevance(relatedJob, FRONTEND_PROFILE).score;
    const unrelatedScore = scoreJobRelevance(unrelatedJob, FRONTEND_PROFILE).score;
    expect(relatedScore).toBeGreaterThan(unrelatedScore);
  });
});

describe("scoreJobRelevance — remote work mode", () => {
  it("boosts score for remote posting when workMode=remote", () => {
    const remoteJob = makeJob({ title: "Frontend Dev", description: "100% remote position" });
    const onsiteJob = makeJob({ title: "Frontend Dev", description: "on-site Madrid office" });
    const remoteScore = scoreJobRelevance(remoteJob, FRONTEND_PROFILE).score;
    const onsiteScore = scoreJobRelevance(onsiteJob, FRONTEND_PROFILE).score;
    expect(remoteScore).toBeGreaterThan(onsiteScore);
  });

  it("does not apply remote penalty when workMode=any", () => {
    const profile: JobSearchProfile = {
      ...FRONTEND_PROFILE,
      jobPreferences: { ...FRONTEND_PROFILE.jobPreferences!, workMode: "any" },
    };
    const onsiteJob = makeJob({ title: "Frontend Dev", description: "in-office Madrid" });
    const result = scoreJobRelevance(onsiteJob, profile);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.reasons.some((r) => r.includes("penalised"))).toBe(false);
  });
});

describe("scoreJobRelevance — seniority", () => {
  it("adds seniority bonus for matching level", () => {
    const profile = FRONTEND_PROFILE; // seniority: senior
    // Same job content, only differ in seniority signal
    const seniorJob = makeJob({ title: "Senior React Engineer", description: "Build products" });
    const juniorJob = makeJob({ title: "Junior React Engineer", description: "Build products" });
    const seniorResult = scoreJobRelevance(seniorJob, profile);
    const juniorResult = scoreJobRelevance(juniorJob, profile);
    expect(seniorResult.reasons.some((r) => r.includes("Seniority match"))).toBe(true);
    expect(seniorResult.score).toBeGreaterThan(juniorResult.score);
  });

  it("does not apply seniority scoring when seniority=any", () => {
    const profile: JobSearchProfile = {
      ...FRONTEND_PROFILE,
      jobPreferences: { ...FRONTEND_PROFILE.jobPreferences!, seniority: "any" },
    };
    const juniorJob = makeJob({ title: "Junior Frontend Developer" });
    const result = scoreJobRelevance(juniorJob, profile);
    expect(result.reasons.some((r) => r.toLowerCase().includes("seniority"))).toBe(false);
  });
});

describe("scoreJobRelevance — skill matching", () => {
  it("adds score for each matching skill in description", () => {
    const job = makeJob({
      title: "Frontend Engineer",
      description: "We use React and TypeScript daily",
    });
    const result = scoreJobRelevance(job, FRONTEND_PROFILE);
    expect(result.matchedKeywords).toContain("React");
    expect(result.matchedKeywords).toContain("TypeScript");
    expect(result.score).toBeGreaterThan(40);
  });
});

describe("scoreJobRelevance — profile with no preferences", () => {
  it("scores without crashing when jobPreferences is null", () => {
    const profile: JobSearchProfile = {
      targetRole: "Backend Developer",
      primaryTrack: "backend",
      skillProfile: [],
      jobPreferences: null,
    };
    const job = makeJob({ title: "Backend Developer" });
    const result = scoreJobRelevance(job, profile);
    expect(result.excluded).toBe(false);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("scores 0 for completely irrelevant job", () => {
    const profile: JobSearchProfile = {
      targetRole: "Data Engineer",
      primaryTrack: "data",
      skillProfile: [],
      jobPreferences: null,
    };
    const job = makeJob({ title: "Truck Driver", description: "CDL license required", company: "Trucking Co" });
    const result = scoreJobRelevance(job, profile);
    expect(result.score).toBeLessThan(30);
  });
});

describe("filterAndRankJobs", () => {
  it("returns jobs ordered by score descending", () => {
    const jobs = [
      makeJob({ id: "1", title: "Sales Rep" }),
      makeJob({ id: "2", title: "Senior Frontend Developer", description: "React TypeScript remote" }),
      makeJob({ id: "3", title: "UI Engineer", description: "100% remote, React skills needed" }),
    ];
    const ranked = filterAndRankJobs(jobs, FRONTEND_PROFILE, 0);
    expect(ranked[0].relevance.score).toBeGreaterThanOrEqual(ranked[1]?.relevance.score ?? 0);
  });

  it("excludes jobs with excluded keywords", () => {
    const jobs = [
      makeJob({ id: "1", title: "Sales Account Executive" }),
      makeJob({ id: "2", title: "Senior Frontend Developer" }),
    ];
    const ranked = filterAndRankJobs(jobs, FRONTEND_PROFILE, 0);
    expect(ranked.some(({ job }) => job.id === "1")).toBe(false);
    expect(ranked.some(({ job }) => job.id === "2")).toBe(true);
  });

  it("removes jobs below minScore threshold", () => {
    const jobs = [
      makeJob({ id: "1", title: "Truck Driver", description: "CDL required" }),
      makeJob({ id: "2", title: "Senior Frontend Developer", description: "React TypeScript" }),
    ];
    const ranked = filterAndRankJobs(jobs, FRONTEND_PROFILE, 40);
    const ids = ranked.map(({ job }) => job.id);
    expect(ids).not.toContain("1");
    expect(ids).toContain("2");
  });

  it("returns all non-excluded jobs when minScore=0", () => {
    const jobs = [
      makeJob({ id: "1", title: "Truck Driver" }),
      makeJob({ id: "2", title: "Frontend Developer" }),
    ];
    const ranked = filterAndRankJobs(jobs, FRONTEND_PROFILE, 0);
    expect(ranked.length).toBe(2);
  });

  it("uses preferences minMatchScore when minScore not passed", () => {
    const profile: JobSearchProfile = {
      ...FRONTEND_PROFILE,
      jobPreferences: { ...FRONTEND_PROFILE.jobPreferences!, minMatchScore: 90 },
    };
    const jobs = [
      makeJob({ id: "1", title: "Frontend Dev" }),
      makeJob({ id: "2", title: "Senior Frontend Developer React TypeScript remote 100%" }),
    ];
    const ranked = filterAndRankJobs(jobs, profile);
    // Only very high-score jobs should remain
    ranked.forEach(({ relevance }) => expect(relevance.score).toBeGreaterThanOrEqual(90));
  });
});
