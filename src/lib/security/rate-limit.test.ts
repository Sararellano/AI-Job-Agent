import { afterEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimits } from "@/lib/security/rate-limit";

describe("checkRateLimit", () => {
  afterEach(() => {
    resetRateLimits();
  });

  it("allows requests within the limit", () => {
    const result = checkRateLimit("user-1", 2, 60_000);
    expect(result.allowed).toBe(true);
  });

  it("blocks requests over the limit", () => {
    checkRateLimit("user-2", 1, 60_000);
    const blocked = checkRateLimit("user-2", 1, 60_000);

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});
