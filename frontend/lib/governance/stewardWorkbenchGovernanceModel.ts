import type { PoolRes, RewardsRes } from "@/app/governance/governanceHubPageModel";
import { balanceLineShortLabel, governancePoolIsChainReadRow } from "@/app/governance/governanceHubPageModel";

export type StewardPoolStatDisplay = {
  value: string;
  currency: string | null;
  dataSource: string | null;
  isChainSsot: boolean;
};

export function stewardPoolStatDisplay(pool: PoolRes | null): StewardPoolStatDisplay {
  if (pool == null) {
    return { value: "—", currency: null, dataSource: null, isChainSsot: false };
  }
  const currency =
    typeof pool.currency === "string" && pool.currency.trim() ? pool.currency.trim() : null;
  const balance = pool.pool_balance;
  const value =
    balance == null
      ? "—"
      : typeof balance === "number"
        ? String(balance)
        : String(balance).trim() || "—";
  const isChainSsot = governancePoolIsChainReadRow(pool) && pool.is_chain_ssot === true;
  return {
    value,
    currency,
    dataSource: pool.data_source ?? null,
    isChainSsot,
  };
}

export function stewardRewardsItemCount(rewards: RewardsRes | null): number {
  if (!rewards?.items || !Array.isArray(rewards.items)) return 0;
  return rewards.items.length;
}

/** ① 本地 / ② 测试网数据诚实标签（不冒充 ③ 主网 SSOT） */
export function stewardGovernanceDataSourceNoteKey(
  pool: PoolRes | null,
  rewards: RewardsRes | null,
): string | null {
  const poolDs = pool?.data_source ?? null;
  const rewardsDs = rewards?.data_source ?? null;
  if (poolDs === "chain_read" || rewardsDs === "chain_read") {
    return "steward_workbench_data_note_chain_read";
  }
  if (poolDs === "database" || rewardsDs === "database") {
    return "steward_workbench_data_note_database";
  }
  if (poolDs === "placeholder" || rewardsDs === "placeholder") {
    return "steward_workbench_data_note_placeholder";
  }
  return "steward_workbench_data_note_local";
}

export type StewardGovernanceTrackLine = {
  label: string;
  value: string;
  currency: string | null;
};

/** 工作台 L5 · 最多展示 N 条分轨余额（无折叠、无 Hub 全量块） */
export function stewardGovernanceCompactTrackLines(
  pool: PoolRes | null,
  max = 3,
): StewardGovernanceTrackLine[] {
  const lines = pool?.balance_lines_v1;
  if (!Array.isArray(lines) || lines.length === 0) return [];
  return lines.slice(0, max).map((line) => ({
    label: balanceLineShortLabel(line),
    value: line.balance == null ? "—" : String(line.balance),
    currency: typeof line.currency === "string" && line.currency.trim() ? line.currency.trim() : null,
  }));
}
