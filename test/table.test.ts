import { describe, expect, it } from "vitest";
import { resolveTable, tierFor } from "../src/index";

// Example thresholds for the tests only. Mutexa's own thresholds are set at launch.
const table = [
  { tier: "tier-2", min: "1000" },
  { tier: "tier-1", min: "100" },
  { tier: "tier-3", min: 5_000_000_000n }, // raw units: 5000 tokens at 6 decimals
];

describe("tier table", () => {
  it("resolves decimal strings and raw bigints and sorts by threshold", () => {
    expect(resolveTable(table, 6)).toEqual([
      { tier: "tier-1", minRaw: 100_000_000n },
      { tier: "tier-2", minRaw: 1_000_000_000n },
      { tier: "tier-3", minRaw: 5_000_000_000n },
    ]);
  });

  it("refuses empty, duplicate, negative and tied tables", () => {
    expect(() => resolveTable([], 18)).toThrow(/empty/);
    expect(() =>
      resolveTable(
        [
          { tier: "a", min: "1" },
          { tier: "a", min: "2" },
        ],
        18,
      ),
    ).toThrow(/twice/);
    expect(() => resolveTable([{ tier: "a", min: -1n }], 18)).toThrow(/negative/);
    expect(() =>
      resolveTable(
        [
          { tier: "a", min: "1" },
          { tier: "b", min: "1.0" },
        ],
        18,
      ),
    ).toThrow(/same threshold/);
    expect(() => resolveTable([{ tier: "", min: "1" }], 18)).toThrow(/name/);
  });

  it("maps balances to the highest tier reached, with the gap to the next", () => {
    expect(tierFor(0n, table, 6)).toEqual({
      tier: null,
      next: { tier: "tier-1", minRaw: 100_000_000n, missingRaw: 100_000_000n, missing: "100" },
    });
    expect(tierFor(100_000_000n, table, 6).tier).toBe("tier-1");
    expect(tierFor(999_999_999n, table, 6)).toEqual({
      tier: "tier-1",
      next: { tier: "tier-2", minRaw: 1_000_000_000n, missingRaw: 1n, missing: "0.000001" },
    });
    expect(tierFor(10n ** 30n, table, 6)).toEqual({ tier: "tier-3", next: null });
  });

  it("supports a first tier at zero", () => {
    expect(
      tierFor(
        0n,
        [
          { tier: "base", min: "0" },
          { tier: "plus", min: "1" },
        ],
        18,
      ).tier,
    ).toBe("base");
  });
});
