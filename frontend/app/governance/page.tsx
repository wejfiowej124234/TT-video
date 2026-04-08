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
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** 13-1 表 2：治理页（治理者/仲裁员权限）；50-G1 前端已对接 pool/rewards API。51-H2：治理池/奖励为占位数据，待产品定稿后替换真实数据。 */
type PoolRes = {
  status: string;
  pool_balance?: string | number | null;
  currency?: string | null;
  updated_at?: string | null;
  data_source?: string;
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

const GOV_POOL_CHAIN_READ_COPY = {
  zh: {
    ssotBadge: "链上 SSOT",
    rawBalanceCaption: "链上原始余额（uint256 hex，非人类可读金额）",
    tokenContractCaption: "SSOT 代币合约地址",
    currencyOtherCaption: "币种字段",
    noTableUpdatedAt: "链上读取，无表更新时间",
  },
  en: {
    ssotBadge: "On-chain SSOT",
    rawBalanceCaption: "On-chain raw balance (uint256 hex; not a human-formatted amount)",
    tokenContractCaption: "SSOT token contract address",
    currencyOtherCaption: "Currency field",
    noTableUpdatedAt: "Chain read; no database row timestamp",
  },
} as const;

/** 仅认响应根级 `country_pool*`；**不**使用 `chain_alignment_hint.ssot_parallel_chain_snapshot.region_vault_erc20_balance_read`。 */
const GOV_COUNTRY_POOL_ROOT_SSOT_COPY = {
  zh: {
    sectionLabel: "国家池（根级链上读）",
    rawValueCaption: "链上原始值、非人类金额",
    tokenAddressCaption: "SSOT 代币合约地址",
    notObservationHint:
      "展示以根字段 country_pool / country_pool_data_source / country_pool_is_chain_ssot 为准；请勿与 chain_alignment_hint 内 region_vault_erc20_balance_read 观测腿混读。",
  },
  en: {
    sectionLabel: "Country pool (root on-chain read)",
    rawValueCaption: "On-chain raw value; not a human-readable amount",
    tokenAddressCaption: "SSOT token contract address",
    notObservationHint:
      "Use root keys country_pool / country_pool_data_source / country_pool_is_chain_ssot; do not treat chain_alignment_hint.region_vault_erc20_balance_read as the main display source.",
  },
} as const;

/** 仅认响应根级 `treasury_erc20_pool*`；**不**使用 `chain_alignment_hint.ssot_parallel_chain_snapshot` 内观测腿混读主展示。 */
const GOV_TREASURY_ERC20_POOL_ROOT_SSOT_COPY = {
  zh: {
    sectionLabel: "金库 ERC20 池（根级链上读）",
    rawValueCaption: "链上原始值、非人类金额",
    tokenAddressCaption: "SSOT 代币合约地址",
    notObservationHint:
      "展示以根字段 treasury_erc20_pool / treasury_erc20_pool_data_source / treasury_erc20_pool_is_chain_ssot 为准；请勿与 chain_alignment_hint 内并行观测腿混读。",
  },
  en: {
    sectionLabel: "Treasury ERC20 pool (root on-chain read)",
    rawValueCaption: "On-chain raw value; not a human-readable amount",
    tokenAddressCaption: "SSOT token contract address",
    notObservationHint:
      "Use root keys treasury_erc20_pool / treasury_erc20_pool_data_source / treasury_erc20_pool_is_chain_ssot; do not mix with observation legs inside chain_alignment_hint.",
  },
} as const;

/** 仅认响应根级 `treasury_pool*`；**不**使用 `chain_alignment_hint.ssot_parallel_chain_snapshot.governance_treasury_native_balance_read`。 */
const GOV_TREASURY_POOL_ROOT_SSOT_COPY = {
  zh: {
    sectionLabel: "金库池（根级链上读 · 原生 Wei）",
    rawWeiHexCaption: "链上原始值、非人类金额",
    notObservationHint:
      "展示以根字段 treasury_pool / treasury_pool_data_source / treasury_pool_is_chain_ssot 为准；请勿与 chain_alignment_hint.ssot_parallel_chain_snapshot.governance_treasury_native_balance_read 观测腿混读。",
  },
  en: {
    sectionLabel: "Treasury pool (root on-chain read · native Wei)",
    rawWeiHexCaption: "On-chain raw Wei (hex); not a human-readable amount",
    notObservationHint:
      "Use root keys treasury_pool / treasury_pool_data_source / treasury_pool_is_chain_ssot; do not treat chain_alignment_hint.ssot_parallel_chain_snapshot.governance_treasury_native_balance_read as the main display source.",
  },
} as const;

function looksLikeEvmAddress(s: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(s.trim());
}

function governancePoolIsChainReadRow(p: PoolRes | null): p is PoolRes & { data_source: "chain_read" } {
  return p != null && p.data_source === "chain_read";
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
  t: (k: string) => string,
  which: "pool" | "rewards",
  status: number,
  body: unknown
): string {
  const key = which === "pool" ? "governance_pool_http_error" : "governance_rewards_http_error";
  const base = t(key).replace("{{status}}", String(status));
  const detail = governanceHttpErrorDetail(body);
  return detail ? `${base} — ${detail}` : base;
}

/** GET /governance/rewards 列表项：与后端 `amount` + `currency` 字段对齐（currency 可空） */
function governanceRewardListItemLine(item: unknown, t: (k: string) => string): string {
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
  return t("governance_rewards_amountWithoutCurrency").replace("{{amount}}", amountPart);
}

export default function GovernancePage() {
  const { t, locale } = useTranslation();
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
  const chainReadCopy = GOV_POOL_CHAIN_READ_COPY[locale === "en" ? "en" : "zh"];
  const showPoolChainSsotBadge =
    governancePoolIsChainReadRow(pool) && pool.is_chain_ssot === true;
  const showCountryPoolRootSsot = governanceCountryPoolRootChainSsot(pool);
  const showTreasuryPoolRootSsot = governanceTreasuryPoolRootChainSsot(pool);
  const showTreasuryErc20PoolRootSsot = governanceTreasuryErc20PoolRootChainSsot(pool);
  const countryPoolCopy = GOV_COUNTRY_POOL_ROOT_SSOT_COPY[locale === "en" ? "en" : "zh"];
  const treasuryPoolCopy = GOV_TREASURY_POOL_ROOT_SSOT_COPY[locale === "en" ? "en" : "zh"];
  const treasuryErc20PoolCopy = GOV_TREASURY_ERC20_POOL_ROOT_SSOT_COPY[locale === "en" ? "en" : "zh"];

  return (
    <main className="mx-auto max-w-3xl p-8" aria-labelledby={pageTitleId}>
      <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
        {t("governance_title")}
      </h1>
      <p className="mt-2 text-body text-ink-600">{t("governance_desc")}</p>
      <GovernanceTargetNotice />

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
                {governancePoolIsChainReadRow(pool) ? (
                  <div className="space-y-3">
                    {showPoolChainSsotBadge ? (
                      <p className="inline-flex rounded-[var(--radius-sm)] border border-travel-500/30 bg-travel-500/10 px-2 py-1 text-small font-medium text-travel-700 dark:border-travel-400/35 dark:bg-travel-400/15 dark:text-travel-200">
                        {chainReadCopy.ssotBadge}
                      </p>
                    ) : null}
                    <div>
                      <p className="text-meta text-ink-600">{chainReadCopy.rawBalanceCaption}</p>
                      <p className="mt-1 break-all font-mono text-small text-ink-800">
                        {pool.pool_balance != null ? String(pool.pool_balance) : "—"}
                      </p>
                    </div>
                    {poolCurrencyTrim ? (
                      <div>
                        <p className="text-meta text-ink-600">
                          {looksLikeEvmAddress(poolCurrencyTrim)
                            ? chainReadCopy.tokenContractCaption
                            : chainReadCopy.currencyOtherCaption}
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
                      <p className="text-meta text-ink-500">{chainReadCopy.noTableUpdatedAt}</p>
                    ) : null}
                  </div>
                ) : poolHasBalance && poolCurrencyTrim ? (
                  <p className="text-body text-ink-700">
                    {pool?.pool_balance} {poolCurrencyTrim}
                  </p>
                ) : poolHasBalance && !poolCurrencyTrim ? (
                  <p className="text-body text-ink-700">
                    {t("governance_pool_balance_currency_unspecified").replace(
                      "{{amount}}",
                      String(pool?.pool_balance)
                    )}
                  </p>
                ) : pool?.data_source === "database" || pool?.data_source === "database_empty" ? (
                  <p className="text-body text-ink-500">{t("governance_pool_db_empty")}</p>
                ) : (
                  <p className="text-body text-ink-500">{t("governance_pool_placeholder")}</p>
                )}

                {showCountryPoolRootSsot ? (
                  <div
                    className="space-y-3 border-t border-ink-200/80 pt-4 dark:border-ink-700/80"
                    aria-label={countryPoolCopy.sectionLabel}
                  >
                    <p className="text-meta font-medium text-ink-700 dark:text-ink-300">
                      {countryPoolCopy.sectionLabel}
                    </p>
                    <p className="inline-flex rounded-[var(--radius-sm)] border border-travel-500/30 bg-travel-500/10 px-2 py-1 text-small font-medium text-travel-700 dark:border-travel-400/35 dark:bg-travel-400/15 dark:text-travel-200">
                      {chainReadCopy.ssotBadge}
                    </p>
                    <div>
                      <p className="text-meta text-ink-600">{countryPoolCopy.rawValueCaption}</p>
                      <p className="mt-1 break-all font-mono text-small text-ink-800">
                        {pool.country_pool}
                      </p>
                    </div>
                    {poolCurrencyTrim && looksLikeEvmAddress(poolCurrencyTrim) ? (
                      <div>
                        <p className="text-meta text-ink-600">{countryPoolCopy.tokenAddressCaption}</p>
                        <p className="mt-1 break-all font-mono text-small text-ink-800">
                          {poolCurrencyTrim}
                        </p>
                      </div>
                    ) : null}
                    <p className="text-meta text-ink-500">{countryPoolCopy.notObservationHint}</p>
                  </div>
                ) : null}

                {showTreasuryPoolRootSsot ? (
                  <div
                    className="space-y-3 border-t border-ink-200/80 pt-4 dark:border-ink-700/80"
                    aria-label={treasuryPoolCopy.sectionLabel}
                  >
                    <p className="text-meta font-medium text-ink-700 dark:text-ink-300">
                      {treasuryPoolCopy.sectionLabel}
                    </p>
                    <p className="inline-flex rounded-[var(--radius-sm)] border border-travel-500/30 bg-travel-500/10 px-2 py-1 text-small font-medium text-travel-700 dark:border-travel-400/35 dark:bg-travel-400/15 dark:text-travel-200">
                      {chainReadCopy.ssotBadge}
                    </p>
                    <div>
                      <p className="text-meta text-ink-600">{treasuryPoolCopy.rawWeiHexCaption}</p>
                      <p className="mt-1 break-all font-mono text-small text-ink-800">
                        {pool.treasury_pool}
                      </p>
                    </div>
                    <p className="text-meta text-ink-500">{treasuryPoolCopy.notObservationHint}</p>
                  </div>
                ) : null}

                {showTreasuryErc20PoolRootSsot ? (
                  <div
                    className="space-y-3 border-t border-ink-200/80 pt-4 dark:border-ink-700/80"
                    aria-label={treasuryErc20PoolCopy.sectionLabel}
                  >
                    <p className="text-meta font-medium text-ink-700 dark:text-ink-300">
                      {treasuryErc20PoolCopy.sectionLabel}
                    </p>
                    <p className="inline-flex rounded-[var(--radius-sm)] border border-travel-500/30 bg-travel-500/10 px-2 py-1 text-small font-medium text-travel-700 dark:border-travel-400/35 dark:bg-travel-400/15 dark:text-travel-200">
                      {chainReadCopy.ssotBadge}
                    </p>
                    <div>
                      <p className="text-meta text-ink-600">{treasuryErc20PoolCopy.rawValueCaption}</p>
                      <p className="mt-1 break-all font-mono text-small text-ink-800">
                        {pool.treasury_erc20_pool}
                      </p>
                    </div>
                    {poolCurrencyTrim && looksLikeEvmAddress(poolCurrencyTrim) ? (
                      <div>
                        <p className="text-meta text-ink-600">{treasuryErc20PoolCopy.tokenAddressCaption}</p>
                        <p className="mt-1 break-all font-mono text-small text-ink-800">
                          {poolCurrencyTrim}
                        </p>
                      </div>
                    ) : null}
                    <p className="text-meta text-ink-500">{treasuryErc20PoolCopy.notObservationHint}</p>
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
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_delegate_nav")}
        </Link>
        <Link
          href="/governance/proposals"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_proposals_title")}
        </Link>
        <Link
          href="/governance/fee-routes"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_fee_routes_title")}
        </Link>
        <Link
          href="/governance/vault-forwards"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_vault_forwards_title")}
        </Link>
        <Link
          href="/traveltrust#fee-router"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("traveltrust_link_feeRouter")}
        </Link>
        <GovernanceOpsAdminLinks />
        <Link
          href="/help"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("help_title")}
        </Link>
        <Link
          href="/governance/params"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_params_title")}
        </Link>
        <Link
          href="/"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_backHome")}
        </Link>
        <Link
          href="/disputes"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
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
