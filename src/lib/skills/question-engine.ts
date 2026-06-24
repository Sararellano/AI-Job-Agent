import type { UserCareerContext } from "@/types/career";
import type {
  DiscoveryQuestion,
  ParsedCvLocal,
  QuestionAnswer,
  SkillEvidence,
  SkillConfidence,
} from "@/types/skills";
import {
  getMeritQuestions,
  getRoleSkillKeys,
  getTaxonomy,
} from "@/lib/skills/registry";

const MAX_QUESTIONS = 20;

/**
 * Selects discovery questions from sector taxonomy — no AI, zero tokens.
 */
export function buildQuestionQueue(
  parsed: ParsedCvLocal,
  context: UserCareerContext
): DiscoveryQuestion[] {
  const questions: DiscoveryQuestion[] = [];
  const seenIds = new Set<string>();
  const taxonomy = getTaxonomy(context.sector);
  const meritQuestions = getMeritQuestions(context.sector);

  function add(q: DiscoveryQuestion, priorityBoost = 0) {
    if (seenIds.has(q.id)) return;
    seenIds.add(q.id);
    questions.push({ ...q, priority: q.priority + priorityBoost });
  }

  const roleFamilies = new Set<string>([context.roleFamily]);
  if (context.sector === "tech") {
    roleFamilies.add(parsed.primaryTrack);
    for (const track of parsed.secondaryTracks) {
      roleFamilies.add(track);
    }
  }

  const skillKeys = new Set<string>();
  for (const roleFamily of roleFamilies) {
    for (const key of getRoleSkillKeys(context.sector, roleFamily)) {
      skillKeys.add(key);
    }
  }

  for (const signal of parsed.signals) {
    for (const [key, entry] of Object.entries(taxonomy)) {
      if (entry.signals.some((s) => signal.includes(s) || s.includes(signal))) {
        skillKeys.add(key);
      }
    }
  }

  for (const skill of parsed.detectedSkills) {
    const key = skill.toLowerCase().replace(/[^a-z]/g, "");
    for (const [taxKey, entry] of Object.entries(taxonomy)) {
      if (
        entry.displayName.toLowerCase() === skill.toLowerCase() ||
        taxKey === key
      ) {
        skillKeys.add(taxKey);
      }
    }
  }

  for (const key of skillKeys) {
    const entry = taxonomy[key];
    if (!entry) continue;

    const confidence = entry.displayName
      ? parsed.skillConfidence[entry.displayName]
      : undefined;
    const boost =
      confidence === "low" ? 50 : confidence === "medium" ? 25 : 0;

    for (const q of entry.questions) {
      add(
        {
          id: q.id,
          text: q.text,
          category: "skill",
          skillKeys: [key],
          impliesOnYes: q.impliesOnYes,
          impliesOnSomewhat: q.impliesOnSomewhat ?? q.impliesOnYes,
          priority: 70 + boost,
        },
        boost
      );
    }
  }

  if (
    context.sector === "tech" &&
    context.roleFamily === "frontend" &&
    parsed.skillConfidence["React"] === "low" &&
    (parsed.skillConfidence["JavaScript"] === "high" ||
      parsed.detectedSkills.includes("JavaScript"))
  ) {
    add({
      id: "q-react-transfer",
      text: "You've used JavaScript for years — have you used React in any real project, even small?",
      category: "skill",
      skillKeys: ["react"],
      impliesOnYes: ["React"],
      impliesOnSomewhat: ["React", "JavaScript"],
      priority: 95,
    });
  }

  for (const q of meritQuestions) {
    if (q.category === "imposter") {
      if (
        context.sector === "tech" &&
        context.roleFamily === "frontend" &&
        parsed.yearsExperienceEstimate &&
        parsed.yearsExperienceEstimate >= 5
      ) {
        add(q, 10);
      }
    } else {
      add(q);
    }
  }

  return questions
    .sort((a, b) => b.priority - a.priority)
    .slice(0, MAX_QUESTIONS);
}

/**
 * Merges CV-detected skills with question answers into a skill profile.
 */
export function buildSkillProfileFromCv(
  parsed: ParsedCvLocal
): SkillEvidence[] {
  return parsed.detectedSkills.map((name) => ({
    name,
    level:
      parsed.skillConfidence[name] === "high"
        ? "production"
        : parsed.skillConfidence[name] === "medium"
          ? "comfortable"
          : "touched",
    sources: ["cv"] as SkillEvidence["sources"],
    confidence: parsed.skillConfidence[name] ?? "medium",
  }));
}

export function applyQuestionAnswers(
  profile: SkillEvidence[],
  questions: DiscoveryQuestion[],
  answers: Record<string, QuestionAnswer>
): SkillEvidence[] {
  const map = new Map<string, SkillEvidence>();
  for (const s of profile) {
    map.set(s.name.toLowerCase(), { ...s });
  }

  for (const q of questions) {
    const answer = answers[q.id];
    if (!answer || answer === "skip" || answer === "no") continue;
    if (q.category === "imposter") continue;

    const implies =
      answer === "yes" ? q.impliesOnYes : q.impliesOnSomewhat;
    const level = answer === "yes" ? "comfortable" : "touched";
    const confidence: SkillConfidence =
      answer === "yes" ? "high" : "medium";

    for (const skillName of implies) {
      const key = skillName.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        if (!existing.sources.includes("question")) {
          existing.sources.push("question");
        }
        if (answer === "yes" && existing.level === "touched") {
          existing.level = "comfortable";
        }
        existing.confidence =
          confidence === "high" ? "high" : existing.confidence;
      } else {
        map.set(key, {
          name: skillName,
          level,
          sources: ["question"],
          confidence,
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}
