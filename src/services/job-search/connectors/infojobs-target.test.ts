import { describe, expect, it } from "vitest";
import {
  formatInfoJobsSyncTarget,
} from "@/services/job-search/connectors/infojobs";

describe("formatInfoJobsSyncTarget", () => {
  it("returns espana when no provinces are configured", () => {
    expect(formatInfoJobsSyncTarget([])).toBe("espana");
  });

  it("joins configured provinces", () => {
    expect(formatInfoJobsSyncTarget(["madrid", "sevilla"])).toBe("madrid,sevilla");
  });
});
