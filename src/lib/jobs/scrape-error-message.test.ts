import { describe, expect, it } from "vitest";
import { translate } from "@/lib/i18n";
import { resolveScrapeErrorMessage } from "./scrape-error-message";

describe("resolveScrapeErrorMessage", () => {
  const t = (key: Parameters<typeof translate>[1]) => translate("es", key);

  it("returns board-specific blocked message for linkedin", () => {
    const message = resolveScrapeErrorMessage(t, {
      code: "FETCH_BLOCKED",
      board: "linkedin",
    });
    expect(message).toContain("LinkedIn");
  });

  it("returns board-specific blocked message for glassdoor", () => {
    const message = resolveScrapeErrorMessage(t, {
      code: "FETCH_BLOCKED",
      board: "glassdoor",
    });
    expect(message).toContain("Glassdoor");
  });

  it("falls back to generic parse failure", () => {
    const message = resolveScrapeErrorMessage(t, {
      code: "PARSE_FAILED",
    });
    expect(message).toContain("descripción");
  });
});
