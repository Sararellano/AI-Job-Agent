import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchGreenhouseJobs } from "@/services/job-search/connectors/greenhouse";

describe("fetchGreenhouseJobs", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps Greenhouse API jobs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jobs: [
            {
              id: 1,
              title: "Software Engineer",
              absolute_url: "https://boards.greenhouse.io/acme/jobs/1",
              content: "<p>Build products</p>",
              location: { name: "Remote" },
              departments: [{ name: "Engineering" }],
            },
          ],
        }),
      })
    );

    const jobs = await fetchGreenhouseJobs("acme");

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: "Software Engineer",
      company: "acme",
      source: "greenhouse",
      url: "https://boards.greenhouse.io/acme/jobs/1",
      summary: "Engineering · Remote",
    });
  });
});
