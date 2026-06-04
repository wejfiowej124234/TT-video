"use client";

import Link from "next/link";
import { useId } from "react";

import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { useTranslation } from "@/components/LocaleProvider";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { shortEvmAddress } from "@/lib/formatEvmAddress";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { ADMIN_ORDER_DETAIL_FIELDS, formatAdminOrderDetailField } from "./adminOrderDetailPageModel";
import { useAdminOrderDetailPage } from "./useAdminOrderDetailPage";
import { ADMIN_FILTER_CARD_CLASS, ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass, adminTableInlineLinkClass } from "@/lib/adminUi";
export function AdminOrderDetailPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const { orderId, loading, error, body, order, meta, stashAdminDetailEscrowPayPrefetch } =
    useAdminOrderDetailPage();

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_order_detail_title")}
      subtitle={
        <>
          <p className="font-mono text-meta break-all">{orderId || t("admin_em_dash")}</p>
          <p className="mt-1 text-small text-ink-500">{t("admin_order_detail_subtitle")}</p>
        </>
      }
      headerAside={
        <>
          <Link href="/admin/orders" className={`${adminPageNavLinkClass()}`}>
            {t("admin_order_detail_back_list")}
          </Link>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${adminPageNavLinkClass()}`}>
            {t("admin_schema_back")}
          </Link>
        </>
      }
    >
      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <section className="mt-6 space-y-4" aria-label={t("admin_order_detail_panel_aria")}>
        {!orderId ? (
          <AdminAlertError message={t("admin_order_detail_missingId")} />
        ) : loading ? (
            <AdminListLoadingStatus message={t("admin_loading")} className="text-body text-ink-600" />
          ) : error ? (
          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
        ) : !order ? (
          <p className="text-body text-ink-600">{t("admin_em_dash")}</p>
        ) : (
          <>
            <div className={`${ADMIN_FILTER_CARD_CLASS} shadow-soft`}>
              <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
                {t("admin_order_detail_order_section")}
              </h2>
              <dl className="mt-3 grid gap-2 text-body sm:grid-cols-2">
                {ADMIN_ORDER_DETAIL_FIELDS.map(({ key, labelKey }) => {
                  const raw = order[key];
                  const isEscrow = key === "escrow_address" && typeof raw === "string" && raw.length > 0;
                  const display =
                    isEscrow ? `${shortEvmAddress(raw)} (${raw})` : formatAdminOrderDetailField(raw) || t("admin_em_dash");
                  return (
                    <div key={key} className="border-b border-ink-100 pb-2 last:border-0 sm:border-0 sm:pb-0">
                      <dt className="text-meta text-ink-500">{t(labelKey)}</dt>
                      <dd className="mt-0.5 break-all font-mono text-meta text-ink-800">{display}</dd>
                    </div>
                  );
                })}
              </dl>
              <div className="mt-4 flex flex-wrap gap-3 text-small">
                <Link
                  href={`/escrow/${encodeURIComponent(orderId)}`}
                  onClick={stashAdminDetailEscrowPayPrefetch}
                  className={`${adminTableInlineLinkClass()}`}
                >
                  {t("admin_ops_orderEscrow")}
                </Link>
                <Link
                  href={`/pay?orderId=${encodeURIComponent(orderId)}`}
                  onClick={stashAdminDetailEscrowPayPrefetch}
                  className={`${adminTableInlineLinkClass()}`}
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
    </AdminDetailPageChrome>
  );
}
