"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminOnboardingDualLedgerNavStrip } from "@/components/admin/AdminOnboardingDualLedgerNavStrip";
import { AdminOnboardingPaymentEventsStripeEchoStrip } from "@/components/admin/AdminOnboardingPaymentEventsStripeEchoStrip";
import { AdminOnboardingWebhookStripeEchoStrip } from "@/components/admin/AdminOnboardingWebhookStripeEchoStrip";
import { AdminPageAccessBadge } from "@/components/admin/AdminPageAccessBadge";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminOnboardingHubBackLinks } from "@/components/admin/AdminOnboardingHubBackLinks";
import { AdminSubpageBreadcrumb } from "@/components/admin/AdminSubpageBreadcrumb";
import { extractWebhookStripeEcho } from "@/lib/admin/adminOnboardingWebhookStripeEcho";
import { ADMIN_EMPTY_NEXT_ONBOARDING_LIST_EMPTY } from "@/lib/admin/adminListEmptyStateNextLinks";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { fetchAdminQueueList } from "@/lib/admin/fetchAdminQueueList";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import {
  ADMIN_ATTENTION_CALLOUT_CLASS,
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_INLINE_LINK_CLASS,
  ADMIN_LIST_PAGE_BODY_CANVAS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_SECTION_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  TT_ADMIN_PAGE_INNER_DETAIL,
  ADMIN_INNER_DIVIDER_CLASS,} from "@/lib/adminUi";

function stripeEchoCell(row: Record<string, unknown>): string {
  const echo = extractWebhookStripeEcho(row);
  if (!echo.eventType && !echo.providerEventId) return "—";
  return [echo.eventType, echo.providerEventId].filter(Boolean).join(" · ");
}

export function AdminOnboardingListPage(props: {
  titleKey: string;
  subtitleKey: string;
  listUrl: string;
  fetchContext: string;
  columns: { key: string; labelKey: string }[];
  /** 若提供，则 `id` 列链到详情页 */
  detailHref?: (row: Record<string, unknown>) => string | null;
  /** ONB-04 · 展示 Stripe payload 回显列 + 台账横幅 */
  webhookStripeEcho?: boolean;
  /** ONB-04 · 仅表格 Stripe 回显列（payment-events 等） */
  stripeEchoColumn?: boolean;
}) {
  const { t } = useTranslation();
  const titleId = useId();
  const {
    titleKey,
    subtitleKey,
    listUrl,
    fetchContext,
    columns,
    detailHref,
    webhookStripeEcho,
    stripeEchoColumn,
  } = props;
  const showStripeEchoColumn = Boolean(webhookStripeEcho || stripeEchoColumn);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<Record<string, unknown>[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { items: rows, errorKind } = await fetchAdminQueueList<{ items?: Record<string, unknown>[] }>(
      fetchContext,
      listUrl,
    );
    if (errorKind) {
      setError(errorKind);
      setItems([]);
    } else {
      setItems((rows as Record<string, unknown>[]) ?? []);
    }
    setLoading(false);
  }, [fetchContext, listUrl]);

  useEffect(() => {
    void load();
  }, [load]);

  const cell = (row: Record<string, unknown>, key: string): string => {
    const v = row[key];
    if (v == null) return "—";
    if (typeof v === "object") return JSON.stringify(v).slice(0, 80);
    return String(v);
  };

  return (
    <main
      className={TT_ADMIN_PAGE_INNER_DETAIL}
      aria-labelledby={titleId}
      data-tt-admin-onboarding-list="1"
      data-tt-admin-onboarding-webhook-jobs={webhookStripeEcho ? "1" : undefined}
    >
      <AdminSubpageBreadcrumb />
      <AdminWarmL5Surface
        as="header"
        innerClassName="flex flex-wrap items-start justify-between gap-3"
        data-tt-admin-onboarding-list-header="1"
      >
        <div>
          <h1 id={titleId} className="text-h3 font-semibold text-ink-900">
            {t(titleKey)}
          </h1>
          <p className="mt-2 max-w-2xl text-body text-ink-600">{t(subtitleKey)}</p>
          <p className="mt-2">
            <AdminPageAccessBadge writePermissionId={ADMIN_PERM.ONBOARDING_WRITE} />
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <AdminOnboardingHubBackLinks />
        </div>
      </AdminWarmL5Surface>

      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.ONBOARDING_READ}
        messageKey="admin_perm_denied_onboarding_read"
        className={`mt-4 ${ADMIN_ATTENTION_CALLOUT_CLASS}`}
      />

      <div
        className={ADMIN_LIST_PAGE_BODY_CANVAS_CLASS}
        data-tt-admin-onboarding-list-body-canvas="1"
      >
        {webhookStripeEcho || stripeEchoColumn ? <AdminOnboardingDualLedgerNavStrip /> : null}
        {webhookStripeEcho ? <AdminOnboardingWebhookStripeEchoStrip /> : null}
        {stripeEchoColumn && !webhookStripeEcho ? <AdminOnboardingPaymentEventsStripeEchoStrip /> : null}

        <div className={ADMIN_FILTER_CARD_CLASS}>
          <button
            type="button"
            className={ADMIN_PRIMARY_ACTION_BTN_CLASS}
            onClick={() => void load()}
          >
            {t("admin_provider_list_refresh")}
          </button>
        </div>

        {error ? (
          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
        ) : null}
        {loading ? <AdminListLoadingStatus message={t("admin_home_inbox_loading")} /> : null}

        {!loading && !error && items.length === 0 ? (
          <AdminListPageEmptyState
            messageKey="admin_onb_list_empty"
            nextLinks={ADMIN_EMPTY_NEXT_ONBOARDING_LIST_EMPTY}
          />
        ) : null}

        {!loading && items.length > 0 ? (
          <div className={ADMIN_TABLE_SECTION_CLASS}>
            <table className="min-w-full text-left text-small" aria-label={t(titleKey)}>
              <thead className={ADMIN_TABLE_THEAD_CLASS}>
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} scope="col" className={ADMIN_TABLE_TH_CELL_CLASS}>
                      {t(c.labelKey)}
                    </th>
                  ))}
                  {showStripeEchoColumn ? (
                    <th scope="col" className={ADMIN_TABLE_TH_CELL_CLASS}>
                      {t("admin_onb_col_stripe_echo")}
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody className={ADMIN_TABLE_ROW_CLASS}>
                {items.map((row, i) => (
                  <tr key={String(row.id ?? row.job_id ?? i)} className={ADMIN_INNER_DIVIDER_CLASS}>
                    {columns.map((c) => {
                      const raw = cell(row, c.key);
                      const href = c.key === "id" && detailHref ? detailHref(row) : null;
                      return (
                        <td key={c.key} className="max-w-xs truncate px-3 py-2 font-mono text-meta">
                          {href ? (
                            <Link href={href} className={ADMIN_INLINE_LINK_CLASS}>
                              {raw}
                            </Link>
                          ) : (
                            raw
                          )}
                        </td>
                      );
                    })}
                    {showStripeEchoColumn ? (
                      <td
                        className="max-w-sm truncate px-3 py-2 font-mono text-meta"
                        data-tt-admin-onboarding-webhook-row-stripe-echo={webhookStripeEcho ? "1" : undefined}
                        data-tt-admin-onboarding-payment-stripe-echo={
                          stripeEchoColumn && !webhookStripeEcho ? "1" : undefined
                        }
                      >
                        {stripeEchoCell(row)}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </main>
  );
}
