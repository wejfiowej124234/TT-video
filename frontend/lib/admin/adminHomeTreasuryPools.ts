/**
 * Batch-9 · Workbench treasury pool snapshot (honest adapter).
 * Never invent mainnet balances — use not_deployed / unavailable until chain SSOT exists.
 */

export type AdminHomeTreasuryPoolStatus =
  | "ok"
  | "not_deployed"
  | "unavailable"
  | "projection";

export type AdminHomeTreasuryPoolSlice = {
  id: string;
  labelKey: string;
  /** Atomic units or display amount; null when status ≠ ok */
  amount: number | null;
};

export type AdminHomeTreasuryPoolCard = {
  id: "ttg" | "usdc" | "usdt";
  titleKey: string;
  href: string;
  status: AdminHomeTreasuryPoolStatus;
  statusNoteKey: string;
  slices: AdminHomeTreasuryPoolSlice[];
};

export type AdminHomeTreasuryPoolsSnapshot = {
  source: "not_deployed" | "chain" | "projection";
  recordedAt: string | null;
  pools: AdminHomeTreasuryPoolCard[];
};

/** Resolve workbench treasury cards. Mainnet not live → honest not_deployed shell. */
export function resolveAdminHomeTreasuryPoolsSnapshot(_input?: {
  /** Reserved for future chain/projection payload */
  payload?: unknown | null;
}): AdminHomeTreasuryPoolsSnapshot {
  void _input;
  const notDeployedNote = "admin_home_treasury_status_not_deployed";
  return {
    source: "not_deployed",
    recordedAt: null,
    pools: [
      {
        id: "ttg",
        titleKey: "admin_home_treasury_ttg_title",
        href: "/admin/finance-suite",
        status: "not_deployed",
        statusNoteKey: notDeployedNote,
        slices: [
          { id: "issued", labelKey: "admin_home_treasury_ttg_issued", amount: null },
          { id: "redeemed", labelKey: "admin_home_treasury_ttg_redeemed", amount: null },
          { id: "remaining", labelKey: "admin_home_treasury_ttg_remaining", amount: null },
        ],
      },
      {
        id: "usdc",
        titleKey: "admin_home_treasury_usdc_title",
        href: "/admin/finance-suite",
        status: "not_deployed",
        statusNoteKey: notDeployedNote,
        slices: [
          { id: "pool", labelKey: "admin_home_treasury_usdc_pool", amount: null },
          { id: "allocatable", labelKey: "admin_home_treasury_usdc_allocatable", amount: null },
          { id: "in_transit", labelKey: "admin_home_treasury_usdc_in_transit", amount: null },
          { id: "settleable", labelKey: "admin_home_treasury_usdc_settleable", amount: null },
        ],
      },
      {
        id: "usdt",
        titleKey: "admin_home_treasury_usdt_title",
        href: "/admin/finance-suite",
        status: "not_deployed",
        statusNoteKey: notDeployedNote,
        slices: [
          { id: "pool", labelKey: "admin_home_treasury_usdt_pool", amount: null },
          { id: "allocatable", labelKey: "admin_home_treasury_usdt_allocatable", amount: null },
          { id: "in_transit", labelKey: "admin_home_treasury_usdt_in_transit", amount: null },
          { id: "settleable", labelKey: "admin_home_treasury_usdt_settleable", amount: null },
        ],
      },
    ],
  };
}

/** Donut segment fractions for SVG; when no amounts, equal muted ring (visual shell only). */
export function adminHomeTreasuryDonutFractions(
  slices: AdminHomeTreasuryPoolSlice[],
): number[] {
  const amounts = slices.map((s) => (s.amount != null && s.amount > 0 ? s.amount : 0));
  const sum = amounts.reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    const n = Math.max(slices.length, 1);
    return slices.map(() => 1 / n);
  }
  return amounts.map((a) => a / sum);
}
