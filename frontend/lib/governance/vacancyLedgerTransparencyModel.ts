/** W4a · Vacancy Ledger Transparency — Indexer API types only (no RPC, no reserve recompute). */

export type VacancyLedgerSnapshot = {
  jurisdiction: string;
  state: string;
  principal: string;
  swept: string;
  reserve: string;
  disbursed: string;
  sweepEnabled: boolean;
  stewardActivationEpochId?: string;
  lastBlock?: number;
  lastLogIndex?: number;
  dataSource: "indexer";
  readOnly: true;
};

export type VacancyTimelineEvent = {
  event: string;
  blockNumber: number;
  logIndex: number;
  txHash?: string | null;
  jurisdiction?: string;
  dataSource: "indexer";
};

export type VacancyJurisdictionRow = {
  jurisdiction: string;
  runtimeStatus: string;
  indexed: boolean;
  ledger: VacancyLedgerSnapshot | null;
  timeline?: VacancyTimelineEvent[];
};

export type GovernanceVacancyLedgerResponse = {
  status: string;
  protocolVersion: string;
  protocolStatus: string;
  runtimeStatus: string;
  runtimeCapability: string;
  lastVerified: string;
  network: string;
  reconcileStatus: string;
  chainId: number;
  dataSource: "indexer";
  readOnly: true;
  jurisdictions: VacancyJurisdictionRow[];
  note?: string;
};

/** Display atomic USDC (6 decimals) from indexer u256 decimal string — no economic recompute. */
export function formatVacancyUsdcAtomic(amountAtomic: string, decimals = 6): string {
  const raw = amountAtomic.trim();
  if (!/^\d+$/.test(raw)) return "—";
  if (raw === "0") return "0";
  const padded = raw.padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals) || "0";
  const frac = padded.slice(-decimals).replace(/0+$/, "");
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac ? `${groupedWhole}.${frac}` : groupedWhole;
}

export const VACANCY_LIFECYCLE_STAGES = [
  { id: "STEWARD_ACTIVE", labelKey: "governance_vacancy_ledger_stage_steward_active" },
  { id: "VacancyEntered", labelKey: "governance_vacancy_ledger_stage_vacancy_entered" },
  { id: "GraceStarted", labelKey: "governance_vacancy_ledger_stage_grace" },
  { id: "SweepExecuted", labelKey: "governance_vacancy_ledger_stage_sweep" },
  { id: "ReserveReached", labelKey: "governance_vacancy_ledger_stage_reserve_reached" },
  { id: "StewardActivated", labelKey: "governance_vacancy_ledger_stage_steward_activated" },
  { id: "JurisdictionReserveDisbursed", labelKey: "governance_vacancy_ledger_stage_disbursed" },
] as const;

export function lifecycleStageReached(
  stageId: string,
  currentState: string | undefined,
  timeline: VacancyTimelineEvent[] | undefined,
): boolean {
  const events = new Set((timeline ?? []).map((e) => e.event));
  if (events.has(stageId)) return true;
  if (stageId === "STEWARD_ACTIVE" && currentState === "STEWARD_ACTIVE") return true;
  if (stageId === "GraceStarted" && currentState === "GRACE_PERIOD") return true;
  if (stageId === "SweepExecuted" && currentState === "SWEEP") return true;
  return false;
}
