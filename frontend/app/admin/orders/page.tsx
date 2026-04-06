"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useId, useMemo, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { AdminMetaBuildSection, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import { shortEvmAddress } from "@/lib/formatEvmAddress";
import { stashEscrowOrderPrefetchFromAdminOrderListRow } from "@/lib/orderEscrowPrefetch";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

type AdminOrder = {
  id: string;
  state: string;
  amount: string;
  currency: string;
  tourist_id?: string;
  /** 87：与 `tourist_id` 同 UUID（`GET /api/v1/admin/orders`） */
  traveler_id?: string;
  guide_id?: string;
  created_at?: string;
  escrow_address?: string | null;
};

type AdminOrdersRes = {
  status?: string;
  items?: AdminOrder[];
  applied_filters?: Record<string, unknown>;
  meta?: unknown;
  error?: string;
};

const STATE_MAX = 64;

function clampOrderLimit(n: number): number {
  if (!Number.isFinite(n)) return 100;
  return Math.min(500, Math.max(1, Math.floor(n)));
}

function parseOrdersListQuery(sp: URLSearchParams): { limit: number; state: string } {
  const limit = clampOrderLimit(Number.parseInt(sp.get("limit") ?? "100", 10));
  const state = (sp.get("state") ?? "").trim().slice(0, STATE_MAX);
  return { limit, state };
}

function buildOrdersListPath(q: { limit: number; state: string }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(clampOrderLimit(q.limit)));
  const st = q.state.trim().slice(0, STATE_MAX);
  if (st) sp.set("state", st);
  return `/admin/orders?${sp.toString()}`;
}

/** 70：订单监管列表（GET /api/v1/admin/orders） */
function AdminOrdersPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { limit, state } = useMemo(
    () => parseOrdersListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<AdminOrder[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftState, setDraftState] = useState(state);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftState(state);
  }, [limit, state]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);

    const headers: Record<string, string> = { "x-request-id": `admin-orders-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminOrdersRes>(
      "AdminOrdersPage",
      apiUrl(
        routes.admin.orders({
          limit,
          ...(state ? { state } : {}),
        }),
      ),
      { headers },
    )
      .then(({ res, body }) => {
        if (!res.ok) {
          throw new Error(body.error || `request_failed_${res.status}`);
        }
        return body;
      })
      .then((body) => {
        setItems(Array.isArray(body.items) ? body.items : []);
        setAppliedFilters(body.applied_filters ?? null);
        setMeta(isAdminMetaRecord(body.meta) ? body.meta : null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminOrdersPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, state]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const lim = clampOrderLimit(Number.parseInt(draftLimit.trim(), 10));
    const st = draftState.trim().slice(0, STATE_MAX);
    router.push(buildOrdersListPath({ limit: lim, state: st }));
  };

  const reset = () => {
    router.push(buildOrdersListPath({ limit: 100, state: "" }));
  };

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_orders_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_orders_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_schema_back")}
          </Link>
        </div>
      </header>

      <div className="mt-5 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4">
        <form
          id="admin-orders-filter-form"
          aria-label={t("admin_orders_filters_aria")}
          aria-describedby={
            [adminListApplyResetHintId, !loading && !error && appliedFilters ? adminAppliedFiltersDescId : ""]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
        >
          <h2 className="text-body font-medium text-ink-800">{t("admin_orders_filters_title")}</h2>
          <p id={adminListApplyResetHintId} className="mt-2 text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-small text-ink-700">
              {t("admin_orders_limit_label")}
              <input
                className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 ${travelFocusRingCoreOffset2WhiteClasses}`}
                type="number"
                min={1}
                max={500}
                value={draftLimit}
                onChange={(e) => setDraftLimit(e.target.value)}
              />
            </label>
            <label className="text-small text-ink-700">
              {t("admin_orders_state_label")}
              <input
                className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 font-mono text-meta ${travelFocusRingCoreOffset2WhiteClasses}`}
                value={draftState}
                onChange={(e) => setDraftState(e.target.value)}
                placeholder={t("admin_orders_state_placeholder")}
              />
            </label>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            form="admin-orders-filter-form"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-3 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
            type="submit"
          >
            {t("admin_orders_apply")}
          </button>
          <form
            className="inline"
            aria-describedby={adminListApplyResetHintId}
            onSubmit={(e) => {
              e.preventDefault();
              reset();
            }}
          >
            <button
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-3 py-2 text-small font-medium text-ink-700 hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              type="submit"
            >
              {t("admin_orders_reset")}
            </button>
          </form>
        </div>
      </div>

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_loading")}
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
          {adminErrorUserText(error, t)}
        </p>
      )}

      {!loading && !error && appliedFilters && (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card">
          {t("admin_orders_applied")} {JSON.stringify(appliedFilters)}
        </AdminAppliedFiltersBanner>
      )}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!loading && !error && (
        <section className="mt-6 overflow-hidden rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_orders_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-4 py-3 font-medium">{t("admin_orders_colOrderId")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_orders_colState")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_orders_colAmount")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_orders_colTourist")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_orders_colGuide")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_orders_colEscrow")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_orders_colCreated")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_orders_colOps")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-ink-500" colSpan={8}>
                    {t("admin_empty_table")}
                  </td>
                </tr>
              )}
              {items.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3">{o.id}</td>
                  <td className="px-4 py-3 font-mono text-meta">{o.state}</td>
                  <td className="px-4 py-3">
                    {o.amount} {o.currency}
                  </td>
                  <td className="px-4 py-3">{o.tourist_id ?? t("admin_em_dash")}</td>
                  <td className="px-4 py-3">{o.guide_id ?? t("admin_em_dash")}</td>
                  <td className="px-4 py-3 font-mono text-meta break-all max-w-[140px]" title={o.escrow_address ?? undefined}>
                    {o.escrow_address ? shortEvmAddress(o.escrow_address) : t("admin_em_dash")}
                  </td>
                  <td className="px-4 py-3">
                    {o.created_at ? new Date(o.created_at).toLocaleString() : t("admin_em_dash")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      <Link
                        href={`/admin/orders/${encodeURIComponent(o.id)}`}
                        className={`${touchTargetLink44Classes} text-travel-600 hover:underline font-medium whitespace-nowrap ${travelFocusRingOffset2Classes}`}
                      >
                        {t("admin_ops_orderDetailAdmin")}
                      </Link>
                      <Link
                        href={`/escrow/${encodeURIComponent(o.id)}`}
                        onClick={() => stashEscrowOrderPrefetchFromAdminOrderListRow(o)}
                        className={`${touchTargetLink44Classes} text-travel-600 hover:underline font-medium whitespace-nowrap ${travelFocusRingOffset2Classes}`}
                      >
                        {t("admin_ops_orderEscrow")}
                      </Link>
                      <Link
                        href={`/pay?orderId=${encodeURIComponent(o.id)}`}
                        onClick={() => stashEscrowOrderPrefetchFromAdminOrderListRow(o)}
                        className={`${touchTargetLink44Classes} text-travel-600/90 hover:underline text-meta whitespace-nowrap ${travelFocusRingOffset2Classes}`}
                      >
                        {t("admin_ops_payHub")}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

export default function AdminOrdersPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_orders_title">
      <AdminOrdersPageInner />
    </AdminSearchParamsSuspense>
  );
}
