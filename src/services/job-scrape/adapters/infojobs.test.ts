import { describe, expect, it } from "vitest";
import { infoJobsAdapter } from "./infojobs";

describe("infoJobsAdapter", () => {
  it("parses JSON-LD job postings", () => {
    const html = `
      <script type="application/ld+json">
      {
        "@type": "JobPosting",
        "title": "Desarrollador Frontend",
        "description": "Trabajarás con React y TypeScript en producto B2B.",
        "hiringOrganization": { "name": "Empresa Demo SL" }
      }
      </script>
    `;

    const draft = infoJobsAdapter.parse(
      html,
      "https://www.infojobs.net/oferta-empleo-1"
    );
    expect(draft).toMatchObject({
      title: "Desarrollador Frontend",
      company: "Empresa Demo SL",
    });
  });

  it("matches infojobs hostnames", () => {
    expect(
      infoJobsAdapter.matchesUrl("https://www.infojobs.net/oferta-empleo-1")
    ).toBe(true);
  });
});
