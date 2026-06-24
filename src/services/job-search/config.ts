/**
 * Parses comma-separated environment variable lists.
 */
export function parseEnvList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export interface JobSyncConfig {
  greenhouseBoards: string[];
  leverCompanies: string[];
  remoteOkEnabled: boolean;
  wellfoundEnabled: boolean;
  wellfoundRoleSlugs: string[];
  infoJobsEnabled: boolean;
  infoJobsProvince: string | null;
  keywords: string[];
}

const DEFAULT_WELLFOUND_ROLE_SLUGS = [
  "frontend-engineer",
  "backend-engineer",
  "full-stack-developer",
  "software-engineer",
  "devops-engineer",
  "site-reliability-engineer",
  "platform-engineer",
  "cloud-engineer",
  "data-engineer",
  "data-scientist",
  "machine-learning-engineer",
  "ai-engineer",
  "product-manager",
  "technical-product-manager",
  "product-designer",
  "ios-developer",
  "android-developer",
  "mobile-developer",
  "qa-engineer",
  "security-engineer",
  "engineering-manager",
  "tech-lead",
];

/**
 * Reads connector configuration from environment variables.
 */
export function getJobSyncConfig(): JobSyncConfig {
  const wellfoundRoleSlugs = parseEnvList(process.env.WELLFOUND_ROLE_SLUGS);

  return {
    greenhouseBoards: parseEnvList(process.env.GREENHOUSE_BOARD_TOKENS),
    leverCompanies: parseEnvList(process.env.LEVER_COMPANIES),
    remoteOkEnabled: process.env.REMOTEOK_ENABLED !== "false",
    wellfoundEnabled: process.env.WELLFOUND_ENABLED !== "false",
    wellfoundRoleSlugs:
      wellfoundRoleSlugs.length > 0
        ? wellfoundRoleSlugs
        : DEFAULT_WELLFOUND_ROLE_SLUGS,
    infoJobsEnabled: process.env.INFOJOBS_ENABLED !== "false",
    infoJobsProvince: process.env.INFOJOBS_PROVINCE?.trim() || null,
    keywords: parseEnvList(process.env.JOB_SYNC_KEYWORDS),
  };
}
