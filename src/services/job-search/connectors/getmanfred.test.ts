import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchGetManfredJobs } from "@/services/job-search/connectors/getmanfred";

describe("fetchGetManfredJobs", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps GetManfred public API offers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("/8392?")) {
          return {
            ok: true,
            json: async () => ({
              id: 8392,
              position: "DevOps Engineer",
              slug: "acme-devops",
              salaryFrom: 50000,
              salaryTo: 70000,
              currency: "€",
              remotePercentage: 100,
              company: { name: "Acme" },
              introduction: "Lead infrastructure",
              responsibilities: ["Manage Kubernetes"],
              techStack: [{ name: "Kubernetes" }],
            }),
          };
        }

        return {
          ok: true,
          json: async () => [
            {
              id: 8392,
              position: "DevOps Engineer",
              slug: "acme-devops",
              salaryFrom: 50000,
              salaryTo: 70000,
              currency: "€",
              remotePercentage: 100,
              company: { name: "Acme" },
            },
          ],
        };
      })
    );

    const jobs = await fetchGetManfredJobs(["devops"]);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: "DevOps Engineer",
      company: "Acme",
      source: "getmanfred",
      url: "https://www.getmanfred.com/en/job-offers/acme-devops",
    });
  });
});
