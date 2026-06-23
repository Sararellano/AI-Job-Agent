import type {
  CareerTrack,
  ParsedCvLocal,
  SkillConfidence,
} from "@/types/skills";
import { truncateCvText } from "@/lib/cv/extract-text";

const TRACK_SIGNALS: Record<CareerTrack, string[]> = {
  frontend: [
    "react",
    "vue",
    "angular",
    "frontend",
    "front-end",
    "css",
    "tailwind",
    "ui",
    "ux",
    "jsx",
    "tsx",
  ],
  backend: [
    "backend",
    "back-end",
    "api",
    "node",
    "express",
    "django",
    "spring",
    "postgresql",
    "mysql",
  ],
  fullstack: ["fullstack", "full-stack", "full stack"],
  devops: [
    "devops",
    "docker",
    "kubernetes",
    "k8s",
    "ci/cd",
    "terraform",
    "aws",
    "azure",
    "gcp",
    "jenkins",
    "github actions",
  ],
  mobile: ["react native", "flutter", "swift", "kotlin", "ios", "android"],
  data: ["python", "pandas", "machine learning", "data engineer", "sql", "etl"],
  general: [],
};

const SKILL_PATTERNS: { name: string; patterns: RegExp[] }[] = [
  { name: "JavaScript", patterns: [/\bjavascript\b/i, /\bjs\b/i, /\bes6\b/i] },
  { name: "TypeScript", patterns: [/\btypescript\b/i, /\bts\b/i] },
  { name: "React", patterns: [/\breact\b/i, /\bjsx\b/i, /\btsx\b/i] },
  { name: "Vue", patterns: [/\bvue\.?js\b/i, /\bvue\b/i] },
  { name: "Angular", patterns: [/\bangular\b/i] },
  { name: "Next.js", patterns: [/\bnext\.?js\b/i] },
  { name: "Node.js", patterns: [/\bnode\.?js\b/i] },
  { name: "HTML", patterns: [/\bhtml5?\b/i] },
  { name: "CSS", patterns: [/\bcss3?\b/i, /\bsass\b/i, /\bscss\b/i] },
  { name: "Tailwind CSS", patterns: [/\btailwind\b/i] },
  { name: "Python", patterns: [/\bpython\b/i] },
  { name: "Java", patterns: [/\bjava\b/i] },
  { name: "Docker", patterns: [/\bdocker\b/i, /docker-compose/i] },
  { name: "Kubernetes", patterns: [/\bkubernetes\b/i, /\bk8s\b/i] },
  { name: "YAML", patterns: [/\byaml\b/i, /\.ya?ml\b/i] },
  { name: "AWS", patterns: [/\baws\b/i, /amazon web services/i] },
  { name: "Git", patterns: [/\bgit\b/i, /\bgithub\b/i, /\bgitlab\b/i] },
  { name: "CI/CD", patterns: [/\bci\/cd\b/i, /continuous integration/i] },
  { name: "SQL", patterns: [/\bsql\b/i, /\bpostgresql\b/i, /\bmysql\b/i] },
  { name: "MongoDB", patterns: [/\bmongodb\b/i] },
  { name: "GraphQL", patterns: [/\bgraphql\b/i] },
  { name: "REST APIs", patterns: [/\brest\b/i, /\brestful\b/i] },
  { name: "Jest", patterns: [/\bjest\b/i] },
  { name: "Webpack", patterns: [/\bwebpack\b/i] },
  { name: "Linux", patterns: [/\blinux\b/i, /\bbash\b/i] },
];

/**
 * Heuristic CV parser — no AI, runs locally on extracted text.
 */
export function parseCvHeuristics(rawText: string): ParsedCvLocal {
  const text = truncateCvText(rawText);
  const lower = text.toLowerCase();

  const detectedSkills: string[] = [];
  const skillConfidence: Record<string, SkillConfidence> = {};

  for (const { name, patterns } of SKILL_PATTERNS) {
    let count = 0;
    for (const p of patterns) {
      const matches = lower.match(new RegExp(p.source, "gi"));
      if (matches) count += matches.length;
    }
    if (count > 0) {
      detectedSkills.push(name);
      skillConfidence[name] =
        count >= 3 ? "high" : count >= 2 ? "medium" : "low";
    }
  }

  const trackScores = Object.entries(TRACK_SIGNALS).map(([track, signals]) => {
    const score = signals.reduce(
      (acc, s) => acc + (lower.includes(s) ? 1 : 0),
      0
    );
    return { track: track as CareerTrack, score };
  });

  trackScores.sort((a, b) => b.score - a.score);
  const primaryTrack =
    trackScores[0]?.score > 0 ? trackScores[0].track : "general";
  const secondaryTracks = trackScores
    .slice(1, 3)
    .filter((t) => t.score > 0)
    .map((t) => t.track);

  const yearsExperienceEstimate = estimateYears(lower);
  const roles = extractRoles(text);
  const emails = extractEmails(text);
  const signals = extractSignals(lower);

  return {
    version: 1,
    primaryTrack,
    secondaryTracks,
    yearsExperienceEstimate,
    detectedSkills,
    skillConfidence,
    roles,
    signals,
    emails,
  };
}

function estimateYears(lower: string): number | null {
  const patterns = [
    /(\d+)\+?\s*(?:years?|años?)\s*(?:of\s*)?(?:experience|exp)/i,
    /(?:experience|exp)[:\s]+(\d+)\+?\s*(?:years?|años?)/i,
    /(\d+)\+?\s*(?:years?|años?)\s+(?:in\s+)?(?:software|development|programming)/i,
  ];
  for (const p of patterns) {
    const m = lower.match(p);
    if (m?.[1]) return parseInt(m[1], 10);
  }
  return null;
}

function extractRoles(text: string): ParsedCvLocal["roles"] {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const roles: ParsedCvLocal["roles"] = [];
  const titlePattern =
    /^(senior |lead |junior |mid )?(developer|engineer|programmer|architect|consultant|analyst)/i;

  for (let i = 0; i < Math.min(lines.length, 40); i++) {
    const line = lines[i];
    if (titlePattern.test(line) && line.length < 80) {
      roles.push({ title: line });
      if (roles.length >= 5) break;
    }
  }
  return roles;
}

function extractEmails(text: string): string[] {
  const matches = text.match(/[\w.+-]+@[\w.-]+\.\w+/g);
  return [...new Set(matches ?? [])].slice(0, 3);
}

function extractSignals(lower: string): string[] {
  const signals: string[] = [];
  const checks = [
    ".yml",
    ".yaml",
    "docker-compose",
    "github actions",
    "pull request",
    "code review",
    "agile",
    "scrum",
    "jest",
    "cypress",
    "figma",
    "webpack",
    "vite",
    "redux",
    "graphql",
    "microservices",
  ];
  for (const c of checks) {
    if (lower.includes(c)) signals.push(c);
  }
  return signals;
}
