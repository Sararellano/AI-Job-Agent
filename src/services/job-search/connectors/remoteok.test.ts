import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchRemoteOkJobs } from "@/services/job-search/connectors/remoteok";

describe("fetchRemoteOkJobs", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps and filters RemoteOK postings", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {},
          {
            position: "Frontend Developer",
            company: "Acme",
            description: "<p>Build with React</p>",
            url: "https://remoteok.com/remote-jobs/123",
            tags: ["react", "typescript"],
            salary_min: 80000,
            salary_max: 110000,
            location: "Remote",
          },
          {
            position: "Backend Engineer",
            company: "Other",
            description: "Python APIs",
            url: "https://remoteok.com/remote-jobs/456",
            tags: ["python"],
          },
        ],
      })
    );

    const jobs = await fetchRemoteOkJobs(["react"]);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: "Frontend Developer",
      company: "Acme",
      source: "remoteok",
      url: "https://remoteok.com/remote-jobs/123",
      requirements: "react, typescript",
    });
    expect(jobs[0]?.salary).toContain("80,000");
  });
});
