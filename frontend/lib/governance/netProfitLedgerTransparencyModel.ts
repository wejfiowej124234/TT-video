export type NetProfitEpochSnapshot = {
  epochId?: string;
  status?: string;
  epochStart?: number;
  epochEnd?: number;
  grossRevenue?: string;
  allowableExpense?: string;
  netProfit?: string;
  netProfitPrime?: string;
  funded?: boolean;
  stewardAmount?: string;
  unallocatedAmount?: string;
  globalAmount?: string;
  stewardPathEligible?: boolean;
  qualifiedSteward?: string;
  bpsStewardPath?: number;
  bpsGlobalTreasury?: number;
  activeSteward?: string;
  lastBlock?: number;
  lastLogIndex?: number;
  dataSource?: string;
};

export type NetProfitTimelineEvent = {
  event?: string;
  blockNumber?: number;
  logIndex?: number;
  txHash?: string;
  jurisdiction?: string;
  epochId?: string;
  accountingOk?: boolean | null;
  dataSource?: string;
};

export type NetProfitJurisdictionRow = {
  jurisdiction: string;
  indexed?: boolean;
  epochs?: NetProfitEpochSnapshot[];
  timeline?: NetProfitTimelineEvent[];
};

export type GovernanceNetProfitLedgerResponse = {
  status?: string;
  protocolVersion?: string;
  protocolStatus?: string;
  runtimeStatus?: string;
  runtimeCapability?: string;
  reconcileStatus?: string;
  splitRatio?: string;
  settlementDenomination?: string;
  chainId?: number;
  dataSource?: string;
  readOnly?: boolean;
  network?: string;
  lastVerified?: string;
  note?: string;
  indexerStats?: {
    epochCount?: number;
    eventCount?: number;
    lastIndexedBlock?: number;
    lastIndexedLogIndex?: number;
  };
  accountingAudit?: {
    netProfitSplitFailures?: number;
    status?: string;
  };
  jurisdictions?: NetProfitJurisdictionRow[];
};

const USDC_DECIMALS = 6;

export function formatNetProfitUsdcAtomic(raw: string | undefined | null): string {
  if (raw == null || raw === "") return "—";
  try {
    const n = BigInt(raw);
    const neg = n < 0n;
    const abs = neg ? -n : n;
    const base = 10n ** BigInt(USDC_DECIMALS);
    const whole = abs / base;
    const frac = abs % base;
    const fracStr = frac.toString().padStart(USDC_DECIMALS, "0").replace(/0+$/, "");
    const body = fracStr ? `${whole}.${fracStr}` : whole.toString();
    return neg ? `-${body}` : body;
  } catch {
    return raw;
  }
}

export const NET_PROFIT_LIFECYCLE_STAGES = [
  "EpochOpened",
  "NetProfitAccrued",
  "EpochClosed",
  "LedgerFundedForSplit",
  "NetProfitSplit",
  "StewardPathDeposit",
  "UnallocatedStewardDeposit",
  "UnallocatedStewardReleased",
] as const;

export function lifecycleStageReached(
  timeline: NetProfitTimelineEvent[] | undefined,
  stage: (typeof NET_PROFIT_LIFECYCLE_STAGES)[number],
): boolean {
  if (!timeline?.length) return false;
  return timeline.some((e) => e.event === stage);
}
