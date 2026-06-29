import { describe, expect, it } from "vitest";
import { extractJsonLdJobPosting } from "./extract-json-ld";

const SAMPLE_HTML = `
<html>
<head>
<script type="application/ld+json">
{
  "@type": "JobPosting",
  "title": "Senior Frontend Engineer",
  "description": "Build React apps with TypeScript.",
  "hiringOrganization": { "name": "Acme Corp" },
  "qualifications": "5+ years React"
}
</script>
</head>
<body></body>
</html>
`;

describe("extractJsonLdJobPosting", () => {
  it("extracts JobPosting schema fields", () => {
    const draft = extractJsonLdJobPosting(SAMPLE_HTML);
    expect(draft).toMatchObject({
      title: "Senior Frontend Engineer",
      company: "Acme Corp",
      description: "Build React apps with TypeScript.",
      requirements: "5+ years React",
    });
  });

  it("returns null when no job posting schema exists", () => {
    expect(extractJsonLdJobPosting("<html><body>Hello</body></html>")).toBeNull();
  });
});
