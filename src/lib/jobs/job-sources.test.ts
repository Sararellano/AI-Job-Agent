import { describe, expect, it } from "vitest";
import {
  collectJobSources,
  filterJobsBySources,
  normalizeJobSource,
} from "@/lib/jobs/job-sources";

describe("normalizeJobSource", () => {
  it("maps unknown values to other", () => {
    expect(normalizeJobSource(null)).toBe("other");
    expect(normalizeJobSource("unknown")).toBe("other");
    expect(normalizeJobSource("getmanfred")).toBe("getmanfred");
  });
});

describe("collectJobSources", () => {
  it("returns sources in stable order", () => {
    expect(
      collectJobSources([
        { source: "infojobs" },
        { source: "getmanfred" },
        { source: "weworkremotely" },
      ])
    ).toEqual(["weworkremotely", "getmanfred", "infojobs"]);
  });
});

describe("filterJobsBySources", () => {
  const jobs = [
    { id: "1", source: "getmanfred" },
    { id: "2", source: "infojobs" },
    { id: "3", source: "weworkremotely" },
  ];

  it("keeps only selected platforms", () => {
    const filtered = filterJobsBySources(
      jobs,
      new Set(["getmanfred", "infojobs"])
    );
    expect(filtered.map((job) => job.id)).toEqual(["1", "2"]);
  });

  it("returns empty list when nothing is selected", () => {
    expect(filterJobsBySources(jobs, new Set())).toEqual([]);
  });
});
