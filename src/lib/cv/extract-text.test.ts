import { describe, expect, it } from "vitest";
import { truncateCvText } from "@/lib/cv/extract-text";

describe("truncateCvText", () => {
  it("normalizes whitespace and trims text", () => {
    expect(truncateCvText("  hello   world  \n\n  foo  ")).toBe("hello world foo");
  });

  it("returns short text unchanged after cleaning", () => {
    const text = "Short CV content";
    expect(truncateCvText(text)).toBe(text);
  });

  it("truncates text longer than 12000 characters", () => {
    const longText = "a".repeat(15000);
    const result = truncateCvText(longText);

    expect(result).toHaveLength(12000);
    expect(result).toBe("a".repeat(12000));
  });
});
