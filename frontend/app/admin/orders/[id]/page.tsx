"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, useId, useCallback } from "react";

import { useTranslation } from "@/components/LocaleProvider";
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
import { stashEscrowOrderPrefetchFromAdminOrderDetailBody } from "@/lib/orderEscrowPrefetch";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

type AdminOrderDetailRes = {
  status?: string;
  error?: string;
  order?: Record<string, unknown>;
  itinerary?: unknown;
  meta?: unknown;
};

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/** 70：订单监管详情；与 `GET /api/v1/orders/:id` 成功响应同形（须 admin）。 */
function AdminOrderDetailPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : "";
  const orderId = decodeURIComponent(rawId.trim());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [body, setBody] = useState<AdminOrderDetailRes | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setBody(null);
      return;
    }
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `admin-order-detail-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminOrderDetailRes>(
      "AdminOrderDetailPage",
      apiUrl(routes.admin.orderById(orderId)),
      { headers },
    )
      .then(({ res, body: json }) => {
        if (!res.ok) {
          throw new Error(json.error || `request_failed_${res.status}`);
        }
        return json;
      })
      .then(setBody)
      .catch((e: unknown) => {
        logAdminFetch("AdminOrderDetailPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const order = body?.order && typeof body.order === "object" ? body.order : null;
  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;

  const stashAdminDetailEscrowPayPrefetch = useCallback(() => {
    if (!orderId || !order) return;
    stashEscrowOrderPrefetchFromAdminOrderDetailBody(orderId, order, body?.itinerary ?? null);
  }, [orderId, order, body?.itinerary]);

  return (
    <main className="mx-auto max-w-4xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_order_detail_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600 font-mono text-meta break-all">
            {orderId || t("admin_em_dash")}
          </p>
          <p className="mt-1 text-small text-ink-500">{t("admin_order_detail_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link href="/admin/orders" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_order_detail_back_list")}
          </Link>
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

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <section
        className="mt-6 space-y-4"
        aria-label={t("admin_order_detail_panel_aria")}
      >
        {!orderId ? (
          <p className="rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
            {t("admin_order_detail_missingId")}
          </p>
        ) : loading ? (
          <p className="text-body text-ink-600" role="status">
            {t("admin_loading")}
          </p>
        ) : error ? (
          <p className="rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
            {adminErrorUserText(error, t)}
          </p>
        ) : !order ? (
          <p className="text-body text-ink-600">{t("admin_em_dash")}</p>
        ) : (
          <>
            <div className="rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 shadow-soft">
              <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
                {t("admin_order_detail_order_section")}
              </h2>
              <dl className="mt-3 grid gap-2 text-body sm:grid-cols-2">
                {(
                  [
                    ["id", t("admin_orders_colOrderId")],
                    ["state", t("admin_orders_colState")],
                    ["amount", t("admin_orders_colAmount")],
                    ["currency", t("admin_order_detail_currency")],
                    ["tourist_id", t("admin_orders_colTourist")],
                    ["guide_id", t("admin_orders_colGuide")],
                    ["escrow_address", t("admin_orders_colEscrow")],
                    ["destination", t("admin_order_detail_destination")],
                    ["city", t("admin_order_detail_city")],
                    ["travel_date", t("admin_order_detail_travelDate")],
                    ["created_at", t("admin_orders_colCreated")],
                    ["accepted_at", t("admin_order_detail_acceptedAt")],
                    ["escrowed_at", t("admin_order_detail_escrowedAt")],
                    ["completed_at", t("admin_order_detail_completedAt")],
                    ["sub_status", t("admin_order_detail_subStatus")],
                  ] as const
                ).map(([key, label]) => {
                  const raw = order[key];
                  const isEscrow = key === "escrow_address" && typeof raw === "string" && raw.length > 0;
                  const display =
                    isEscrow ? `${shortEvmAddress(raw)} (${raw})` : fmt(raw) || t("admin_em_dash");
                  return (
                    <div key={key} className="border-b border-ink-100 pb-2 last:border-0 sm:border-0 sm:pb-0">
                      <dt className="text-meta text-ink-500">{label}</dt>
                      <dd className="mt-0.5 break-all font-mono text-meta text-ink-800">{display}</dd>
                    </div>
                  );
                })}
              </dl>
              <div className="mt-4 flex flex-wrap gap-3 text-small">
                <Link
                  href={`/escrow/${encodeURIComponent(orderId)}`}
                  onClick={stashAdminDetailEscrowPayPrefetch}
                  className={`${touchTargetLink44Classes} text-travel-600 hover:underline font-medium ${travelFocusRingOffset2Classes}`}
                >
                  {t("admin_ops_orderEscrow")}
                </Link>
                <Link
                  href={`/pay?orderId=${encodeURIComponent(orderId)}`}
                  onClick={stashAdminDetailEscrowPayPrefetch}
                  className={`${touchTargetLink44Classes} text-travel-600/90 hover:underline ${travelFocusRingOffset2Classes}`}
                >
                  {t("admin_ops_payHub")}
                </Link>
              </div>
            </div>

            {body?.itinerary != null ? (
              <details className="rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4">
                <summary className="cursor-pointer text-small font-medium text-ink-800">
                  {t("admin_order_detail_itinerary_toggle")}
                </summary>
                <pre className="mt-3 max-h-[min(24rem,50vh)] overflow-auto whitespace-pre-wrap break-all text-meta text-ink-700">
                  {JSON.stringify(body.itinerary, null, 2)}
                </pre>
              </details>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}

export default function AdminOrderDetailPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_order_detail_title">
      <AdminOrderDetailPageInner />
    </AdminSearchParamsSuspense>
  );
}
