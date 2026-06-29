import { describe, expect, it } from "vitest";
import { extractLinkedInJobId, linkedInAdapter } from "./linkedin";

describe("extractLinkedInJobId", () => {
  it("extracts numeric id from slug urls", () => {
    expect(
      extractLinkedInJobId(
        "https://www.linkedin.com/jobs/view/senior-dev-at-acme-4123456789"
      )
    ).toBe("4123456789");
  });

  it("extracts id from plain view urls", () => {
    expect(
      extractLinkedInJobId("https://www.linkedin.com/jobs/view/4123456789")
    ).toBe("4123456789");
  });
});

describe("linkedInAdapter", () => {
  it("parses guest API JSON payloads", () => {
    const json = JSON.stringify({
      title: "Backend Engineer",
      companyDetails: { company: "TechFlow" },
      description: { text: "<p>Design APIs with Node.js</p>" },
      formattedLocation: "Remote",
    });

    const draft = linkedInAdapter.parse(json, "https://linkedin.com/jobs/view/1");
    expect(draft).toMatchObject({
      title: "Backend Engineer",
      company: "TechFlow",
      description: "Design APIs with Node.js",
    });
  });

  it("matches linkedin hostnames", () => {
    expect(
      linkedInAdapter.matchesUrl("https://es.linkedin.com/jobs/view/1")
    ).toBe(true);
    expect(linkedInAdapter.matchesUrl("https://jobs.lever.co/acme/1")).toBe(
      false
    );
  });
});
