import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchLeverJobs } from "@/services/job-search/connectors/lever";

describe("fetchLeverJobs", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps Lever API postings", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: "abc",
            text: "Product Designer",
            hostedUrl: "https://jobs.lever.co/acme/abc",
            descriptionPlain: "Design user experiences",
            categories: {
              team: "Design",
              location: "Berlin",
              commitment: "Full-time",
            },
          },
        ],
      })
    );

    const jobs = await fetchLeverJobs("acme");

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: "Product Designer",
      company: "acme",
      source: "lever",
      url: "https://jobs.lever.co/acme/abc",
      summary: "Design · Berlin · Full-time",
    });
  });
});
