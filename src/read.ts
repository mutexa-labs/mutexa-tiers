import {
  createPublicClient,
  formatUnits,
  getAddress,
  http,
  parseAbi,
  type Address,
  type PublicClient,
  type Transport,
} from "viem";
import { robinhoodChain, ROBINHOOD_CHAIN_ID } from "./chain";
import { tierFor, type TierMatch, type TierThreshold } from "./table";

const erc20Abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]);

export type ReaderSource =
  | { rpcUrl: string; transport?: never; client?: never }
  | { transport: Transport; rpcUrl?: never; client?: never }
  | { client: PublicClient; rpcUrl?: never; transport?: never };

export type ReadOptions = ReaderSource & {
  token: string; // the ERC-20 contract address
  holder: string;
  decimals?: number; // read from the token when omitted
  blockNumber?: bigint; // read at this block; the latest block when omitted
  expectChainId?: number; // refuse to read when the RPC reports another chain; default 4663
};

export type Balance = {
  chainId: number;
  token: Address;
  holder: Address;
  raw: bigint;
  decimals: number;
  formatted: string;
  blockNumber: bigint;
};

export type HolderTier<T extends string = string> = Balance & TierMatch<T>;

function clientFor(src: ReaderSource): PublicClient {
  if (src.client) return src.client;
  if (src.transport)
    return createPublicClient({ chain: robinhoodChain("http://unused.invalid"), transport: src.transport });
  if (!src.rpcUrl) throw new Error("pass rpcUrl, transport or client");
  return createPublicClient({ chain: robinhoodChain(src.rpcUrl), transport: http(src.rpcUrl, { timeout: 15_000 }) });
}

/** Reads an ERC-20 balance at one block, after checking the RPC is on the expected chain. */
export async function readBalance(opts: ReadOptions): Promise<Balance> {
  const client = clientFor(opts);
  const token = getAddress(opts.token);
  const holder = getAddress(opts.holder);
  const expected = opts.expectChainId ?? ROBINHOOD_CHAIN_ID;
  const chainId = await client.getChainId();
  if (chainId !== expected) throw new Error(`RPC is on chain ${chainId}, expected ${expected}`);
  const blockNumber = opts.blockNumber ?? (await client.getBlockNumber());
  const [raw, decimals] = await Promise.all([
    client.readContract({ address: token, abi: erc20Abi, functionName: "balanceOf", args: [holder], blockNumber }),
    opts.decimals ??
      client.readContract({ address: token, abi: erc20Abi, functionName: "decimals", blockNumber }).then(Number),
  ]);
  return { chainId, token, holder, raw, decimals, formatted: formatUnits(raw, decimals), blockNumber };
}

/** Reads a holder's balance and maps it to a tier from the caller's table. */
export async function holderTier<T extends string>(
  opts: ReadOptions & { table: readonly TierThreshold<T>[] },
): Promise<HolderTier<T>> {
  const balance = await readBalance(opts);
  return { ...balance, ...tierFor(balance.raw, opts.table, balance.decimals) };
}

/** The token's symbol, for display. */
export async function readSymbol(src: ReaderSource & { token: string }): Promise<string> {
  return clientFor(src).readContract({ address: getAddress(src.token), abi: erc20Abi, functionName: "symbol" });
}
