import { describe, expect, it } from "vitest";
import { parseEnvList, getJobSyncConfig } from "@/services/job-search/config";

describe("parseEnvList", () => {
  it("splits comma-separated values", () => {
    expect(parseEnvList("stripe, airbnb , lever")).toEqual([
      "stripe",
      "airbnb",
      "lever",
    ]);
  });

  it("returns empty array for missing values", () => {
    expect(parseEnvList(undefined)).toEqual([]);
    expect(parseEnvList("  ,  ")).toEqual([]);
  });
});

describe("getJobSyncConfig", () => {
  it("reads connector settings from environment", () => {
    process.env.GREENHOUSE_BOARD_TOKENS = "stripe,airbnb";
    process.env.LEVER_COMPANIES = "netflix";
    process.env.REMOTEOK_ENABLED = "true";
    process.env.JOB_SYNC_KEYWORDS = "react,typescript";

    expect(getJobSyncConfig()).toEqual({
      greenhouseBoards: ["stripe", "airbnb"],
      leverCompanies: ["netflix"],
      remoteOkEnabled: true,
      remotiveEnabled: true,
      remotiveCategories: expect.arrayContaining(["software-dev"]),
      wwrEnabled: true,
      wwrCategories: expect.arrayContaining(["remote-programming-jobs"]),
      remoteCoEnabled: true,
      getManfredEnabled: true,
      wellfoundEnabled: true,
      wellfoundRoleSlugs: expect.arrayContaining([
        "frontend-engineer",
        "product-manager",
        "devops-engineer",
      ]),
      infoJobsEnabled: true,
      infoJobsProvince: null,
      keywords: ["react", "typescript"],
    });
  });
});
