"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { apiUrl, routes } from "@/lib/api";
import { fetchJsonWithApiStatusLog, getAuthHeaders } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import GovernanceTargetNotice from "@/components/governance/GovernanceTargetNotice";
import { GovernanceOpsAdminLinks } from "@/components/governance/GovernanceOpsAdminLinks";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import type { LocaleInterpolationVars } from "@/lib/i18n";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";
import TrustGrowthMomentBanner from "@/components/trust/TrustGrowthMomentBanner";

/** 13-1 表 2：治理页（治理者/仲裁员权限）；50-G1 前端已对接 pool/rewards API。51-H2：治理池/奖励为占位数据，待产品定稿后替换真实数据。 */
type PoolRes = {
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

function looksLikeEvmAddress(s: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(s.trim());
}

function governancePoolIsChainReadRow(p: PoolRes | null): p is PoolRes & { data_source: "chain_read" } {
  return p != null && p.data_source === "chain_read";
}

function balanceLineShortLabel(line: NonNullable<PoolRes["balance_lines_v1"]>[number]): string {
  // 企业级防误读：显式 track + source，不提供“总余额”语义。
  return `${line.track_type} · ${line.source}`;
}

/** B110：`country_pool_data_source: chain_read` + `country_pool_is_chain_ssot` + 非空 `country_pool`（uint256 hex）。 */
function governanceCountryPoolRootChainSsot(
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
function governanceTreasuryPoolRootChainSsot(
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
function governanceTreasuryErc20PoolRootChainSsot(
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
type RewardsRes = {
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

function governanceHttpErrorLine(
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
function governanceRewardListItemLine(item: unknown, t: (k: string, vars?: LocaleInterpolationVars) => string): string {
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

export default function GovernancePage() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const [pool, setPool] = useState<PoolRes | null>(null);
  const [rewards, setRewards] = useState<RewardsRes | null>(null);
  const [poolHttpError, setPoolHttpError] = useState<string | null>(null);
  const [rewardsHttpError, setRewardsHttpError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setPoolHttpError(null);
    setRewardsHttpError(null);
    const headers: Record<string, string> = { "x-request-id": `gov-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // optional auth
    }
    Promise.all([
      fetchJsonWithApiStatusLog<PoolRes>("governancePool", apiUrl(routes.governancePool), { headers }),
      fetchJsonWithApiStatusLog<RewardsRes>("governanceRewards", apiUrl(routes.governanceRewards), {
        headers,
      }),
    ])
      .then(([poolFr, rewardsFr]) => {
        setError(null);
        if (poolFr.res.ok) {
          setPool(poolFr.body);
          setPoolHttpError(null);
        } else {
          setPool(null);
          setPoolHttpError(governanceHttpErrorLine(t, "pool", poolFr.res.status, poolFr.body));
        }
        if (rewardsFr.res.ok) {
          setRewards(rewardsFr.body);
          setRewardsHttpError(null);
        } else {
          setRewards(null);
          setRewardsHttpError(governanceHttpErrorLine(t, "rewards", rewardsFr.res.status, rewardsFr.body));
        }
      })
      .catch((e) => {
        if (typeof window !== "undefined") {
          console.error("GovernancePage:", e);
        }
        setPool(null);
        setRewards(null);
        setPoolHttpError(null);
        setRewardsHttpError(null);
        setError(mapApiReadError(e, t, "governance_requestFailed"));
      })
      .finally(() => setLoading(false));
  }, [t]);

  const poolCurrencyTrim =
    pool != null && typeof pool.currency === "string" ? pool.currency.trim() : "";
  const poolHasBalance = pool?.pool_balance != null;
  const showPoolChainSsotBadge =
    governancePoolIsChainReadRow(pool) && pool.is_chain_ssot === true;
  const showCountryPoolRootSsot = governanceCountryPoolRootChainSsot(pool);
  const showTreasuryPoolRootSsot = governanceTreasuryPoolRootChainSsot(pool);
  const showTreasuryErc20PoolRootSsot = governanceTreasuryErc20PoolRootChainSsot(pool);

  return (
    <main className="mx-auto max-w-3xl p-8" aria-labelledby={pageTitleId}>
      <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
        {t("governance_title")}
      </h1>
      <p className="mt-2 text-body text-ink-600">{t("governance_desc")}</p>
      <div className="mt-4">
        <TrustGrowthMomentBanner moment="governance_entry" surface="ink" />
      </div>
      <GovernanceTargetNotice />
      <p
        className="mt-4 rounded-[var(--radius-sm)] border border-ink-200/80 bg-ink-50/60 px-3 py-2 text-meta text-ink-700 dark:border-ink-600/40 dark:bg-ink-900/25 dark:text-ink-200"
        role="note"
      >
        {t("governance_b428_closeloop_doc_pointer")}
      </p>

      {loading && (
        <p className="mt-4 text-body text-ink-500" role="status">
          {t("common_loading")}
        </p>
      )}
      {error ? <div className="mt-4"><ApiErrorAlert message={error} /></div> : null}
      {!loading && !error && (
        <section className="mt-6 space-y-6" aria-label={t("governance_pool_label")}>
          <div>
            <h2 className="text-h4 font-medium text-ink-800">{t("governance_pool_label")}</h2>
            {poolHttpError ? (
              <div className="mt-1">
                <ApiErrorAlert message={poolHttpError} />
              </div>
            ) : (
              <div className="mt-2 space-y-4">
                {Array.isArray(pool?.balance_lines_v1) && pool.balance_lines_v1.length > 0 ? (
                  <div className="space-y-2 rounded-[var(--radius-sm)] border border-ink-200/80 bg-ink-50/60 p-3 dark:border-ink-700/60 dark:bg-ink-900/20">
                    <p className="text-meta font-medium text-ink-700 dark:text-ink-200">
                      Track-labeled balances (P0)
                    </p>
                    <p className="text-meta text-ink-500">
                      No “total balance” is shown here; each line is explicit about its track and source.
                    </p>
                    <div className="grid gap-2">
                      {pool.balance_lines_v1.map((line, i) => (
                        <div
                          key={`${line.track_type}-${line.source}-${i}`}
                          className="rounded-[var(--radius-sm)] border border-ink-200/70 bg-white/60 px-3 py-2 dark:border-ink-700/60 dark:bg-ink-950/20"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-small font-medium text-ink-800 dark:text-ink-100">
                              {balanceLineShortLabel(line)}
                            </p>
                            {typeof line.currency === "string" && line.currency.trim() ? (
                              <p className="text-meta text-ink-500 dark:text-ink-400">
                                {line.currency.trim()}
                              </p>
                            ) : null}
                          </div>
                          <p className="mt-1 break-all font-mono text-small text-ink-800 dark:text-ink-100">
                            {line.balance == null ? "—" : String(line.balance)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {governancePoolIsChainReadRow(pool) ? (
                  <div className="space-y-3">
                    {showPoolChainSsotBadge ? (
                      <p className="inline-flex rounded-[var(--radius-sm)] border border-travel-500/30 bg-travel-500/10 px-2 py-1 text-small font-medium text-travel-700 dark:border-travel-400/35 dark:bg-travel-400/15 dark:text-travel-200">
                        {t("governance_chain_read_ssot_badge")}
                      </p>
                    ) : null}
                    <div>
                      <p className="text-meta text-ink-600">{t("governance_chain_read_raw_balance_caption")}</p>
                      <p className="mt-1 break-all font-mono text-small text-ink-800">
                        {pool.pool_balance != null ? String(pool.pool_balance) : "—"}
                      </p>
                    </div>
                    {poolCurrencyTrim ? (
                      <div>
                        <p className="text-meta text-ink-600">
                          {looksLikeEvmAddress(poolCurrencyTrim)
                            ? t("governance_chain_read_token_contract_caption")
                            : t("governance_chain_read_currency_field_caption")}
                        </p>
                        <p
                          className={
                            looksLikeEvmAddress(poolCurrencyTrim)
                              ? "mt-1 break-all font-mono text-small text-ink-800"
                              : "mt-1 text-body text-ink-700"
                          }
                        >
                          {poolCurrencyTrim}
                        </p>
                      </div>
                    ) : null}
                    {pool.updated_at == null ? (
                      <p className="text-meta text-ink-500">{t("governance_chain_read_no_table_updated_at")}</p>
                    ) : null}
                  </div>
                ) : poolHasBalance && poolCurrencyTrim ? (
                  <p className="text-body text-ink-700">
                    {pool?.pool_balance} {poolCurrencyTrim}
                  </p>
                ) : poolHasBalance && !poolCurrencyTrim ? (
                  <p className="text-body text-ink-700">
                    {t("governance_pool_balance_currency_unspecified", {
                      amount: String(pool?.pool_balance),
                    })}
                  </p>
                ) : pool?.data_source === "database" || pool?.data_source === "database_empty" ? (
                  <p className="text-body text-ink-500">{t("governance_pool_db_empty")}</p>
                ) : (
                  <p className="text-body text-ink-500">{t("governance_pool_placeholder")}</p>
                )}

                {showCountryPoolRootSsot ? (
                  <div
                    className="space-y-3 border-t border-ink-200/80 pt-4 dark:border-ink-700/80"
                    aria-label={t("governance_country_pool_root_section_label")}
                  >
                    <p className="text-meta font-medium text-ink-700 dark:text-ink-300">
                      {t("governance_country_pool_root_section_label")}
                    </p>
                    <p className="inline-flex rounded-[var(--radius-sm)] border border-travel-500/30 bg-travel-500/10 px-2 py-1 text-small font-medium text-travel-700 dark:border-travel-400/35 dark:bg-travel-400/15 dark:text-travel-200">
                      {t("governance_chain_read_ssot_badge")}
                    </p>
                    <div>
                      <p className="text-meta text-ink-600">{t("governance_country_pool_root_raw_value_caption")}</p>
                      <p className="mt-1 break-all font-mono text-small text-ink-800">
                        {pool.country_pool}
                      </p>
                    </div>
                    {poolCurrencyTrim && looksLikeEvmAddress(poolCurrencyTrim) ? (
                      <div>
                        <p className="text-meta text-ink-600">{t("governance_country_pool_root_token_address_caption")}</p>
                        <p className="mt-1 break-all font-mono text-small text-ink-800">
                          {poolCurrencyTrim}
                        </p>
                      </div>
                    ) : null}
                    <p className="text-meta text-ink-500">{t("governance_country_pool_root_observation_hint")}</p>
                  </div>
                ) : null}

                {showTreasuryPoolRootSsot ? (
                  <div
                    className="space-y-3 border-t border-ink-200/80 pt-4 dark:border-ink-700/80"
                    aria-label={t("governance_treasury_native_root_section_label")}
                  >
                    <p className="text-meta font-medium text-ink-700 dark:text-ink-300">
                      {t("governance_treasury_native_root_section_label")}
                    </p>
                    <p className="inline-flex rounded-[var(--radius-sm)] border border-travel-500/30 bg-travel-500/10 px-2 py-1 text-small font-medium text-travel-700 dark:border-travel-400/35 dark:bg-travel-400/15 dark:text-travel-200">
                      {t("governance_chain_read_ssot_badge")}
                    </p>
                    <div>
                      <p className="text-meta text-ink-600">{t("governance_treasury_native_root_raw_wei_caption")}</p>
                      <p className="mt-1 break-all font-mono text-small text-ink-800">
                        {pool.treasury_pool}
                      </p>
                    </div>
                    <p className="text-meta text-ink-500">{t("governance_treasury_native_root_observation_hint")}</p>
                  </div>
                ) : null}

                {showTreasuryErc20PoolRootSsot ? (
                  <div
                    className="space-y-3 border-t border-ink-200/80 pt-4 dark:border-ink-700/80"
                    aria-label={t("governance_treasury_erc20_root_section_label")}
                  >
                    <p className="text-meta font-medium text-ink-700 dark:text-ink-300">
                      {t("governance_treasury_erc20_root_section_label")}
                    </p>
                    <p className="inline-flex rounded-[var(--radius-sm)] border border-travel-500/30 bg-travel-500/10 px-2 py-1 text-small font-medium text-travel-700 dark:border-travel-400/35 dark:bg-travel-400/15 dark:text-travel-200">
                      {t("governance_chain_read_ssot_badge")}
                    </p>
                    <div>
                      <p className="text-meta text-ink-600">{t("governance_treasury_erc20_root_raw_value_caption")}</p>
                      <p className="mt-1 break-all font-mono text-small text-ink-800">
                        {pool.treasury_erc20_pool}
                      </p>
                    </div>
                    {poolCurrencyTrim && looksLikeEvmAddress(poolCurrencyTrim) ? (
                      <div>
                        <p className="text-meta text-ink-600">{t("governance_treasury_erc20_root_token_address_caption")}</p>
                        <p className="mt-1 break-all font-mono text-small text-ink-800">
                          {poolCurrencyTrim}
                        </p>
                      </div>
                    ) : null}
                    <p className="text-meta text-ink-500">{t("governance_treasury_erc20_root_observation_hint")}</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-h4 font-medium text-ink-800">{t("governance_rewards_label")}</h2>
            {rewardsHttpError ? (
              <div className="mt-1">
                <ApiErrorAlert message={rewardsHttpError} />
              </div>
            ) : rewards?.items && rewards.items.length > 0 ? (
              <ul className="mt-1 list-disc pl-5 text-body text-ink-700">
                {(rewards.items as unknown[]).map((item, i) => {
                  const o = item && typeof item === "object" ? (item as { id?: string }) : null;
                  return (
                    <li key={o?.id ?? i}>{governanceRewardListItemLine(item, t)}</li>
                  );
                })}
              </ul>
            ) : rewards?.data_source === "placeholder" ? (
              <p className="mt-1 text-body text-ink-500">{t("governance_rewards_placeholder")}</p>
            ) : (
              <p className="mt-1 text-body text-ink-500">{t("governance_rewards_empty")}</p>
            )}
          </div>
        </section>
      )}

      <nav className="mt-8 flex flex-wrap gap-4" aria-label={t("governance_nav_label")}>
        <Link
          href="/governance/delegate"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 underline-offset-2 transition-colors motion-reduce:transition-none hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_delegate_nav")}
        </Link>
        <Link
          href="/governance/proposals"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 underline-offset-2 transition-colors motion-reduce:transition-none hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_proposals_title")}
        </Link>
        <Link
          href="/governance/fee-routes"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 underline-offset-2 transition-colors motion-reduce:transition-none hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_fee_routes_title")}
        </Link>
        <Link
          href="/governance/vault-forwards"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 underline-offset-2 transition-colors motion-reduce:transition-none hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_vault_forwards_title")}
        </Link>
        <Link
          href="/governance/distribution-accruals"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 underline-offset-2 transition-colors motion-reduce:transition-none hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_distribution_accruals_title")}
        </Link>
        <Link
          href="/governance/distribution-claim"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 underline-offset-2 transition-colors motion-reduce:transition-none hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_claim_title")}
        </Link>
        <Link
          href="/traveltrust#fee-router"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 underline-offset-2 transition-colors motion-reduce:transition-none hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("traveltrust_link_feeRouter")}
        </Link>
        <GovernanceOpsAdminLinks />
        <Link
          href="/help"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 underline-offset-2 transition-colors motion-reduce:transition-none hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("help_title")}
        </Link>
        <Link
          href="/governance/params"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 underline-offset-2 transition-colors motion-reduce:transition-none hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_params_title")}
        </Link>
        <Link
          href="/"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 underline-offset-2 transition-colors motion-reduce:transition-none hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_backHome")}
        </Link>
        <Link
          href="/disputes"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 underline-offset-2 transition-colors motion-reduce:transition-none hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_disputes")}
        </Link>
      </nav>

      <ProductCrossNav
        ariaLabelKey="governance_subpage_relatedNav_aria"
        showGuides
        className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-500"
      />
    </main>
  );
}
