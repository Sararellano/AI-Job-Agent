import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchRemotiveJobs } from "@/services/job-search/connectors/remotive";

describe("fetchRemotiveJobs", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps Remotive API jobs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jobs: [
            {
              id: 1,
              url: "https://remotive.com/remote-jobs/software-dev-1",
              title: "Backend Engineer",
              company_name: "Acme",
              category: "Software Development",
              description: "<p>Python and AWS</p>",
              tags: ["python", "aws"],
              salary: "$90,000",
            },
          ],
        }),
      })
    );

    const jobs = await fetchRemotiveJobs(["python"], ["software-dev"]);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: "Backend Engineer",
      company: "Acme",
      source: "remotive",
    });
  });
});
