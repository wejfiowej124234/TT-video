/**
 * Local `/traveltrust` public-sale / unlock plan (product SSOT).
 * Plan: V9 短窗五轮 (`V9_SHORT_WINDOW_FIVE_ROUND`) — amounts 3.905% of 25T, short windows + gaps.
 * First-paint quotes this ladder only (batch 1 = 1 USDC ≈ 1,000,000 TTG).
 * Live mainnet PM pin executed 2026-08-26 (tx 0x048c6d29…); Official www may lag until a V9 hop.
 * Not staking APY.
 */

export const TTG_SALE_SCHEDULE_PIN = "V9_SHORT_WINDOW_FIVE_ROUND" as const;
export const TTG_SALE_SCHEDULE_NAME_ZH = "V9 短窗五轮" as const;

export const TTG_PUBLIC_SALE_MIN_USDC = 1 as const;

export const TTG_TOTAL_SUPPLY = 25_000_000_000_000 as const;
export const TTG_PUBLIC_UNLOCK_FIRST_PCT = 0.00005 as const;
/** Quantity vs previous batch (rounds 4–5 taper; do not market as a permanent ×N law). */
export const TTG_PUBLIC_UNLOCK_MULTIPLES = [1, 5, 5, 10, 2] as const;
export const TTG_PUBLIC_UNLOCK_CLASS = "TTG_PUBLIC_SALE_BATCH_LADDER_LOCAL" as const;

export const TTG_PUBLIC_UNLOCK_AMOUNTS_TTG = [
  1_250_000_000, 6_250_000_000, 31_250_000_000, 312_500_000_000, 625_000_000_000,
] as const;

/** Owner sale prices (USDC per TTG) for batches 1–5. */
export const TTG_PUBLIC_SALE_UNIT_PRICES_USDC = [
  0.000001, 0.000003, 0.000005, 0.000007, 0.000009,
] as const;

export const TTG_PUBLIC_UNLOCK_DATES = [
  "2026-10-15T09:00:00Z",
  "2026-11-12T09:00:00Z",
  "2027-01-12T09:00:00Z",
  "2027-03-09T09:00:00Z",
  "2027-05-06T09:00:00Z",
] as const;

export const TTG_PUBLIC_UNLOCK_END_DATES = [
  "2026-10-22T09:00:00Z",
  "2026-11-26T09:00:00Z",
  "2027-02-02T09:00:00Z",
  "2027-04-08T09:00:00Z",
  "2027-06-20T09:00:00Z",
] as const;

export const TTG_PUBLIC_UNLOCK_WINDOW_DAYS = [7, 14, 21, 30, 45] as const;

export type TtgUnlockBatchStatus = "upcoming" | "planned" | "featured";

export type TtgUnlockBatch = {
  id: 1 | 2 | 3 | 4 | 5;
  multipleFromPrev: number;
  amountTtg: number;
  pctOfTotal: number;
  unitPriceUsdc: number;
  at: string;
  endAt: string;
  windowDays: number;
  status: TtgUnlockBatchStatus;
};

export type TtgPublicSaleFocusKind = "upcoming" | "open" | "complete";

export type TtgPublicSaleFocus = {
  batch: TtgUnlockBatch;
  kind: TtgPublicSaleFocusKind;
};

function buildBatches(): readonly TtgUnlockBatch[] {
  const statuses: TtgUnlockBatchStatus[] = [
    "upcoming",
    "planned",
    "planned",
    "planned",
    "featured",
  ];
  return TTG_PUBLIC_UNLOCK_AMOUNTS_TTG.map((amountTtg, i) => ({
    id: (i + 1) as TtgUnlockBatch["id"],
    multipleFromPrev: TTG_PUBLIC_UNLOCK_MULTIPLES[i],
    amountTtg,
    pctOfTotal: amountTtg / TTG_TOTAL_SUPPLY,
    unitPriceUsdc: TTG_PUBLIC_SALE_UNIT_PRICES_USDC[i],
    at: TTG_PUBLIC_UNLOCK_DATES[i],
    endAt: TTG_PUBLIC_UNLOCK_END_DATES[i],
    windowDays: TTG_PUBLIC_UNLOCK_WINDOW_DAYS[i],
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
  saleSchedulePin: TTG_SALE_SCHEDULE_PIN,
} as const;

export function formatTtgUnlockAmount(amountTtg: number): string {
  return Math.round(amountTtg).toLocaleString("en-US");
}

export function formatUnlockPct(pctOfTotal: number): string {
  const asPercent = pctOfTotal * 100;
  if (asPercent >= 1) {
    return `${asPercent.toFixed(3).replace(/\.?0+$/, "")}%`;
  }
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

/**
 * W-P0-05: Phase1 cutover pending — never date-drive an `open` sale window.
 * Calendar remains disclosure-only; ACTIVE CTA = window not open.
 */
export function resolveTtgPublicSaleFocus(_nowMs = Date.now()): TtgPublicSaleFocus {
  return { batch: TTG_PUBLIC_UNLOCK_BATCHES[0], kind: "upcoming" };
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
