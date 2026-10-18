import { defineChain } from "viem";

export const ROBINHOOD_CHAIN_ID = 4663;

/**
 * Robinhood Chain (chain id 4663), an Ethereum-compatible layer 2 built on Arbitrum, with ETH as gas.
 * No RPC URL is built in: pass yours to `robinhoodChain(rpcUrl)` or to the readers.
 */
export function robinhoodChain(rpcUrl: string) {
  return defineChain({
    id: ROBINHOOD_CHAIN_ID,
    name: "Robinhood Chain",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
  });
}
