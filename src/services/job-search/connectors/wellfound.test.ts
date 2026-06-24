import { describe, expect, it } from "vitest";
import { parseWellfoundHtml } from "@/services/job-search/connectors/wellfound";

const FIXTURE = `
<html>
  <script id="__NEXT_DATA__" type="application/json">
    {
      "props": {
        "pageProps": {
          "jobs": [
            {
              "title": "Senior Product Manager",
              "slug": "acme-senior-product-manager",
              "url": "https://wellfound.com/jobs/acme-senior-product-manager",
              "companyName": "Acme",
              "description": "<p>Own the roadmap</p>",
              "remote": true,
              "locationNames": ["Remote"]
            }
          ]
        }
      }
    }
  </script>
</html>
`;

describe("parseWellfoundHtml", () => {
  it("extracts jobs from __NEXT_DATA__ payloads", () => {
    const jobs = parseWellfoundHtml(FIXTURE);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.title).toBe("Senior Product Manager");
    expect(jobs[0]?.companyName).toBe("Acme");
  });
});
