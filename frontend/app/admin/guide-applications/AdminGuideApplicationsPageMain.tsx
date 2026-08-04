"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useId, useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminOnboardingQueueRowCard } from "@/components/admin/AdminOnboardingQueueRowCard";
import { AdminQueueListPageChrome } from "@/components/admin/AdminQueueListPageChrome";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import {
  buildAdminQueueListPath,
  parseAdminQueueStatusQuery,
} from "@/lib/admin/adminQueueListPageModel";
import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";
import { isAdminOnboardingQueueListTruncated } from "@/lib/admin/adminOnboardingQueueListLimit";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
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
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_FILTER_FIELD_LABEL_CLASS,
} from "@/lib/adminUi";
import { useAdminGuideApplicationsPage } from "./useAdminGuideApplicationsPage";
import { AdminGuidesTriangleStrip } from "@/components/admin/AdminGuidesTriangleStrip";

const DEFAULT_STATUS = "pending";
const BASE_PATH = "/admin/guide-applications";

export function AdminGuideApplicationsPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const adminAppliedFiltersDescId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = useMemo(
    () => parseAdminQueueStatusQuery(new URLSearchParams(searchParams.toString()), DEFAULT_STATUS),
    [searchParams],
  );

  const { items, loading, refreshing, error, staleWhileError, appliedFilters, bumpReload } =
    useAdminGuideApplicationsPage(statusFilter);
  const onStatusChange = (next: string) => {
    router.push(buildAdminQueueListPath(BASE_PATH, next));
  };

  const { sort, toggle } = useAdminTableSort<OnboardingQueueSortKey>("submitted_at", "desc");
  const sortedItems = useMemo(
    () => sortOnboardingQueueItems(items, sort.key, sort.dir),
    [items, sort.key, sort.dir],
  );
  const listTruncated = isAdminOnboardingQueueListTruncated(appliedFilters, items.length);

  return (
    <AdminQueueListPageChrome
      queue="guide"
      titleId={titleId}
      titleKey="admin_guide_list_title"
      subtitleKey="admin_guide_list_subtitle_l5"
    >
      <AdminGuidesTriangleStrip current="applications" />
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

      {!loading && !error && appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card">
          {t("admin_onboarding_queue_applied")} {formatAdminAppliedFiltersHuman(appliedFilters, t)}
          {listTruncated ? (
            <span className="mt-1 block text-meta text-amber-200/90" data-tt-admin-onboarding-queue-truncated="1">
              {t("admin_onboarding_queue_list_truncated_hint")}
            </span>
          ) : null}
        </AdminAppliedFiltersBanner>
      ) : null}

      <AdminStandardListSection
        loading={loading}
        refreshing={refreshing}
        error={error}
        staleWhileError={staleWhileError}
        itemsLength={items.length}
        loadingMessage={t("admin_guide_list_loading")}
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
            {sortedItems.map((row) => (
              <AdminOnboardingQueueRowCard
                key={row.user_id ?? ""}
                kind="guide"
                row={row}
                statusLabelKey="admin_guide_app_status"
                reviewLinkKey="admin_guide_list_reviewLink"
                reviewAriaKey="admin_guide_list_review_row_aria"
              />
            ))}
          </ul>        </>
      </AdminStandardListSection>
    </AdminQueueListPageChrome>
  );
}
