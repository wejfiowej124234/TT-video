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
  rule_version?: string;
  note?: string;
};
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
            ) : poolHasBalance && poolCurrencyTrim ? (
              <p className="mt-1 text-body text-ink-700">
                {pool?.pool_balance} {poolCurrencyTrim}
              </p>
            ) : poolHasBalance && !poolCurrencyTrim ? (
              <p className="mt-1 text-body text-ink-700">
                {t("governance_pool_balance_currency_unspecified").replace(
                  "{{amount}}",
                  String(pool?.pool_balance)
                )}
              </p>
            ) : pool?.data_source === "database" || pool?.data_source === "database_empty" ? (
              <p className="mt-1 text-body text-ink-500">{t("governance_pool_db_empty")}</p>
            ) : (
              <p className="mt-1 text-body text-ink-500">{t("governance_pool_placeholder")}</p>
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
