// The README quick start is copied from this file. Keep them in sync.
import { expect, it } from "vitest";
import { holderTier } from "../src/index";
import { mockToken } from "./mock";

it("README quick start", async () => {
  const token = "0x00000000000000000000000000000000000000aa"; // the $MUTEX contract, announced at launch
  const holder = "0x00000000000000000000000000000000000000bb";
  const { transport } = mockToken({ token, decimals: 18, symbol: "TKN", balances: { [holder]: 2_500n * 10n ** 18n } });

  const r = await holderTier({
    transport, // in production: rpcUrl: "https://robinhood-rpc.publicnode.com"
    token,
    holder,
    // your thresholds, in whole tokens; these are example values
    table: [
      { tier: "tier-1", min: "100" },
      { tier: "tier-2", min: "1000" },
      { tier: "tier-3", min: "10000" },
    ],
  });
  // r.tier "tier-2", r.formatted "2500", r.next { tier: "tier-3", missing: "7500", ... }, r.blockNumber 1234n

  expect(r.tier).toBe("tier-2");
  expect(r.formatted).toBe("2500");
  expect(r.next?.missing).toBe("7500");
});
