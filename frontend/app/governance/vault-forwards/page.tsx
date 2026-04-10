"use client";

import { type FormEvent, useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { apiUrl, routes } from "@/lib/api";
import { fetchJsonWithApiStatusLog, getAuthHeaders } from "@/lib/apiClient";
import { shortHexAddr } from "@/lib/feeRouterWiring";
import { mapApiReadError } from "@/lib/mapApiReadError";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import GovernanceTargetNotice from "@/components/governance/GovernanceTargetNotice";
import { GovernanceOpsAdminLinks } from "@/components/governance/GovernanceOpsAdminLinks";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  travelFocusRingCoreClasses,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

/** 04 §3.4 GET /api/v1/governance/vault-forwards；RegionVault RegionVaultForwarded 投影 */
type VaultForwardItem = {
  id: string;
  chain_id: number;
  block_number: number;
  log_index: number;
  tx_hash: string;
  vault_address: string;
  token_address: string;
  to_address: string;
  amount_u256_hex: string;
  inserted_at: string;
};

type VaultForwardsRes = {
  status: string;
  items?: VaultForwardItem[];
  page?: { has_more?: boolean; next_cursor?: string | null };
  note?: string;
};

type MetaJson = {
  chain?: {
    chain_id?: string;
    contracts?: {
      chain_id_configured?: number;
      region_vault_address?: string | null;
    } | null;
  };
};

const PAGE_LIMIT = 20;

function resolveConfiguredChainId(meta: MetaJson | null): number | null {
  if (!meta?.chain) return null;
  const c = meta.chain.contracts?.chain_id_configured;
  if (typeof c === "number" && Number.isFinite(c)) return c;
  const raw = meta.chain.chain_id;
  if (raw == null) return null;
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) ? n : null;
}

function governanceMetaHttpErrorDetail(body: unknown): string | null {
  if (body == null || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const m = o.message;
  const e = o.error;
  if (typeof m === "string" && m.trim()) return m.trim();
  if (typeof e === "string" && e.trim()) return e.trim();
  return null;
}

function governanceMetaHttpErrorLine(status: number, body: unknown, t: (k: string) => string): string {
  const base = t("governance_meta_http_error").replace("{{status}}", String(status));
  const detail = governanceMetaHttpErrorDetail(body);
  return detail ? `${base} — ${detail}` : base;
}

export default function GovernanceVaultForwardsPage() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const governanceVaultForwardsLoadMoreHintId = useId();
  const [items, setItems] = useState<VaultForwardItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** B-063：分页「加载更多」失败单独条带 */
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [metaReady, setMetaReady] = useState(false);
  const [metaHttpError, setMetaHttpError] = useState<string | null>(null);
  const [configuredChainId, setConfiguredChainId] = useState<number | null>(null);
  const [scopeMetaChain, setScopeMetaChain] = useState(true);
  const [metaVaultRaw, setMetaVaultRaw] = useState<string | null>(null);
  const [metaContractsLoaded, setMetaContractsLoaded] = useState(false);

  const effectiveChainId =
    metaReady && scopeMetaChain && configuredChainId != null ? configuredChainId : undefined;

  const fetchPage = useCallback(
    async (cursor: string | null, append: boolean, chainId: number | undefined) => {
      const headers: Record<string, string> = { "x-request-id": `vault-forwards-${Date.now()}` };
      try {
        Object.assign(headers, getAuthHeaders());
      } catch {
        /* optional auth */
      }
      const q = new URLSearchParams({ limit: String(PAGE_LIMIT) });
      if (cursor) q.set("cursor", cursor);
      if (chainId !== undefined) q.set("chain_id", String(chainId));
      const { res, body: data } = await fetchJsonWithApiStatusLog<VaultForwardsRes>(
        "governanceVaultForwards",
        apiUrl(`${routes.governanceVaultForwards}?${q}`),
        { headers }
      );
      if (!res.ok) {
        throw new Error(t("governance_requestFailed"));
      }
      const batch = data.items ?? [];
      if (append) {
        setItems((prev) => [...prev, ...batch]);
      } else {
        setItems(batch);
      }
      setHasMore(Boolean(data.page?.has_more));
      setNextCursor(data.page?.next_cursor ?? null);
      setNote(typeof data.note === "string" ? data.note : null);
    },
    [t],
  );

  useEffect(() => {
    fetchJsonWithApiStatusLog<MetaJson>("GovernanceVaultForwardsPage.meta", apiUrl(routes.meta))
      .then(({ res, body }) => {
        if (!res.ok) {
          setMetaHttpError(governanceMetaHttpErrorLine(res.status, body, t));
          setMetaContractsLoaded(false);
          setMetaVaultRaw(null);
          setConfiguredChainId(null);
          setScopeMetaChain(false);
          return;
        }
        setMetaHttpError(null);
        const b = body as MetaJson;
        const contracts = b?.chain?.contracts;
        setMetaContractsLoaded(contracts != null && typeof contracts === "object");
        const rv = contracts?.region_vault_address?.trim();
        setMetaVaultRaw(rv && rv.length > 0 ? rv : null);
        const id = resolveConfiguredChainId(b);
        setConfiguredChainId(id);
        setScopeMetaChain(id != null);
      })
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("GovernanceVaultForwardsPage meta fetch:", err);
        }
        setMetaHttpError(mapApiReadError(err, t, "governance_requestFailed"));
        setMetaVaultRaw(null);
        setMetaContractsLoaded(false);
        setConfiguredChainId(null);
        setScopeMetaChain(false);
      })
      .finally(() => setMetaReady(true));
  }, [t]);

  useEffect(() => {
    if (!metaReady) return;
    setLoading(true);
    setError(null);
    setLoadMoreError(null);
    fetchPage(null, false, effectiveChainId)
      .catch((e) => {
        if (typeof window !== "undefined") {
          console.error("GovernanceVaultForwardsPage initial:", e);
        }
        setError(mapApiReadError(e, t, "governance_requestFailed"));
      })
      .finally(() => setLoading(false));
  }, [metaReady, effectiveChainId, fetchPage, t]);

  const onLoadMore = () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setLoadMoreError(null);
    fetchPage(nextCursor, true, effectiveChainId)
      .catch((e) => {
        if (typeof window !== "undefined") {
          console.error("GovernanceVaultForwardsPage loadMore:", e);
        }
        setLoadMoreError(mapApiReadError(e, t, "governance_requestFailed"));
      })
      .finally(() => setLoadingMore(false));
  };

  return (
    <main className="mx-auto max-w-6xl p-8" aria-labelledby={pageTitleId}>
      <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
        {t("governance_vault_forwards_title")}
      </h1>
      <p className="mt-2 max-w-3xl text-body text-ink-600">{t("governance_vault_forwards_desc")}</p>
      <GovernanceTargetNotice className="mt-3 max-w-3xl" />

      {metaReady && metaHttpError ? (
        <p className="mt-4 text-body text-danger" role="alert">
          {metaHttpError}
        </p>
      ) : null}

      {metaReady && !metaHttpError && (
        <section
          className="mt-4 rounded-[var(--radius-md)] border border-ink-200 bg-ink-50/60 p-4 text-small"
          aria-label={t("governance_vault_forwards_wiring_title")}
        >
          <h2 className="text-body font-semibold text-ink-900">{t("governance_vault_forwards_wiring_title")}</h2>
          <p className="mt-1 text-meta text-ink-600">{t("governance_vault_forwards_wiring_lead")}</p>
          <dl className="mt-3 space-y-2 text-ink-800">
            <div>
              <dt className="text-meta font-medium text-ink-600">{t("governance_vault_forwards_wiring_api")}</dt>
              <dd className="mt-0.5 break-all font-mono text-meta">
                {!metaContractsLoaded
                  ? t("governance_fee_routes_wiring_contracts_absent")
                  : metaVaultRaw || t("governance_fee_routes_wiring_none")}
              </dd>
            </div>
          </dl>
        </section>
      )}

      {metaReady && !metaHttpError && (
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t("governance_fee_routes_filter_group")}>
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              setScopeMetaChain(true);
            }}
          >
            <button
              type="submit"
              disabled={configuredChainId == null}
              className={`rounded-[var(--radius-sm)] border px-3 py-1.5 text-small font-medium transition ${
                scopeMetaChain && configuredChainId != null
                  ? "border-travel-500 bg-travel-500/10 text-travel-700"
                  : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40"
              }`}
            >
              {configuredChainId != null
                ? t("governance_fee_routes_filter_meta").replace("{{id}}", String(configuredChainId))
                : t("governance_fee_routes_filter_meta_unknown")}
            </button>
          </form>
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              setScopeMetaChain(false);
            }}
          >
            <button
              type="submit"
              className={`rounded-[var(--radius-sm)] border px-3 py-1.5 text-small font-medium transition ${
                !scopeMetaChain || configuredChainId == null
                  ? "border-travel-500 bg-travel-500/10 text-travel-700"
                  : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
              }`}
            >
              {t("governance_fee_routes_filter_all")}
            </button>
          </form>
        </div>
      )}

      {loading && (
        <p className="mt-4 text-body text-ink-500" role="status">
          {t("common_loading")}
        </p>
      )}
      {error && (
        <p className="mt-4 text-body text-danger" role="alert">
          {error}
        </p>
      )}
      {note && !loading && (
        <p className="mt-4 rounded-[var(--radius-md)] border border-warning/25 bg-warning/10 px-3 py-2 text-small text-ink-800">
          {t("governance_fee_routes_note_prefix")} {note}
        </p>
      )}

      {!loading && !error && items.length === 0 && !note && (
        <p className="mt-6 text-body text-ink-500">{t("governance_vault_forwards_empty")}</p>
      )}

      {!loading && items.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-[var(--radius-md)] border border-ink-200">
          <table className="min-w-full border-collapse text-left text-small">
            <thead className="bg-ink-50 text-meta font-medium uppercase tracking-wide text-ink-600">
              <tr>
                <th className="whitespace-nowrap px-3 py-2">{t("governance_fee_routes_col_block")}</th>
                <th className="whitespace-nowrap px-3 py-2">{t("governance_fee_routes_col_tx")}</th>
                <th className="whitespace-nowrap px-3 py-2">{t("governance_vault_forwards_col_vault")}</th>
                <th className="whitespace-nowrap px-3 py-2">{t("governance_fee_routes_col_token")}</th>
                <th className="whitespace-nowrap px-3 py-2">{t("governance_vault_forwards_col_to")}</th>
                <th className="whitespace-nowrap px-3 py-2">{t("governance_fee_routes_col_amount")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 font-mono text-meta text-ink-800">
              {items.map((row) => (
                <tr key={row.id} className="hover:bg-ink-50">
                  <td className="whitespace-nowrap px-3 py-2" title={`#${row.block_number} log ${row.log_index}`}>
                    {row.block_number}
                    <span className="text-ink-500">:{row.log_index}</span>
                  </td>
                  <td className="max-w-[8rem] truncate px-3 py-2" title={row.tx_hash}>
                    {shortHexAddr(row.tx_hash)}
                  </td>
                  <td className="max-w-[8rem] truncate px-3 py-2" title={row.vault_address}>
                    {shortHexAddr(row.vault_address)}
                  </td>
                  <td className="max-w-[8rem] truncate px-3 py-2" title={row.token_address}>
                    {shortHexAddr(row.token_address)}
                  </td>
                  <td className="max-w-[8rem] truncate px-3 py-2" title={row.to_address}>
                    {shortHexAddr(row.to_address)}
                  </td>
                  <td className="max-w-[7rem] truncate px-3 py-2" title={row.amount_u256_hex}>
                    {shortHexAddr(row.amount_u256_hex, 4, 4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && nextCursor && (
        <div className="mt-6">
          {loadMoreError ? (
            <div className="mb-4 max-w-2xl space-y-2" role="alert" aria-live="polite">
              <ApiErrorAlert message={loadMoreError} />
              <div className="flex flex-wrap gap-2">
                <form
                  className="inline"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    if (loadingMore) return;
                    onLoadMore();
                  }}
                >
                  <button
                    type="submit"
                    disabled={loadingMore}
                    aria-busy={loadingMore ? true : undefined}
                    aria-label={t("common_retry")}
                    className={`${travelFocusRingCoreOffset2Classes} inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-offset-bg-console`}
                  >
                    {loadingMore ? t("common_retrying") : t("common_retry")}
                  </button>
                </form>
                <form
                  className="inline"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    setLoadMoreError(null);
                  }}
                >
                  <button
                    type="submit"
                    className={`btn-console rounded-[var(--radius-sm)] border border-ink-300 px-3 py-2 text-meta text-ink-700 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
                    aria-label={t("common_closeAlert")}
                  >
                    {t("common_closeAlert")}
                  </button>
                </form>
              </div>
            </div>
          ) : null}
          <p id={governanceVaultForwardsLoadMoreHintId} className="mb-2 max-w-2xl text-meta text-ink-600">
            {t("governance_public_load_more_hint")}
          </p>
          <form
            className="inline"
            aria-describedby={governanceVaultForwardsLoadMoreHintId}
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              onLoadMore();
            }}
          >
            <button
              type="submit"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-ink-300 bg-white px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50 ${travelFocusRingCoreClasses}`}
              disabled={loadingMore}
              aria-busy={loadingMore ? true : undefined}
            >
              {loadingMore ? t("common_loading") : t("governance_fee_routes_load_more")}
            </button>
          </form>
        </div>
      )}

      <nav className="mt-10 flex flex-wrap gap-4" aria-label={t("governance_nav_label")}>
        <Link
          href="/governance"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_title")}
        </Link>
        <Link
          href="/governance/fee-routes"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_fee_routes_title")}
        </Link>
        <Link
          href="/governance/distribution-accruals"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_distribution_accruals_title")}
        </Link>
        <Link
          href="/governance/proposals"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_proposals_title")}
        </Link>
        <Link
          href="/governance/params"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_params_title")}
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
          href="/"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_backHome")}
        </Link>
      </nav>
      <ProductCrossNav
        ariaLabelKey="governance_subpage_relatedNav_aria"
        showGuides
        className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-500"
      />
    </main>
  );
}
