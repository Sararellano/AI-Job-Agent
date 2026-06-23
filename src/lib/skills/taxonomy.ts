import type { CareerTrack, DiscoveryQuestion } from "@/types/skills";

export interface SkillTaxonomyEntry {
  displayName: string;
  tracks: CareerTrack[];
  signals: string[];
  questions: {
    id: string;
    text: string;
    impliesOnYes: string[];
    impliesOnSomewhat?: string[];
  }[];
}

export const SKILL_TAXONOMY: Record<string, SkillTaxonomyEntry> = {
  yaml: {
    displayName: "YAML",
    tracks: ["devops", "backend", "fullstack"],
    signals: [".yml", ".yaml", "docker-compose", "kubernetes", "ci/cd"],
    questions: [
      {
        id: "q-yaml-files",
        text: "Have you edited .yml or .yaml config files (Docker, CI, K8s)?",
        impliesOnYes: ["YAML"],
        impliesOnSomewhat: ["YAML"],
      },
    ],
  },
  docker: {
    displayName: "Docker",
    tracks: ["devops", "backend", "fullstack"],
    signals: ["docker", "docker-compose", "container"],
    questions: [
      {
        id: "q-docker-run",
        text: "Have you built or run apps with Docker or docker-compose?",
        impliesOnYes: ["Docker", "Docker Compose"],
        impliesOnSomewhat: ["Docker"],
      },
    ],
  },
  react: {
    displayName: "React",
    tracks: ["frontend", "fullstack"],
    signals: ["react", "jsx", "tsx", "hooks"],
    questions: [
      {
        id: "q-react-components",
        text: "Have you built React components (even small projects or internal tools)?",
        impliesOnYes: ["React"],
        impliesOnSomewhat: ["React"],
      },
      {
        id: "q-react-hooks",
        text: "Have you used useState, useEffect or other React hooks?",
        impliesOnYes: ["React", "React Hooks"],
        impliesOnSomewhat: ["React"],
      },
    ],
  },
  javascript: {
    displayName: "JavaScript",
    tracks: ["frontend", "backend", "fullstack"],
    signals: ["javascript", "js", "es6", "vanilla"],
    questions: [
      {
        id: "q-js-vanilla",
        text: "Have you shipped features using vanilla JavaScript (without a framework)?",
        impliesOnYes: ["JavaScript", "Vanilla JS"],
        impliesOnSomewhat: ["JavaScript"],
      },
    ],
  },
  typescript: {
    displayName: "TypeScript",
    tracks: ["frontend", "backend", "fullstack"],
    signals: ["typescript", "ts", "tsx"],
    questions: [
      {
        id: "q-ts-types",
        text: "Have you written TypeScript with interfaces or typed functions?",
        impliesOnYes: ["TypeScript"],
        impliesOnSomewhat: ["TypeScript"],
      },
    ],
  },
  cicd: {
    displayName: "CI/CD",
    tracks: ["devops", "backend", "fullstack"],
    signals: ["ci/cd", "github actions", "jenkins", "pipeline"],
    questions: [
      {
        id: "q-github-actions",
        text: "Have you set up or maintained GitHub Actions (or similar CI pipelines)?",
        impliesOnYes: ["CI/CD", "GitHub Actions"],
        impliesOnSomewhat: ["CI/CD"],
      },
    ],
  },
  testing: {
    displayName: "Testing",
    tracks: ["frontend", "backend", "fullstack"],
    signals: ["jest", "cypress", "testing", "unit test"],
    questions: [
      {
        id: "q-jest",
        text: "Have you written unit tests (Jest, Vitest or similar)?",
        impliesOnYes: ["Jest", "Unit Testing"],
        impliesOnSomewhat: ["Unit Testing"],
      },
    ],
  },
  aws: {
    displayName: "AWS",
    tracks: ["devops", "backend", "fullstack"],
    signals: ["aws", "s3", "lambda", "ec2"],
    questions: [
      {
        id: "q-aws-deploy",
        text: "Have you deployed or maintained something on AWS (S3, Lambda, EC2…)?",
        impliesOnYes: ["AWS"],
        impliesOnSomewhat: ["AWS"],
      },
    ],
  },
  graphql: {
    displayName: "GraphQL",
    tracks: ["frontend", "backend", "fullstack"],
    signals: ["graphql"],
    questions: [
      {
        id: "q-graphql",
        text: "Have you consumed or built GraphQL APIs?",
        impliesOnYes: ["GraphQL"],
        impliesOnSomewhat: ["GraphQL"],
      },
    ],
  },
  nextjs: {
    displayName: "Next.js",
    tracks: ["frontend", "fullstack"],
    signals: ["next.js", "nextjs"],
    questions: [
      {
        id: "q-nextjs",
        text: "Have you worked with Next.js (pages or app router)?",
        impliesOnYes: ["Next.js"],
        impliesOnSomewhat: ["Next.js"],
      },
    ],
  },
};

export const IMPOSTER_QUESTIONS: DiscoveryQuestion[] = [
  {
    id: "imposter-js-transfer",
    text: "Many '2 years React' jobs accept strong JavaScript — your years in JS count as transferable experience.",
    category: "imposter",
    skillKeys: [],
    impliesOnYes: [],
    impliesOnSomewhat: [],
    priority: 100,
  },
  {
    id: "merit-code-review",
    text: "Have you done code reviews for teammates?",
    category: "merit",
    skillKeys: ["leadership"],
    impliesOnYes: ["Code Review", "Collaboration"],
    impliesOnSomewhat: ["Collaboration"],
    priority: 90,
  },
  {
    id: "merit-prod-deploy",
    text: "Have you deployed your own code to production?",
    category: "merit",
    skillKeys: ["ownership"],
    impliesOnYes: ["Production Deployment", "Ownership"],
    impliesOnSomewhat: ["Production Deployment"],
    priority: 88,
  },
  {
    id: "merit-prod-bug",
    text: "Have you fixed a critical bug in production under pressure?",
    category: "merit",
    skillKeys: ["resilience"],
    impliesOnYes: ["Incident Response", "Debugging"],
    impliesOnSomewhat: ["Debugging"],
    priority: 85,
  },
  {
    id: "merit-docs",
    text: "Have you written technical docs or runbooks for your team?",
    category: "merit",
    skillKeys: ["communication"],
    impliesOnYes: ["Technical Writing", "Documentation"],
    impliesOnSomewhat: ["Documentation"],
    priority: 82,
  },
  {
    id: "merit-mentor",
    text: "Have you helped onboard or mentor a junior developer?",
    category: "merit",
    skillKeys: ["mentoring"],
    impliesOnYes: ["Mentoring", "Leadership"],
    impliesOnSomewhat: ["Mentoring"],
    priority: 80,
  },
  {
    id: "merit-legacy",
    text: "Have you migrated or improved legacy code (jQuery, old PHP, etc.)?",
    category: "merit",
    skillKeys: ["modernization"],
    impliesOnYes: ["Legacy Modernization", "Refactoring"],
    impliesOnSomewhat: ["Refactoring"],
    priority: 78,
  },
  {
    id: "merit-rest-api",
    text: "Have you integrated with REST APIs from the frontend or backend?",
    category: "merit",
    skillKeys: ["api"],
    impliesOnYes: ["REST APIs", "API Integration"],
    impliesOnSomewhat: ["API Integration"],
    priority: 75,
  },
];

export const TRACK_SKILL_KEYS: Record<CareerTrack, string[]> = {
  frontend: ["react", "javascript", "typescript", "nextjs", "testing"],
  backend: ["javascript", "typescript", "docker", "graphql", "aws"],
  fullstack: ["react", "javascript", "typescript", "nextjs", "docker", "graphql"],
  devops: ["docker", "yaml", "cicd", "aws", "kubernetes"],
  mobile: ["javascript", "typescript", "react"],
  data: ["python", "sql"],
  general: ["javascript", "react", "docker", "testing"],
};

// kubernetes entry referenced in TRACK - add it
SKILL_TAXONOMY.kubernetes = {
  displayName: "Kubernetes",
  tracks: ["devops"],
  signals: ["kubernetes", "k8s", "helm"],
  questions: [
    {
      id: "q-k8s",
      text: "Have you worked with Kubernetes clusters or manifests?",
      impliesOnYes: ["Kubernetes"],
      impliesOnSomewhat: ["Kubernetes"],
    },
  ],
};

SKILL_TAXONOMY.python = {
  displayName: "Python",
  tracks: ["data", "backend"],
  signals: ["python", "pandas", "django"],
  questions: [
    {
      id: "q-python",
      text: "Have you written Python scripts or services for work?",
      impliesOnYes: ["Python"],
      impliesOnSomewhat: ["Python"],
    },
  ],
};

SKILL_TAXONOMY.sql = {
  displayName: "SQL",
  tracks: ["data", "backend"],
  signals: ["sql", "postgresql", "mysql"],
  questions: [
    {
      id: "q-sql",
      text: "Have you written SQL queries beyond basic SELECT?",
      impliesOnYes: ["SQL"],
      impliesOnSomewhat: ["SQL"],
    },
  ],
};

TRACK_SKILL_KEYS.devops = ["docker", "yaml", "cicd", "aws", "kubernetes"];
TRACK_SKILL_KEYS.data = ["python", "sql", "aws"];
