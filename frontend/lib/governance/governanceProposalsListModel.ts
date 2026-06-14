import type { GovernanceProposalExecStatusEntry } from "@/components/governance/GovernanceProposalExecStatusBadge";

export type GovernanceProposalsPageItem = { id?: string; title?: string; status?: string; [key: string]: unknown };

export type GovernanceProposalStatusFilter = "all" | "active" | "pending" | "closed";

export type GovernancePersonaView = "all" | "holder" | "traveler" | "steward";

export const GOVERNANCE_PERSONA_STORAGE_KEY = "traveltrust_governance_persona_v1";

function normalizedStatus(item: GovernanceProposalsPageItem, exec?: GovernanceProposalExecStatusEntry): string {
  if (exec && exec.state === "ok") return exec.status.trim().toLowerCase();
  if (typeof item.status === "string" && item.status.trim()) return item.status.trim().toLowerCase();
  return "";
}

export function matchesGovernanceStatusFilter(
  item: GovernanceProposalsPageItem,
  filter: GovernanceProposalStatusFilter,
  exec?: GovernanceProposalExecStatusEntry,
): boolean {
  if (filter === "all") return true;
  const s = normalizedStatus(item, exec);
  if (filter === "active") return s === "active";
  if (filter === "pending") return s === "pending";
  if (filter === "closed") {
    return ["canceled", "cancelled", "defeated", "succeeded", "queued", "executed"].includes(s);
  }
  return true;
}

export function filterGovernanceProposals(
  items: GovernanceProposalsPageItem[],
  filter: GovernanceProposalStatusFilter,
  chainExecById?: Record<string, GovernanceProposalExecStatusEntry>,
): GovernanceProposalsPageItem[] {
  return items.filter((item) => {
    const pid = typeof item.id === "string" && item.id.trim() ? item.id.trim() : "";
    const exec = pid && chainExecById ? chainExecById[pid] : undefined;
    return matchesGovernanceStatusFilter(item, filter, exec);
  });
}

export function readGovernancePersonaView(): GovernancePersonaView {
  if (typeof window === "undefined") return "all";
  try {
    const raw = window.localStorage.getItem(GOVERNANCE_PERSONA_STORAGE_KEY);
    if (raw === "holder" || raw === "traveler" || raw === "steward" || raw === "all") return raw;
  } catch {
    /* ignore */
  }
  return "all";
}

export function writeGovernancePersonaView(view: GovernancePersonaView): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GOVERNANCE_PERSONA_STORAGE_KEY, view);
  } catch {
    /* ignore */
  }
}

/** 列表卡片用：长 proposal id 截断展示，完整值保留在 title 属性 */
export function formatGovernanceProposalIdForList(id: string): { display: string; full: string } {
  const full = id.trim();
  if (full.length <= 16) return { display: full, full };
  return { display: `#${full.slice(0, 8)}…${full.slice(-4)}`, full };
}

/** 列表卡片用：地址缩写 */
export function formatGovernanceAddressForList(addr: string): { display: string; full: string } {
  const full = addr.trim();
  if (!full.startsWith("0x") || full.length < 10) return { display: full, full };
  return { display: `${full.slice(0, 6)}…${full.slice(-4)}`, full };
}

export type GovernanceProposalListSummary = {
  yes: number;
  no: number;
  abstain: number;
  proposer: string | null;
  voteEndBlock: number | null;
};

export function parseGovernanceVoteCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const n = Number(BigInt(value.trim()));
      return Number.isFinite(n) && n >= 0 ? n : 0;
    } catch {
      const n = Number(value);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    }
  }
  return 0;
}

export type GovernanceVoteBarSegment = { key: "yes" | "no" | "abstain"; count: number; percent: number };

/** 计票条分段（总和为 0 时各段 percent 为 0） */
export function computeGovernanceVoteBarSegments(
  yes: number,
  no: number,
  abstain: number,
): { total: number; segments: GovernanceVoteBarSegment[] } {
  const counts = { yes: Math.max(0, yes), no: Math.max(0, no), abstain: Math.max(0, abstain) };
  const total = counts.yes + counts.no + counts.abstain;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);
  return {
    total,
    segments: [
      { key: "yes", count: counts.yes, percent: pct(counts.yes) },
      { key: "no", count: counts.no, percent: pct(counts.no) },
      { key: "abstain", count: counts.abstain, percent: pct(counts.abstain) },
    ],
  };
}

/** 列表卡片状态副文案 i18n key（与 exec status 对齐） */
export function governanceProposalCardStatusHintKey(status: string):
  | "governance_proposals_card_hint_pending"
  | "governance_proposals_card_hint_active"
  | "governance_proposals_card_hint_closed"
  | "governance_proposals_card_hint_unknown" {
  const s = status.trim().toLowerCase();
  if (s === "pending") return "governance_proposals_card_hint_pending";
  if (s === "active") return "governance_proposals_card_hint_active";
  if (["canceled", "cancelled", "defeated", "succeeded", "queued", "executed"].includes(s)) {
    return "governance_proposals_card_hint_closed";
  }
  return "governance_proposals_card_hint_unknown";
}
