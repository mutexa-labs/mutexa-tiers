import { describe, expect, it } from "vitest";
import { holderTier, readBalance, readSymbol, robinhoodChain, ROBINHOOD_CHAIN_ID } from "../src/index";
import { mockToken } from "./mock";

const token = "0x00000000000000000000000000000000000000aa" as const;
const holder = "0x00000000000000000000000000000000000000bb";

describe("readBalance / holderTier with a mocked RPC", () => {
  it("reads balance and decimals at one block", async () => {
    const m = mockToken({ token, decimals: 18, symbol: "TKN", balances: { [holder]: 2_500n * 10n ** 18n } });
    const b = await readBalance({ transport: m.transport, token, holder });
    expect(b).toMatchObject({
      chainId: 4663,
      raw: 2_500n * 10n ** 18n,
      decimals: 18,
      formatted: "2500",
      blockNumber: 1234n,
    });
    expect(m.calls.every((c) => c.block === "0x4d2")).toBe(true);
  });

  it("maps the balance to the caller's tier", async () => {
    const m = mockToken({ token, decimals: 18, symbol: "TKN", balances: { [holder]: 2_500n * 10n ** 18n } });
    const r = await holderTier({
      transport: m.transport,
      token,
      holder,
      table: [
        { tier: "tier-1", min: "100" },
        { tier: "tier-2", min: "1000" },
        { tier: "tier-3", min: "10000" },
      ],
    });
    expect(r.tier).toBe("tier-2");
    expect(r.next).toMatchObject({ tier: "tier-3", missing: "7500" });
  });

  it("uses given decimals without reading them, and reads at a given block", async () => {
    const m = mockToken({ token, decimals: 6, symbol: "TKN", balances: {} });
    const b = await readBalance({ transport: m.transport, token, holder, decimals: 6, blockNumber: 99n });
    expect(b.raw).toBe(0n);
    expect(m.calls).toHaveLength(1);
    expect(m.calls[0]!.block).toBe("0x63");
  });

  it("refuses an RPC on another chain", async () => {
    const m = mockToken({ chainId: 1, token, decimals: 18, symbol: "TKN", balances: {} });
    await expect(readBalance({ transport: m.transport, token, holder })).rejects.toThrow(/chain 1, expected 4663/);
  });

  it("rejects malformed addresses", async () => {
    const m = mockToken({ token, decimals: 18, symbol: "TKN", balances: {} });
    await expect(readBalance({ transport: m.transport, token: "0x123", holder })).rejects.toThrow();
  });

  it("reads the symbol and defines the chain without a built-in RPC", async () => {
    const m = mockToken({ token, decimals: 18, symbol: "TKN", balances: {} });
    expect(await readSymbol({ transport: m.transport, token })).toBe("TKN");
    const chain = robinhoodChain("https://rpc.example");
    expect(chain.id).toBe(ROBINHOOD_CHAIN_ID);
    expect(chain.rpcUrls.default.http).toEqual(["https://rpc.example"]);
  });
});
