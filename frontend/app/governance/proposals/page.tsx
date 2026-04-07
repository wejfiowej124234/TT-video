"use client";

import { type FormEvent, useEffect, useId, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { apiUrl, routes } from "@/lib/api";
import { fetchJsonWithApiStatusLog } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import LoadingText from "@/components/LoadingText";
import GovernanceTargetNotice from "@/components/governance/GovernanceTargetNotice";
import GovernanceB090OnChainProposalNotice from "@/components/governance/GovernanceB090OnChainProposalNotice";
import { getMeta } from "@/lib/apiClient";
import { governorAddressFromMeta } from "@/lib/governanceChainMeta";
import { GovernanceOpsAdminLinks } from "@/components/governance/GovernanceOpsAdminLinks";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

type ProposalItem = { id?: string; title?: string; [key: string]: unknown };

type ProposalsRes = {
  status?: string;
  items?: unknown;
  note?: string;
  data_source?: string;
  chain_id?: number;
};

/** 13-1 / B-064：首屏 GET 列表；失败 ApiErrorAlert + 重试；空列表与错误态文案分离 */
export default function GovernanceProposalsPage() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const listSectionId = useId();
  const [items, setItems] = useState<ProposalItem[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [metaGovernor, setMetaGovernor] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const headers: Record<string, string> = { "x-request-id": `gov-proposals-${Date.now()}` };
    fetchJsonWithApiStatusLog<ProposalsRes>("governanceProposals", apiUrl(routes.governanceProposals), {
      headers,
    })
      .then(({ res, body: j }) => {
        if (!res.ok) throw new Error(String(res.status));
        if (j == null || typeof j !== "object") throw new Error("invalid");
        const o = j as ProposalsRes;
        if (o.status !== "ok") throw new Error(String(o.status ?? "bad_status"));
        if (!Array.isArray(o.items)) throw new Error("invalid_items");
        return {
          items: o.items as ProposalItem[],
          note: typeof o.note === "string" ? o.note : null,
          data_source: typeof o.data_source === "string" ? o.data_source : null,
          chain_id: typeof o.chain_id === "number" && Number.isFinite(o.chain_id) ? o.chain_id : null,
        };
      })
      .then(({ items: next, note: n, data_source: ds, chain_id: cid }) => {
        if (cancelled) return;
        setItems(next);
        setNote(n);
        setDataSource(ds);
        setChainId(cid);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        if (typeof window !== "undefined") {
          console.error("GovernanceProposalsPage fetch:", err);
        }
        setItems(null);
        setNote(null);
        setDataSource(null);
        setChainId(null);
        setError(mapApiReadError(err, t, "governance_proposals_loadFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t, retryTick]);

  useEffect(() => {
    if (dataSource !== "governance_proposals_projection") {
      setMetaGovernor(null);
      return undefined;
    }
    let cancelled = false;
    getMeta()
      .then((m) => {
        if (cancelled) return;
        setMetaGovernor(governorAddressFromMeta(m));
      })
      .catch(() => {
        if (!cancelled) setMetaGovernor(null);
      });
    return () => {
      cancelled = true;
    };
  }, [dataSource, retryTick]);

  const emptySuccess = !loading && !error && items !== null && items.length === 0;
  const showOnChainPanel = !loading && !error && dataSource === "governance_proposals_projection";

  return (
    <main className="mx-auto max-w-3xl p-8" aria-labelledby={pageTitleId}>
      <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
        {t("governance_proposals_title")}
      </h1>
      <p className="mt-2 text-body text-ink-600">{t("governance_proposals_intro")}</p>
      <GovernanceTargetNotice className="mt-4" />

      {showOnChainPanel ? (
        <div className="mt-6">
          <GovernanceB090OnChainProposalNotice
            variant="list"
            chainId={chainId}
            governorAddress={metaGovernor}
          />
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6">
          <LoadingText />
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 space-y-2">
          <ApiErrorAlert message={error} />
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (loading) return;
              setRetryTick((n) => n + 1);
            }}
          >
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading ? true : undefined}
              aria-label={t("common_retry")}
              className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-white`}
            >
              {loading ? t("common_retrying") : t("common_retry")}
            </button>
          </form>
        </div>
      ) : null}

      {!loading && !error && emptySuccess ? (
        <section className="mt-6 rounded-[var(--radius-md)] border border-ink-200/80 bg-ink-50/60 p-4 dark:border-ink-600/40 dark:bg-ink-900/30">
          <h2 className="text-small font-semibold text-ink-800 dark:text-ink-100">
            {t("governance_proposals_empty_title")}
          </h2>
          <p className="mt-2 text-body text-ink-700 dark:text-ink-200">{t("governance_proposals_empty_body")}</p>
          {note ? (
            <p className="mt-2 text-meta text-ink-600 dark:text-ink-400" role="note">
              {note}
            </p>
          ) : null}
        </section>
      ) : null}

      {!loading && !error && items !== null && items.length > 0 ? (
        <section className="mt-6" aria-labelledby={listSectionId}>
          <h2 id={listSectionId} className="sr-only">
            {t("governance_proposals_list_heading")}
          </h2>
          {note ? <p className="mb-3 text-meta text-ink-600">{note}</p> : null}
          <ul className="divide-y divide-ink-200 rounded-[var(--radius-md)] border border-ink-200">
            {items.map((p, i) => {
              const key = typeof p.id === "string" && p.id.trim() ? p.id : `proposal-${i}`;
              const title =
                typeof p.title === "string" && p.title.trim()
                  ? p.title
                  : t("governance_proposals_item_untitled");
              const href = `/governance/proposals/${encodeURIComponent(String(p.id))}`;
              return (
                <li key={key} className="px-4 py-3 text-body text-ink-800">
                  {typeof p.id === "string" && p.id.trim() ? (
                    <Link
                      href={href}
                      className={`font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
                    >
                      {title}
                    </Link>
                  ) : (
                    title
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <nav className="mt-8 flex flex-wrap gap-4" aria-label={t("governance_nav_label")}>
        <Link
          href="/governance"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_title")}
        </Link>
        <Link
          href="/governance/delegate"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_delegate_nav")}
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
      </nav>
      <ProductCrossNav
        ariaLabelKey="governance_subpage_relatedNav_aria"
        showGuides
        className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-500"
      />
    </main>
  );
}
