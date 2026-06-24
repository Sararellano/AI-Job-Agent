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
  keywords: string[];
}

/**
 * Reads connector configuration from environment variables.
 */
export function getJobSyncConfig(): JobSyncConfig {
  return {
    greenhouseBoards: parseEnvList(process.env.GREENHOUSE_BOARD_TOKENS),
    leverCompanies: parseEnvList(process.env.LEVER_COMPANIES),
    remoteOkEnabled: process.env.REMOTEOK_ENABLED !== "false",
    keywords: parseEnvList(process.env.JOB_SYNC_KEYWORDS),
  };
}
