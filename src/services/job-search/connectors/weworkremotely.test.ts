import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchWeWorkRemotelyJobs } from "@/services/job-search/connectors/weworkremotely";

const RSS = `<?xml version="1.0"?><rss><channel><item><title>Acme: React Dev</title><link>https://weworkremotely.com/jobs/1</link><description><![CDATA[React role]]></description></item></channel></rss>`;

describe("fetchWeWorkRemotelyJobs", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps WWR RSS jobs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => RSS,
      })
    );

    const jobs = await fetchWeWorkRemotelyJobs(["react"], ["remote-programming-jobs"]);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: "React Dev",
      company: "Acme",
      source: "weworkremotely",
    });
  });
});
