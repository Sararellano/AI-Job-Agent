import { describe, expect, it } from "vitest";
import { extractIndeedJobKey, indeedAdapter } from "./indeed";

describe("extractIndeedJobKey", () => {
  it("reads jk query param", () => {
    expect(
      extractIndeedJobKey("https://es.indeed.com/viewjob?jk=abc123def456")
    ).toBe("abc123def456");
  });
});

describe("indeedAdapter", () => {
  it("parses jobDescriptionText block", () => {
    const html = `
      <h1 class="jobsearch-JobInfoHeader-title">React Developer</h1>
      <div data-company-name="Startup Labs"></div>
      <div id="jobDescriptionText"><p>Ship UI features daily using React and TypeScript across multiple product teams in a fast-paced startup environment.</p></div>
    `;

    const draft = indeedAdapter.parse(html, "https://indeed.com/viewjob?jk=abc");
    expect(draft).toMatchObject({
      title: "React Developer",
      company: "Startup Labs",
      description: "Ship UI features daily using React and TypeScript across multiple product teams in a fast-paced startup environment.",
    });
  });

  it("matches indeed domains", () => {
    expect(indeedAdapter.matchesUrl("https://www.indeed.es/viewjob?jk=1")).toBe(
      true
    );
  });
});
