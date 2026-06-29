import { describe, expect, it } from "vitest";
import {
  detectJobPageBlock,
  extractJobDraftFromHtml,
} from "./extract-job-fallback";

describe("extractJobDraftFromHtml", () => {
  it("extracts structured job data from JSON-LD", () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "JobPosting",
              "title": "Senior Frontend Engineer",
              "description": "<p>Build accessible React interfaces for a global product team.</p>",
              "hiringOrganization": { "name": "Acme Labs" },
              "qualifications": "5+ years with React and TypeScript",
              "baseSalary": {
                "@type": "MonetaryAmount",
                "currency": "EUR",
                "value": {
                  "@type": "QuantitativeValue",
                  "minValue": 60000,
                  "maxValue": 75000,
                  "unitText": "YEAR"
                }
              }
            }
          </script>
        </head>
        <body></body>
      </html>
    `;

    const draft = extractJobDraftFromHtml(html, "https://boards.greenhouse.io/acme/jobs/123");

    expect(draft).toMatchObject({
      title: "Senior Frontend Engineer",
      company: "Acme Labs",
      salary: "60000 - 75000 EUR YEAR",
    });
    expect(draft?.description).toContain("accessible React interfaces");
    expect(draft?.requirements).toContain("React and TypeScript");
    expect(draft?.summary.length).toBeGreaterThan(20);
  });

  it("falls back to meta tags and visible page text", () => {
    const html = `
      <html>
        <head>
          <title>Frontend Engineer at Nova Corp | Careers</title>
          <meta property="og:title" content="Frontend Engineer at Nova Corp" />
          <meta
            name="description"
            content="Join Nova Corp to build performant product experiences with React, TypeScript, and design systems."
          />
        </head>
        <body>
          <main>
            <h1>Frontend Engineer</h1>
            <p>We are looking for someone to ship reusable UI components and collaborate closely with design.</p>
            <p>You will improve Core Web Vitals and maintain accessibility standards across the app.</p>
          </main>
        </body>
      </html>
    `;

    const draft = extractJobDraftFromHtml(html, "https://jobs.novacorp.com/frontend-engineer");

    expect(draft).toMatchObject({
      title: "Frontend Engineer",
      company: "Nova Corp",
    });
    expect(draft?.description).toContain("Join Nova Corp");
    expect(draft?.summary.length).toBeGreaterThan(20);
  });
});

describe("detectJobPageBlock", () => {
  it("detects login walls on blocked pages", () => {
    const html = `
      <html>
        <body>
          <h1>Join LinkedIn</h1>
          <p>Sign in to continue and view this job.</p>
        </body>
      </html>
    `;

    expect(detectJobPageBlock(html)).toBe("login_wall");
  });
});
