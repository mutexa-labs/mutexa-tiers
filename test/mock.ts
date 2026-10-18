import { custom, decodeFunctionData, encodeFunctionResult, numberToHex, parseAbi, type Address } from "viem";

const abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]);

/** A fake RPC for one ERC-20: answers eth_chainId, eth_blockNumber and eth_call to the token. */
export function mockToken(opts: {
  chainId?: number;
  token: Address;
  decimals: number;
  symbol: string;
  balances: Record<string, bigint>;
}) {
  const calls: { method: string; block?: string }[] = [];
  const transport = custom({
    async request({ method, params }: { method: string; params?: unknown[] }) {
      if (method === "eth_chainId") return numberToHex(opts.chainId ?? 4663);
      if (method === "eth_blockNumber") return numberToHex(1234n);
      if (method !== "eth_call") throw new Error(`unexpected ${method}`);
      const [call, block] = params as [{ to: string; data: `0x${string}` }, string];
      calls.push({ method, block });
      if (call.to.toLowerCase() !== opts.token.toLowerCase()) return "0x";
      const { functionName, args } = decodeFunctionData({ abi, data: call.data });
      if (functionName === "balanceOf") {
        const owner = (args![0] as string).toLowerCase();
        return encodeFunctionResult({ abi, functionName, result: opts.balances[owner] ?? 0n });
      }
      if (functionName === "decimals") return encodeFunctionResult({ abi, functionName, result: opts.decimals });
      return encodeFunctionResult({ abi, functionName: "symbol", result: opts.symbol });
    },
  });
  return { transport, calls };
}
