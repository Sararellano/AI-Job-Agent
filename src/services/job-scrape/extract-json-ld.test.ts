import { describe, expect, it } from "vitest";
import { extractJobPostingFromHtml } from "./extract-json-ld";

const HTML_WITH_JOB_POSTING = `
<!doctype html>
<html>
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": "Senior Frontend Engineer",
    "description": "<p>We are looking for a Senior Frontend Engineer who loves React and TypeScript to build delightful UIs and ship to millions of users.</p>",
    "hiringOrganization": { "@type": "Organization", "name": "Acme Corp" },
    "qualifications": "5+ years React, TypeScript, accessibility",
    "baseSalary": {
      "@type": "MonetaryAmount",
      "currency": "EUR",
      "value": { "@type": "QuantitativeValue", "minValue": 50000, "maxValue": 70000, "unitText": "YEAR" }
    }
  }
  </script>
</head>
<body>page</body>
</html>`;

const HTML_WITH_GRAPH = `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "name": "Other" },
    {
      "@type": "JobPosting",
      "title": "Backend Engineer",
      "description": "Build distributed services in Go and Rust for high-traffic platforms across multiple regions.",
      "hiringOrganization": "Inline Co"
    }
  ]
}
</script>`;

describe("extractJobPostingFromHtml", () => {
  it("parses a standard JobPosting block", () => {
    const draft = extractJobPostingFromHtml(HTML_WITH_JOB_POSTING);
    expect(draft).not.toBeNull();
    expect(draft!.title).toBe("Senior Frontend Engineer");
    expect(draft!.company).toBe("Acme Corp");
    expect(draft!.description).toContain("Senior Frontend Engineer");
    expect(draft!.requirements).toContain("5+ years React");
    expect(draft!.salary).toBe("50000-70000 EUR YEAR");
  });

  it("finds JobPosting inside @graph arrays", () => {
    const draft = extractJobPostingFromHtml(HTML_WITH_GRAPH);
    expect(draft).not.toBeNull();
    expect(draft!.title).toBe("Backend Engineer");
    expect(draft!.company).toBe("Inline Co");
  });

  it("returns null when no JobPosting is present", () => {
    expect(extractJobPostingFromHtml("<html><body>no data</body></html>")).toBeNull();
  });

  it("returns null when description is too short to be useful", () => {
    const html = `<script type="application/ld+json">
      {"@type":"JobPosting","title":"X","description":"short"}
    </script>`;
    expect(extractJobPostingFromHtml(html)).toBeNull();
  });
});
