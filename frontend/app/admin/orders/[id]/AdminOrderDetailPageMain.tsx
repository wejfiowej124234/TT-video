"use client";

import { AdminDetailContentPanel } from "@/components/admin/AdminDetailContentPanel";
import Link from "next/link";
import { useId } from "react";

import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { useTranslation } from "@/components/LocaleProvider";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { shortEvmAddress } from "@/lib/formatEvmAddress";
import { ADMIN_ORDER_DETAIL_FIELDS, formatAdminOrderDetailField, ORDER_DETAIL_RELATED_FOLD_LINKS } from "./adminOrderDetailPageModel";
import { useAdminOrderDetailPage } from "./useAdminOrderDetailPage";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import {
  ADMIN_DETAIL_FIELD_LABEL_CLASS,
  ADMIN_DETAIL_FIELD_ROW_CLASS,
  ADMIN_DETAIL_FIELD_VALUE_MONO_CLASS,
  ADMIN_DETAIL_SECTION_TITLE_CLASS,
  ADMIN_PAGE_CHROME_SUBTITLE_HINT_CLASS,
  ADMIN_PAGE_CHROME_SUBTITLE_ID_CLASS,
  adminPageNavLinkClass,
  adminTableRowPrimaryActionClass,
  adminTableRowSecondaryActionClass,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
} from "@/lib/adminUi";
export function AdminOrderDetailPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const { orderId, loading, refreshing, error, body, order, meta, stashAdminDetailEscrowPayPrefetch } =
    useAdminOrderDetailPage();

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_order_detail_title")}
      subtitle={
        <>
          <p className={ADMIN_PAGE_CHROME_SUBTITLE_ID_CLASS}>{orderId || t("admin_em_dash")}</p>
          <p className={ADMIN_PAGE_CHROME_SUBTITLE_HINT_CLASS}>{t("admin_order_detail_subtitle_l5")}</p>
        </>
      }
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={ORDER_DETAIL_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_order_detail_related_aria"
        foldSummaryKey="admin_order_detail_related_fold"
        dataTtFold="order-detail"
      />
      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <section className="mt-6 space-y-4" aria-label={t("admin_order_detail_panel_aria")}>
        {!orderId ? (
          <AdminAlertError message={t("admin_order_detail_missingId")} />
        ) : loading && !order ? (
            <AdminListLoadingStatus message={t("admin_loading")} className="text-body text-ink-600" />
          ) : error && !order ? (
          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
        ) : !order ? (
          <p className="text-body text-ink-600">{t("admin_em_dash")}</p>
        ) : (
          <div
            className={`space-y-4${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
            data-tt-admin-detail-refreshing={refreshing ? "1" : undefined}
          >
            <AdminDetailContentPanel>
              <h2 className={ADMIN_DETAIL_SECTION_TITLE_CLASS}>
                {t("admin_order_detail_order_section")}
              </h2>
              <dl className="mt-3 grid gap-2 text-body sm:grid-cols-2">
                {ADMIN_ORDER_DETAIL_FIELDS.map(({ key, labelKey }) => {
                  const raw = order[key];
                  const isEscrow = key === "escrow_address" && typeof raw === "string" && raw.length > 0;
                  const display =
                    isEscrow
                      ? `${shortEvmAddress(raw)} (${raw})`
                      : formatAdminOrderDetailField(key, raw) || t("admin_em_dash");
                  return (
                    <div key={key} className={`${ADMIN_DETAIL_FIELD_ROW_CLASS}`}>
                      <dt className={ADMIN_DETAIL_FIELD_LABEL_CLASS}>{t(labelKey)}</dt>
                      <dd className={ADMIN_DETAIL_FIELD_VALUE_MONO_CLASS}>{display}</dd>
                    </div>
                  );
                })}
              </dl>
              <div className="mt-4 flex flex-wrap gap-3" data-tt-admin-order-detail-actions="1">
                <Link
                  href={`/escrow/${encodeURIComponent(orderId)}`}
                  onClick={stashAdminDetailEscrowPayPrefetch}
                  className={adminTableRowPrimaryActionClass()}
                  data-tt-admin-order-detail-action-primary="escrow"
                >
                  {t("admin_ops_orderEscrow")}
                </Link>
                <Link
                  href={`/pay?orderId=${encodeURIComponent(orderId)}`}
                  onClick={stashAdminDetailEscrowPayPrefetch}
                  className={adminTableRowSecondaryActionClass()}
                  data-tt-admin-order-detail-action-secondary="pay"
                >
                  {t("admin_ops_payHub")}
                </Link>
              </div>
            </AdminDetailContentPanel>

            {body?.itinerary != null ? (
              <AdminWarmL5Surface as="details" pad="default">
                <summary className="cursor-pointer text-small font-medium text-ink-800">
                  {t("admin_order_detail_itinerary_toggle")}
                </summary>
                <pre className="mt-3 max-h-[min(24rem,50vh)] overflow-auto whitespace-pre-wrap break-all text-meta text-ink-700">
                  {JSON.stringify(body.itinerary, null, 2)}
                </pre>
              </AdminWarmL5Surface>
            ) : null}
          </div>
        )}
      </section>
    </AdminDetailPageChrome>
  );
}
