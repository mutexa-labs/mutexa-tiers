import { formatUnits, parseUnits } from "viem";

/**
 * One row of a caller-supplied tier table. `min` is the smallest balance that reaches the tier: a decimal
 * string in whole tokens ("2500" or "0.5"), or a bigint in raw base units.
 */
export type TierThreshold<T extends string = string> = { tier: T; min: string | bigint };

export type ResolvedTier<T extends string = string> = { tier: T; minRaw: bigint };

export type TierMatch<T extends string = string> = {
  tier: T | null; // null when the balance is below every threshold
  next: { tier: T; minRaw: bigint; missingRaw: bigint; missing: string } | null; // the next tier up, if any
};

/** Validates a table and resolves every threshold to raw units, sorted from lowest to highest. */
export function resolveTable<T extends string>(
  table: readonly TierThreshold<T>[],
  decimals: number,
): ResolvedTier<T>[] {
  if (!table.length) throw new Error("tier table is empty: pass the thresholds you use");
  const names = new Set<string>();
  const rows = table.map((row) => {
    if (!row.tier) throw new Error("every tier needs a name");
    if (names.has(row.tier)) throw new Error(`tier "${row.tier}" appears twice`);
    names.add(row.tier);
    const minRaw = typeof row.min === "bigint" ? row.min : parseUnits(row.min.trim(), decimals);
    if (minRaw < 0n) throw new Error(`tier "${row.tier}" has a negative threshold`);
    return { tier: row.tier, minRaw };
  });
  rows.sort((a, b) => (a.minRaw < b.minRaw ? -1 : a.minRaw > b.minRaw ? 1 : 0));
  for (let i = 1; i < rows.length; i++) {
    if (rows[i]!.minRaw === rows[i - 1]!.minRaw)
      throw new Error(`tiers "${rows[i - 1]!.tier}" and "${rows[i]!.tier}" have the same threshold`);
  }
  return rows;
}

/** The highest tier whose threshold the raw balance reaches, and how far the next tier is. */
export function tierFor<T extends string>(
  balanceRaw: bigint,
  table: readonly TierThreshold<T>[],
  decimals: number,
): TierMatch<T> {
  const rows = resolveTable(table, decimals);
  let tier: T | null = null;
  let next: TierMatch<T>["next"] = null;
  for (const row of rows) {
    if (balanceRaw >= row.minRaw) tier = row.tier;
    else {
      const missingRaw = row.minRaw - balanceRaw;
      next = { tier: row.tier, minRaw: row.minRaw, missingRaw, missing: formatUnits(missingRaw, decimals) };
      break;
    }
  }
  return { tier, next };
}
