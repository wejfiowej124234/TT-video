/**
 * Local `/traveltrust` public-sale / unlock plan (product SSOT).
 * Amounts: 0.005% then ×3 ×5 ×9 ×12. Batch 1 from 2026-10-15, then +2 months.
 * First-paint quotes this ladder only (batch 1 = 1 USDC ≈ 1,000,000 TTG).
 * Contracts are updated later to match this local batch mix — do not
 * overwrite homepage copy from live mainnet overlay / FTB / Official www.
 * Not staking APY.
 */

export const TTG_PUBLIC_SALE_MIN_USDC = 1 as const;

export const TTG_TOTAL_SUPPLY = 25_000_000_000_000 as const;
export const TTG_PUBLIC_UNLOCK_FIRST_PCT = 0.00005 as const;
export const TTG_PUBLIC_UNLOCK_MULTIPLES = [1, 3, 5, 9, 12] as const;
export const TTG_PUBLIC_UNLOCK_CLASS = "TTG_PUBLIC_SALE_BATCH_LADDER_LOCAL" as const;

/** Owner sale prices (USDC per TTG) for batches 1–5. */
export const TTG_PUBLIC_SALE_UNIT_PRICES_USDC = [
  0.000001, 0.000003, 0.000005, 0.000007, 0.000009,
] as const;

export const TTG_PUBLIC_UNLOCK_DATES = [
  "2026-10-15T09:00:00Z",
  "2026-12-15T09:00:00Z",
  "2027-02-15T09:00:00Z",
  "2027-04-15T09:00:00Z",
  "2027-06-15T09:00:00Z",
] as const;

export type TtgUnlockBatchStatus = "upcoming" | "planned" | "featured";

export type TtgUnlockBatch = {
  id: 1 | 2 | 3 | 4 | 5;
  multipleFromPrev: number;
  amountTtg: number;
  pctOfTotal: number;
  unitPriceUsdc: number;
  at: string;
  status: TtgUnlockBatchStatus;
};

export type TtgPublicSaleFocusKind = "upcoming" | "open" | "complete";

export type TtgPublicSaleFocus = {
  batch: TtgUnlockBatch;
  kind: TtgPublicSaleFocusKind;
};

function buildBatches(): readonly TtgUnlockBatch[] {
  const first = TTG_TOTAL_SUPPLY * TTG_PUBLIC_UNLOCK_FIRST_PCT;
  const amounts: number[] = [];
  let prev = first;
  for (let i = 0; i < TTG_PUBLIC_UNLOCK_MULTIPLES.length; i++) {
    const amount = i === 0 ? first : prev * TTG_PUBLIC_UNLOCK_MULTIPLES[i];
    amounts.push(amount);
    prev = amount;
  }
  const statuses: TtgUnlockBatchStatus[] = [
    "upcoming",
    "planned",
    "planned",
    "planned",
    "featured",
  ];
  return amounts.map((amountTtg, i) => ({
    id: (i + 1) as TtgUnlockBatch["id"],
    multipleFromPrev: TTG_PUBLIC_UNLOCK_MULTIPLES[i],
    amountTtg,
    pctOfTotal: amountTtg / TTG_TOTAL_SUPPLY,
    unitPriceUsdc: TTG_PUBLIC_SALE_UNIT_PRICES_USDC[i],
    at: TTG_PUBLIC_UNLOCK_DATES[i],
    status: statuses[i],
  }));
}

export const TTG_PUBLIC_UNLOCK_BATCHES = buildBatches();

export const TTG_PUBLIC_UNLOCK_TOTAL_TTG = TTG_PUBLIC_UNLOCK_BATCHES.reduce(
  (sum, b) => sum + b.amountTtg,
  0,
);

export const TTG_PUBLIC_UNLOCK_TOTAL_PCT = TTG_PUBLIC_UNLOCK_TOTAL_TTG / TTG_TOTAL_SUPPLY;

export const TTG_PUBLIC_UNLOCK_META = {
  unlockClass: TTG_PUBLIC_UNLOCK_CLASS,
  publicAllocationPct: 0.5,
} as const;

export function formatTtgUnlockAmount(amountTtg: number): string {
  return Math.round(amountTtg).toLocaleString("en-US");
}

export function formatUnlockPct(pctOfTotal: number): string {
  const asPercent = pctOfTotal * 100;
  if (asPercent >= 1) return `${asPercent.toFixed(1)}%`;
  return `${asPercent.toFixed(3)}%`;
}

export function formatUnlockClock(iso: string): string {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}/${Number(m)}/${Number(day)} ${hh}:${mm}:${ss}`;
}

export function formatUnlockUnitPrice(usdcPerTtg: number): string {
  return usdcPerTtg.toFixed(8);
}

export function ttgPerUsdcFromUnitPrice(usdcPerTtg: number): number {
  return Math.round(1 / usdcPerTtg);
}

export function resolveTtgPublicSaleFocus(nowMs = Date.now()): TtgPublicSaleFocus {
  const batches = TTG_PUBLIC_UNLOCK_BATCHES;
  const times = batches.map((b) => Date.parse(b.at));
  if (nowMs < times[0]) {
    return { batch: batches[0], kind: "upcoming" };
  }
  for (let i = 0; i < batches.length; i++) {
    const start = times[i];
    const end = i + 1 < times.length ? times[i + 1] : Number.POSITIVE_INFINITY;
    if (nowMs >= start && nowMs < end) {
      return { batch: batches[i], kind: "open" };
    }
  }
  return { batch: batches[batches.length - 1], kind: "complete" };
}

export function quoteTtgPublicSaleFromUsdc(
  payAmount: string,
  usdcPerTtg: number,
): {
  receiveTtg: string;
  payUsdc: number;
  rateUsdcPerTtg: string;
  referencePriceUsdcPerTtg: number;
  liveClass: typeof TTG_PUBLIC_UNLOCK_CLASS;
} | null {
  const pay = Number.parseFloat(payAmount);
  if (!Number.isFinite(pay) || pay < TTG_PUBLIC_SALE_MIN_USDC) return null;
  if (!Number.isFinite(usdcPerTtg) || usdcPerTtg <= 0) return null;
  const receiveTtg = Math.round(pay / usdcPerTtg);
  return {
    receiveTtg: String(receiveTtg),
    payUsdc: pay,
    rateUsdcPerTtg: formatUnlockUnitPrice(usdcPerTtg),
    referencePriceUsdcPerTtg: usdcPerTtg,
    liveClass: TTG_PUBLIC_UNLOCK_CLASS,
  };
}
