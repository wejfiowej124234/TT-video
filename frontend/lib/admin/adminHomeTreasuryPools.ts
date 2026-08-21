/**
 * Workbench treasury snapshot (honest adapter).
 * Live facts come from GET /meta (L7 addresses) + Indexer admin lists (L8).
 * Never invent TTG issued/USDC allocatable slices — those 83 pool splits are not Official live.
 */

export type AdminHomeTreasuryPoolStatus =
  | "ok"
  | "not_deployed"
  | "unavailable"
  | "projection";

export type AdminHomeTreasuryPoolSlice = {
  id: string;
  labelKey: string;
  /** Event counts / numeric facts only; null when unknown. Never a fabricated pool balance. */
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

export type AdminHomeTreasuryChainFacts = {
  chainId: number | null;
  feeRouterAddress: string | null;
  treasuryAddress: string | null;
  governorAddress: string | null;
  governanceTokenAddress: string | null;
  escrowFactoryAddress: string | null;
  timelockAddress: string | null;
  feeRouterEventTotal: number | null;
  feeRouterLatestAt: string | null;
  regionVaultEventTotal: number | null;
  regionVaultLatestAt: string | null;
};

export type AdminHomeTreasuryPoolsSnapshot = {
  source: "not_deployed" | "chain" | "projection";
  recordedAt: string | null;
  pools: AdminHomeTreasuryPoolCard[];
  facts: AdminHomeTreasuryChainFacts | null;
};

const ADDR_RE = /^0x[a-fA-F0-9]{40}$/;

export function isAdminHomeTreasuryEvmAddress(v: string | null | undefined): boolean {
  return typeof v === "string" && ADDR_RE.test(v.trim());
}

export type AdminHomeTreasuryChainInput = AdminHomeTreasuryChainFacts & {
  fetchError?: boolean;
};

function emptyFacts(): AdminHomeTreasuryChainFacts {
  return {
    chainId: null,
    feeRouterAddress: null,
    treasuryAddress: null,
    governorAddress: null,
    governanceTokenAddress: null,
    escrowFactoryAddress: null,
    timelockAddress: null,
    feeRouterEventTotal: null,
    feeRouterLatestAt: null,
    regionVaultEventTotal: null,
    regionVaultLatestAt: null,
  };
}

function notDeployedSnapshot(): AdminHomeTreasuryPoolsSnapshot {
  const notDeployedNote = "admin_home_treasury_status_not_deployed";
  return {
    source: "not_deployed",
    recordedAt: null,
    facts: null,
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

export function adminHomeTreasuryContractsWired(facts: AdminHomeTreasuryChainFacts): boolean {
  return (
    isAdminHomeTreasuryEvmAddress(facts.feeRouterAddress) ||
    isAdminHomeTreasuryEvmAddress(facts.treasuryAddress) ||
    isAdminHomeTreasuryEvmAddress(facts.escrowFactoryAddress) ||
    isAdminHomeTreasuryEvmAddress(facts.governorAddress) ||
    isAdminHomeTreasuryEvmAddress(facts.governanceTokenAddress) ||
    isAdminHomeTreasuryEvmAddress(facts.timelockAddress)
  );
}

/** Resolve workbench treasury cards from /meta + Indexer payload. No payload → honest not_deployed shell. */
export function resolveAdminHomeTreasuryPoolsSnapshot(_input?: {
  payload?: AdminHomeTreasuryChainInput | null;
}): AdminHomeTreasuryPoolsSnapshot {
  const payload = _input?.payload;
  if (!payload) return notDeployedSnapshot();

  const facts: AdminHomeTreasuryChainFacts = {
    ...emptyFacts(),
    chainId: payload.chainId ?? null,
    feeRouterAddress: payload.feeRouterAddress ?? null,
    treasuryAddress: payload.treasuryAddress ?? null,
    governorAddress: payload.governorAddress ?? null,
    governanceTokenAddress: payload.governanceTokenAddress ?? null,
    escrowFactoryAddress: payload.escrowFactoryAddress ?? null,
    timelockAddress: payload.timelockAddress ?? null,
    feeRouterEventTotal: payload.feeRouterEventTotal ?? null,
    feeRouterLatestAt: payload.feeRouterLatestAt ?? null,
    regionVaultEventTotal: payload.regionVaultEventTotal ?? null,
    regionVaultLatestAt: payload.regionVaultLatestAt ?? null,
  };

  if (!adminHomeTreasuryContractsWired(facts)) {
    return notDeployedSnapshot();
  }

  const hasIndexer =
    facts.feeRouterEventTotal != null || facts.regionVaultEventTotal != null;
  const source: AdminHomeTreasuryPoolsSnapshot["source"] = hasIndexer ? "chain" : "projection";
  const noteKey =
    source === "chain"
      ? "admin_home_treasury_status_chain"
      : "admin_home_treasury_status_projection";

  return {
    source,
    recordedAt: new Date().toISOString(),
    facts,
    pools: [
      {
        id: "ttg",
        titleKey: "admin_home_treasury_ttg_title",
        href: "/admin/finance-suite",
        status: "ok",
        statusNoteKey: noteKey,
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
        status: "ok",
        statusNoteKey: noteKey,
        slices: [
          {
            id: "fee_router_events",
            labelKey: "admin_home_treasury_fee_router_events",
            amount: facts.feeRouterEventTotal,
          },
          {
            id: "region_vault_events",
            labelKey: "admin_home_treasury_region_vault_events",
            amount: facts.regionVaultEventTotal,
          },
        ],
      },
      {
        id: "usdt",
        titleKey: "admin_home_treasury_usdt_title",
        href: "/admin/finance-suite",
        status: "ok",
        statusNoteKey: noteKey,
        slices: [
          { id: "pool", labelKey: "admin_home_treasury_usdt_pool", amount: null },
        ],
      },
    ],
  };
}

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

export function adminHomeTreasuryShortAddress(address: string): string {
  const a = address.trim();
  if (a.length < 12) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function adminHomeTreasuryExplorerAddressUrl(
  chainId: number | null,
  address: string,
): string | null {
  if (!isAdminHomeTreasuryEvmAddress(address)) return null;
  const host =
    chainId === 11155111
      ? "https://sepolia.etherscan.io/address/"
      : chainId === 1
        ? "https://etherscan.io/address/"
        : null;
  return host ? `${host}${address.trim()}` : null;
}
