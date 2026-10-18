# @mutexa/tiers

Read a holder's $MUTEX balance on **Robinhood Chain** (chain id 4663) with viem and map it to a tier from a
threshold table you supply.

- No RPC URL, token address or threshold is built in. All three are inputs.
- Reads at one block and refuses to read when the RPC reports a chain other than 4663.
- Returns the raw and formatted balance, the tier reached and how far the next tier is.

The $MUTEX contract address is announced at launch. Until then, pass any Robinhood Chain ERC-20 to try it.

## Install

```sh
pnpm add github:mutexa-labs/mutexa-tiers#v0.1.0 viem
```

Node 22 or later. ESM only. `viem` 2.x is a peer dependency.

## Quick start

From [`test/readme.test.ts`](test/readme.test.ts) (the test uses a mocked RPC; in production pass `rpcUrl`):

```ts
import { holderTier } from "@mutexa/tiers";

const r = await holderTier({
  rpcUrl: "https://robinhood-rpc.publicnode.com", // any Robinhood Chain RPC
  token, // the $MUTEX contract, announced at launch
  holder,
  // your thresholds, in whole tokens; these are example values
  table: [
    { tier: "tier-1", min: "100" },
    { tier: "tier-2", min: "1000" },
    { tier: "tier-3", min: "10000" },
  ],
});
// r.tier "tier-2", r.formatted "2500", r.next { tier: "tier-3", missing: "7500", ... }, r.blockNumber 1234n
```

`https://robinhood-rpc.publicnode.com` is one public endpoint; any Robinhood Chain RPC works.

## API

| Export | What it does |
|---|---|
| `holderTier({ rpcUrl \| transport \| client, token, holder, table, decimals?, blockNumber?, expectChainId? })` | Balance plus `{ tier, next }`. `tier` is `null` below every threshold. |
| `readBalance({ rpcUrl \| transport \| client, token, holder, decimals?, blockNumber?, expectChainId? })` | `{ chainId, token, holder, raw, decimals, formatted, blockNumber }` at one block. |
| `tierFor(balanceRaw, table, decimals)` | Pure mapping of a raw balance to `{ tier, next }`. |
| `resolveTable(table, decimals)` | Validates a table (non-empty, unique names, no negative or tied thresholds) and resolves it to raw units, sorted. |
| `readSymbol({ … , token })` | The token's symbol, for display. |
| `robinhoodChain(rpcUrl)`, `ROBINHOOD_CHAIN_ID` | A viem chain definition for chain id 4663 with your RPC URL. |

A table row is `{ tier: string, min: string | bigint }`: `min` as a decimal string in whole tokens (`"2500"`,
`"0.5"`) or a bigint in raw base units. Decimals are read from the token unless you pass them.

## Tests

- Table validation and mapping, including the gap to the next tier.
- Reads through a mocked viem transport: block pinning, given decimals, chain-id refusal, malformed addresses.
- `pnpm test:live` (`LIVE=1`, never in CI): reads USDG (`0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168`,
  6 decimals) on Robinhood Chain through `RHC_RPC` or the public endpoint above.

## How Mutexa uses it

Holding $MUTEX unlocks more of the protocol: more slices per position, more venues, faster rails and lower
routing fees (whitepaper §9). The Mutexa app reads the connected wallet's balance with this package and maps it
with the tier table that is set at launch. Anyone can run the same read to check which tier an address is in.

## Limitations

- **One token, one chain.** ERC-20 balances on Robinhood Chain only; balances held elsewhere, in pools or in
  other contracts do not count unless you read and add them yourself.
- **A snapshot.** The tier is the balance at the block read. Nothing here locks, stakes or tracks tokens.
- **Read-only.** Nothing here signs or sends a transaction.
- **What Mutexa does not hide** (whitepaper §5.2): venues still see their own accounts; clustering by timing is
  still possible; very large positions still move markets; splitting and privacy rails cost extra; fills routed
  with an integrator code are marked as Mutexa fills. A tier changes limits and fees, not these.

Not in this release: tiers from balances on several chains, delegated or vault-held balances.

## License

MIT © 2026 Mutexa
