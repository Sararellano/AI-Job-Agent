import { describe, expect, it } from "vitest";
import {
  applyQuestionAnswers,
  buildQuestionQueue,
  buildSkillProfileFromCv,
} from "@/lib/skills/question-engine";
import type { DiscoveryQuestion, ParsedCvLocal } from "@/types/skills";

const frontendParsed: ParsedCvLocal = {
  version: 1,
  primaryTrack: "frontend",
  secondaryTracks: [],
  yearsExperienceEstimate: 6,
  detectedSkills: ["React", "JavaScript", "TypeScript"],
  skillConfidence: {
    React: "low",
    JavaScript: "high",
    TypeScript: "medium",
  },
  roles: [{ title: "Frontend Developer" }],
  signals: ["jest", "webpack"],
  emails: ["dev@example.com"],
};

describe("buildQuestionQueue", () => {
  it("returns prioritized questions for a frontend CV", () => {
    const questions = buildQuestionQueue(frontendParsed);

    expect(questions.length).toBeGreaterThan(0);
    expect(questions.length).toBeLessThanOrEqual(20);
    expect(questions[0].priority).toBeGreaterThanOrEqual(questions.at(-1)!.priority);
    expect(questions.some((q) => q.skillKeys.includes("react"))).toBe(true);
  });

  it("includes react transfer question for low-confidence React with strong JS", () => {
    const questions = buildQuestionQueue(frontendParsed);

    expect(questions.some((q) => q.id === "q-react-transfer")).toBe(true);
  });

  it("deduplicates questions by id", () => {
    const questions = buildQuestionQueue(frontendParsed);
    const ids = questions.map((q) => q.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("buildSkillProfileFromCv", () => {
  it("maps detected skills to evidence with correct levels", () => {
    const profile = buildSkillProfileFromCv(frontendParsed);

    expect(profile).toHaveLength(3);

    const react = profile.find((s) => s.name === "React");
    expect(react).toMatchObject({
      level: "touched",
      sources: ["cv"],
      confidence: "low",
    });

    const js = profile.find((s) => s.name === "JavaScript");
    expect(js).toMatchObject({
      level: "production",
      confidence: "high",
    });
  });
});

describe("applyQuestionAnswers", () => {
  const baseProfile = buildSkillProfileFromCv(frontendParsed);
  const questions: DiscoveryQuestion[] = [
    {
      id: "q-react-components",
      text: "Have you built React components?",
      category: "skill",
      skillKeys: ["react"],
      impliesOnYes: ["React", "React Hooks"],
      impliesOnSomewhat: ["React"],
      priority: 80,
    },
    {
      id: "q-docker-run",
      text: "Have you used Docker?",
      category: "skill",
      skillKeys: ["docker"],
      impliesOnYes: ["Docker"],
      impliesOnSomewhat: ["Docker"],
      priority: 70,
    },
  ];

  it("upgrades existing skills when user answers yes", () => {
    const result = applyQuestionAnswers(baseProfile, questions, {
      "q-react-components": "yes",
    });

    const react = result.find((s) => s.name === "React");
    expect(react).toMatchObject({
      level: "comfortable",
      confidence: "high",
      sources: expect.arrayContaining(["cv", "question"]),
    });
  });

  it("adds new skills from somewhat answers", () => {
    const result = applyQuestionAnswers(baseProfile, questions, {
      "q-docker-run": "somewhat",
    });

    const docker = result.find((s) => s.name === "Docker");
    expect(docker).toMatchObject({
      level: "touched",
      confidence: "medium",
      sources: ["question"],
    });
  });

  it("ignores skip, no, and imposter answers", () => {
    const imposterQuestions: DiscoveryQuestion[] = [
      {
        id: "q-imposter",
        text: "Imposter question",
        category: "imposter",
        skillKeys: [],
        impliesOnYes: ["FakeSkill"],
        impliesOnSomewhat: ["FakeSkill"],
        priority: 50,
      },
    ];

    const result = applyQuestionAnswers(
      baseProfile,
      [...questions, ...imposterQuestions],
      {
        "q-docker-run": "no",
        "q-react-components": "skip",
        "q-imposter": "yes",
      }
    );

    expect(result.find((s) => s.name === "Docker")).toBeUndefined();
    expect(result.find((s) => s.name === "FakeSkill")).toBeUndefined();
    expect(result.find((s) => s.name === "React")?.level).toBe("touched");
  });
});
