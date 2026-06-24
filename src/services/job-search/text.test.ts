import { describe, expect, it } from "vitest";
import {
  formatSalaryRange,
  matchesKeywords,
  stripHtml,
} from "@/services/job-search/text";

describe("stripHtml", () => {
  it("removes tags and entities", () => {
    expect(stripHtml("<p>Hello <strong>world</strong>&nbsp;!</p>")).toBe(
      "Hello world !"
    );
  });
});

describe("matchesKeywords", () => {
  it("matches when any keyword is present", () => {
    expect(matchesKeywords("Senior React Developer", ["vue", "react"])).toBe(
      true
    );
    expect(matchesKeywords("Senior Vue Developer", ["react"])).toBe(false);
  });

  it("matches everything when keywords are empty", () => {
    expect(matchesKeywords("Any role", [])).toBe(true);
  });
});

describe("formatSalaryRange", () => {
  it("formats min/max salaries", () => {
    expect(formatSalaryRange(80000, 120000)).toBe("$80,000 – $120,000");
    expect(formatSalaryRange(90000, null)).toBe("$90,000+");
  });

  it("returns null when no salary data", () => {
    expect(formatSalaryRange(null, null)).toBeNull();
  });
});
