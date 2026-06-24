import { describe, expect, it } from "vitest";
import { parseRss, splitCompanyAndTitle } from "@/services/job-search/rss";

const RSS_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Acme Corp: Backend Engineer</title>
      <link>https://example.com/jobs/1</link>
      <description><![CDATA[<p>Build APIs with Node.js</p>]]></description>
      <category>Programming</category>
    </item>
  </channel>
</rss>`;

describe("parseRss", () => {
  it("parses RSS items", () => {
    const items = parseRss(RSS_FIXTURE);
    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe("Acme Corp: Backend Engineer");
    expect(items[0]?.description).toContain("Build APIs");
  });
});

describe("splitCompanyAndTitle", () => {
  it("splits company and role from WWR titles", () => {
    expect(splitCompanyAndTitle("Acme: Senior DevOps Engineer")).toEqual({
      company: "Acme",
      role: "Senior DevOps Engineer",
    });
  });
});
