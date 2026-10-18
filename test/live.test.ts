// Live check against Robinhood Chain. Skipped unless LIVE=1 (pnpm test:live). Never runs in CI.
//   LIVE=1 RHC_RPC=https://robinhood-rpc.publicnode.com pnpm test:live
import { describe, expect, it } from "vitest";
import { holderTier, readSymbol } from "../src/index";

// USDG on Robinhood Chain, 6 decimals: a known ERC-20 used only to exercise the reader.
const USDG = "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168";
const rpcUrl = process.env.RHC_RPC ?? "https://robinhood-rpc.publicnode.com";

describe.skipIf(!process.env.LIVE)("live Robinhood Chain read", () => {
  it("reads USDG decimals and a balance, and maps it", async () => {
    // the token contract's own balance of itself: any address works, this one needs no assumption
    const r = await holderTier({ rpcUrl, token: USDG, holder: USDG, table: [{ tier: "any", min: "0" }] });
    expect(r.chainId).toBe(4663);
    expect(r.decimals).toBe(6);
    expect(r.raw).toBeGreaterThanOrEqual(0n);
    expect(r.tier).toBe("any");
    expect(await readSymbol({ rpcUrl, token: USDG })).toBe("USDG");
  }, 30_000);
});
