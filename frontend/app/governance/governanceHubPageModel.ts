import type { LocaleInterpolationVars } from "@/lib/i18n";

/** 13-1 表 2 · C-GOV-001 / 04 §3.4：治理 hub pool/rewards 响应模型；`data_source` / `is_chain_ssot` 与 UI 标签同轨分轨（`chain_read` SSOT · `placeholder` · `database*`），禁止占位冒充链上真值。 */
export type PoolRes = {
  status: string;
  pool_balance?: string | number | null;
  currency?: string | null;
  updated_at?: string | null;
  data_source?: string;
  /** P0 / 04 §3.4：余额类展示须带分轨标签与最小来源枚举（additive；不替代旧根字段）。 */
  balance_lines_v1?: Array<{
    balance: string | number | null;
    track_type: "A" | "B" | "Escrow" | "Staking";
    source: "FeeRouter" | "RegionVault" | "Treasury" | "Escrow" | "StakingPool";
    currency?: string | null;
  }>;
  /** B-110：`GET …/governance/pool` 链上 SSOT 路径与 `data_source: chain_read` 同批 */
  is_chain_ssot?: boolean;
  /** 根级国家池链上读（与根级 `data_source` / `is_chain_ssot` 解耦；勿与 `chain_alignment_hint` 内观测腿混读） */
  country_pool?: string | null;
  country_pool_data_source?: string;
  country_pool_is_chain_ssot?: boolean;
  /** 根级金库原生 Wei 链上读（与 `pool_balance` / `country_pool*` 解耦；勿与并行快照观测腿混读） */
  treasury_pool?: string | null;
  treasury_pool_data_source?: string;
  treasury_pool_is_chain_ssot?: boolean;
  /** 根级金库 ERC20 链上读（与 `pool_balance` / `treasury_pool*` 解耦；勿与 `chain_alignment_hint` 内并行观测腿混读） */
  treasury_erc20_pool?: string | null;
  treasury_erc20_pool_data_source?: string;
  treasury_erc20_pool_is_chain_ssot?: boolean;
  rule_version?: string;
  note?: string;
};

export function looksLikeEvmAddress(s: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(s.trim());
}

export function governancePoolIsChainReadRow(p: PoolRes | null): p is PoolRes & { data_source: "chain_read" } {
  return p != null && p.data_source === "chain_read";
}

export function balanceLineShortLabel(line: NonNullable<PoolRes["balance_lines_v1"]>[number]): string {
  return `${line.track_type} · ${line.source}`;
}

/** B110：`country_pool_data_source: chain_read` + `country_pool_is_chain_ssot` + 非空 `country_pool`（uint256 hex）。 */
export function governanceCountryPoolRootChainSsot(
  p: PoolRes | null
): p is PoolRes & {
  country_pool_data_source: "chain_read";
  country_pool_is_chain_ssot: true;
  country_pool: string;
} {
  if (p == null) return false;
  const hex = p.country_pool;
  return (
    p.country_pool_data_source === "chain_read" &&
    p.country_pool_is_chain_ssot === true &&
    typeof hex === "string" &&
    hex.trim() !== ""
  );
}

/** B110：`treasury_pool_data_source: chain_read` + `treasury_pool_is_chain_ssot` + 非空 `treasury_pool`（原生 Wei hex）。 */
export function governanceTreasuryPoolRootChainSsot(
  p: PoolRes | null
): p is PoolRes & {
  treasury_pool_data_source: "chain_read";
  treasury_pool_is_chain_ssot: true;
  treasury_pool: string;
} {
  if (p == null) return false;
  const hex = p.treasury_pool;
  return (
    p.treasury_pool_data_source === "chain_read" &&
    p.treasury_pool_is_chain_ssot === true &&
    typeof hex === "string" &&
    hex.trim() !== ""
  );
}

/** 根级：`treasury_erc20_pool_data_source: chain_read` + `treasury_erc20_pool_is_chain_ssot` + 非空 `treasury_erc20_pool`（uint256 hex）。 */
export function governanceTreasuryErc20PoolRootChainSsot(
  p: PoolRes | null
): p is PoolRes & {
  treasury_erc20_pool_data_source: "chain_read";
  treasury_erc20_pool_is_chain_ssot: true;
  treasury_erc20_pool: string;
} {
  if (p == null) return false;
  const hex = p.treasury_erc20_pool;
  return (
    p.treasury_erc20_pool_data_source === "chain_read" &&
    p.treasury_erc20_pool_is_chain_ssot === true &&
    typeof hex === "string" &&
    hex.trim() !== ""
  );
}

export type RewardsRes = {
  status: string;
  items?: unknown[];
  data_source?: string;
  rule_version?: string;
  note?: string;
};

function governanceHttpErrorDetail(body: unknown): string | null {
  if (body == null || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const m = o.message;
  const e = o.error;
  if (typeof m === "string" && m.trim()) return m.trim();
  if (typeof e === "string" && e.trim()) return e.trim();
  return null;
}

export function governanceHttpErrorLine(
  t: (k: string, vars?: LocaleInterpolationVars) => string,
  which: "pool" | "rewards",
  status: number,
  body: unknown
): string {
  const key = which === "pool" ? "governance_pool_http_error" : "governance_rewards_http_error";
  const base = t(key, { status });
  const detail = governanceHttpErrorDetail(body);
  return detail ? `${base} — ${detail}` : base;
}

/** GET /governance/rewards 列表项：与后端 `amount` + `currency` 字段对齐（currency 可空） */
export function governanceRewardListItemLine(
  item: unknown,
  t: (k: string, vars?: LocaleInterpolationVars) => string
): string {
  if (item == null || typeof item !== "object") return JSON.stringify(item);
  const o = item as { amount?: unknown; currency?: unknown };
  const raw = o.amount;
  const amountPart =
    typeof raw === "string"
      ? raw.trim() || null
      : typeof raw === "number" && Number.isFinite(raw)
        ? String(raw)
        : null;
  if (amountPart == null) return JSON.stringify(item);
  const c = o.currency;
  const cur = typeof c === "string" && c.trim() ? c.trim() : null;
  if (cur) return `${amountPart} ${cur}`;
  return t("governance_rewards_amountWithoutCurrency", { amount: amountPart });
}
