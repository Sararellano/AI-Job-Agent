import { describe, expect, it } from "vitest";
import { buildAtsApiUrl } from "./ats-api";

describe("buildAtsApiUrl", () => {
  it("maps Greenhouse posting URL to public board API", () => {
    expect(
      buildAtsApiUrl("https://boards.greenhouse.io/acme/jobs/123456")
    ).toBe(
      "https://boards-api.greenhouse.io/v1/boards/acme/jobs/123456?questions=false"
    );
  });

  it("maps Lever posting URL with UUID slug", () => {
    expect(
      buildAtsApiUrl(
        "https://jobs.lever.co/acme/12345678-1234-1234-1234-1234567890ab"
      )
    ).toBe(
      "https://api.lever.co/v0/postings/acme/12345678-1234-1234-1234-1234567890ab?mode=json"
    );
  });

  it("returns null for unsupported hosts", () => {
    expect(buildAtsApiUrl("https://www.linkedin.com/jobs/view/1")).toBeNull();
    expect(buildAtsApiUrl("https://example.com/foo")).toBeNull();
  });

  it("returns null for malformed URLs", () => {
    expect(buildAtsApiUrl("not-a-url")).toBeNull();
  });
});
