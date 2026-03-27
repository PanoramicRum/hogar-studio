import { describe, it, expect } from "vitest";
import { rateLimit } from "../rate-limit";

describe("rateLimit", () => {
  it("allows requests within limit", () => {
    const result = rateLimit("test-ip-1", 3, 60000, "test1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("blocks after exceeding limit", () => {
    const ip = "test-ip-block-" + Date.now();
    rateLimit(ip, 2, 60000, "test2");
    rateLimit(ip, 2, 60000, "test2");
    const result = rateLimit(ip, 2, 60000, "test2");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("tracks different IPs independently", () => {
    const prefix = "test3-" + Date.now();
    rateLimit("ip-a-" + prefix, 1, 60000, prefix);
    rateLimit("ip-a-" + prefix, 1, 60000, prefix);
    const resultA = rateLimit("ip-a-" + prefix, 1, 60000, prefix);
    const resultB = rateLimit("ip-b-" + prefix, 1, 60000, prefix);
    expect(resultA.allowed).toBe(false); // ip-a exhausted
    expect(resultB.allowed).toBe(true);  // ip-b is fresh
  });
});
