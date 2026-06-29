import { describe, expect, it } from "vitest";
import { glassdoorAdapter } from "./glassdoor";
import { remoteCoAdapter } from "./remoteco";
import { tecnoempleoAdapter } from "./tecnoempleo";

const LONG_DESCRIPTION =
  "Desarrollarás aplicaciones web con React y TypeScript en un entorno ágil con equipo distribuido y buenas prácticas de calidad.";

describe("tecnoempleoAdapter", () => {
  it("parses JSON-LD job postings", () => {
    const html = `
      <script type="application/ld+json">
      {
        "@type": "JobPosting",
        "title": "Desarrollador Full Stack",
        "description": "${LONG_DESCRIPTION}",
        "hiringOrganization": { "name": "Consultora Tech" }
      }
      </script>
    `;

    const draft = tecnoempleoAdapter.parse(
      html,
      "https://www.tecnoempleo.com/oferta-empleo-1"
    );
    expect(draft).toMatchObject({
      title: "Desarrollador Full Stack",
      company: "Consultora Tech",
    });
  });

  it("matches tecnoempleo hostnames", () => {
    expect(
      tecnoempleoAdapter.matchesUrl("https://www.tecnoempleo.com/oferta-1")
    ).toBe(true);
  });
});

describe("glassdoorAdapter", () => {
  it("parses jobDescriptionContent block", () => {
    const html = `
      <h1 data-test="job-title">Senior React Engineer</h1>
      <div data-test="employer-name">Cloud Systems</div>
      <div class="jobDescriptionContent"><p>${LONG_DESCRIPTION}</p></div>
    `;

    const draft = glassdoorAdapter.parse(
      html,
      "https://www.glassdoor.com/job-listing/react-1"
    );
    expect(draft).toMatchObject({
      title: "Senior React Engineer",
      company: "Cloud Systems",
    });
  });

  it("matches glassdoor domains", () => {
    expect(
      glassdoorAdapter.matchesUrl("https://www.glassdoor.es/job-listing/1")
    ).toBe(true);
  });
});

describe("remoteCoAdapter", () => {
  it("parses entry-content job pages", () => {
    const html = `
      <h1 class="entry-title">Remote Frontend Developer</h1>
      <div class="company-name">Distributed Labs</div>
      <div class="entry-content"><p>${LONG_DESCRIPTION}</p></div>
    `;

    const draft = remoteCoAdapter.parse(
      html,
      "https://remote.co/remote-jobs/developer/1"
    );
    expect(draft).toMatchObject({
      title: "Remote Frontend Developer",
      company: "Distributed Labs",
    });
  });

  it("matches remote.co hostnames", () => {
    expect(
      remoteCoAdapter.matchesUrl("https://remote.co/remote-jobs/developer/1")
    ).toBe(true);
  });
});
