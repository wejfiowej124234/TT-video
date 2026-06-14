"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminQueueListPageChrome } from "@/components/admin/AdminQueueListPageChrome";
import {
  buildAdminQueueListPath,
  parseAdminQueueStatusQuery,
} from "@/lib/admin/adminQueueListPageModel";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { formatRelativeAge } from "@/lib/admin/formatRelativeAge";
import { sortOnboardingQueueItems, type OnboardingQueueSortKey } from "@/lib/admin/sortOnboardingQueueItems";
import { useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminStandardListSection } from "@/components/admin/AdminStandardListSection";
import { AdminOnboardingQueueSortToolbar } from "@/components/admin/AdminOnboardingQueueSortToolbar";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_QUEUE_LIST_ROW_CARD_CLASS,
  adminTableRowPrimaryActionClass,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_FILTER_FIELD_LABEL_CLASS,
} from "@/lib/adminUi";
import { useAdminGuideApplicationsPage } from "./useAdminGuideApplicationsPage";

const DEFAULT_STATUS = "pending";
const BASE_PATH = "/admin/guide-applications";

export function AdminGuideApplicationsPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = useMemo(
    () => parseAdminQueueStatusQuery(new URLSearchParams(searchParams.toString()), DEFAULT_STATUS),
    [searchParams],
  );

  const { items, loading, refreshing, error, staleWhileError, bumpReload } =
    useAdminGuideApplicationsPage(statusFilter);
  const onStatusChange = (next: string) => {
    router.push(buildAdminQueueListPath(BASE_PATH, next));
  };

  const { sort, toggle } = useAdminTableSort<OnboardingQueueSortKey>("submitted_at", "desc");
  const sortedItems = useMemo(
    () => sortOnboardingQueueItems(items, sort.key, sort.dir),
    [items, sort.key, sort.dir],
  );

  return (
    <AdminQueueListPageChrome
      queue="guide"
      titleId={titleId}
      titleKey="admin_guide_list_title"
      subtitleKey="admin_guide_list_subtitle_l5"
    >
      <div className={`${ADMIN_FILTER_CARD_CLASS} flex flex-wrap items-end gap-3`} data-tt-admin-queue-list-filter="guide">
        <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
          {t("admin_guide_list_filterStatus")}
          <select
            className={`mt-1 block ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="">{t("admin_guide_list_filterAll")}</option>
            <option value="pending">{t("admin_guide_list_statusPending")}</option>
            <option value="pending_review">{t("admin_guide_list_statusReviewing")}</option>
            <option value="active">{t("admin_guide_list_statusApproved")}</option>
            <option value="rejected">{t("admin_guide_list_statusRejected")}</option>
          </select>
        </label>
        <button
          type="button"
          className={ADMIN_PRIMARY_ACTION_BTN_CLASS}
          aria-label={t("admin_guide_list_refresh")}
          onClick={() => bumpReload()}
        >
          {t("admin_guide_list_refresh")}
        </button>
      </div>

      <AdminStandardListSection
        loading={loading}
        refreshing={refreshing}
        error={error}
        staleWhileError={staleWhileError}
        itemsLength={items.length}
        loadingMessage={t("admin_users_loading")}
        errorMessage={error ? adminErrorUserText(error, t) : ""}
        className={refreshing ? ADMIN_LIST_REFRESHING_SURFACE_CLASS : undefined}
        data-tt-admin-onboarding-queue-list="guide"
        data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
        empty={
          <AdminListPageEmptyState messageKey="admin_list_empty_guide" nextLinks={[]} />
        }
      >
        <>
          <AdminOnboardingQueueSortToolbar sortKey={sort.key} sortDir={sort.dir} onSelect={(key) => toggle(key)} />
          <ul className="space-y-3">
            {sortedItems.map((row) => {
              const uid = row.user_id ?? "";
              const app = row.application;
              return (
                <li key={uid} className={ADMIN_QUEUE_LIST_ROW_CARD_CLASS}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-small text-ink-800 break-all">{row.email ?? uid}</p>
                      <p className="mt-1 text-small text-ink-600">
                        {t("admin_guide_app_status")}: <span className="font-mono">{app?.status ?? "—"}</span>
                        {app?.city ? <> · {app.city}</> : null}
                        {app?.submitted_at ? (
                          <>
                            {" · "}
                            {t("admin_queue_wait_age", { age: formatRelativeAge(app.submitted_at) })}
                          </>
                        ) : null}
                      </p>
                      {app?.submitted_at ? <p className="text-meta text-ink-500">{app.submitted_at}</p> : null}
                    </div>
                    <Link
                      href={`/admin/users/${encodeURIComponent(uid)}`}
                      className={adminTableRowPrimaryActionClass()}
                      aria-label={t("admin_guide_list_review_row_aria", { id: uid })}
                    >
                      {t("admin_guide_list_reviewLink")}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      </AdminStandardListSection>
    </AdminQueueListPageChrome>
  );
}
