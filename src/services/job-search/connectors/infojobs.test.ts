import { describe, expect, it, vi, afterEach } from "vitest";
import {
  fetchInfoJobsJobs,
  hasInfoJobsCredentials,
} from "@/services/job-search/connectors/infojobs";

describe("fetchInfoJobsJobs", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.INFOJOBS_CLIENT_ID;
    delete process.env.INFOJOBS_CLIENT_SECRET;
  });

  it("maps InfoJobs API offers", async () => {
    process.env.INFOJOBS_CLIENT_ID = "client";
    process.env.INFOJOBS_CLIENT_SECRET = "secret";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          offers: [
            {
              id: "1",
              title: "DevOps Engineer",
              link: "https://www.infojobs.net/oferta-devops",
              requirementMin: "Kubernetes, Terraform, CI/CD",
              author: { name: "CloudCo" },
              province: { value: "Madrid" },
              category: { value: "Informática y telecomunicaciones" },
            },
          ],
        }),
      })
    );

    const jobs = await fetchInfoJobsJobs(["devops"], ["madrid"]);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: "DevOps Engineer",
      company: "CloudCo",
      source: "infojobs",
      url: "https://www.infojobs.net/oferta-devops",
    });
  });

  it("detects missing credentials", () => {
    expect(hasInfoJobsCredentials()).toBe(false);
  });
});
