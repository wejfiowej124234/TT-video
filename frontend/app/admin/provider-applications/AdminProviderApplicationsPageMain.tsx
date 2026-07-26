"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useId, useMemo } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminOnboardingQueueRowCard } from "@/components/admin/AdminOnboardingQueueRowCard";
import { AdminQueueListPageChrome } from "@/components/admin/AdminQueueListPageChrome";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminStandardListSection } from "@/components/admin/AdminStandardListSection";
import { AdminOnboardingQueueSortToolbar } from "@/components/admin/AdminOnboardingQueueSortToolbar";

import {
  buildAdminQueueListPath,
  parseAdminQueueStatusQuery,
} from "@/lib/admin/adminQueueListPageModel";
import { ADMIN_EMPTY_NEXT_PROVIDER_QUEUE_EMPTY } from "@/lib/admin/adminListEmptyStateNextLinks";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { sortOnboardingQueueItems, type OnboardingQueueSortKey } from "@/lib/admin/sortOnboardingQueueItems";
import { useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_FILTER_FIELD_LABEL_CLASS,
} from "@/lib/adminUi";

import { useAdminProviderApplicationsPage } from "./useAdminProviderApplicationsPage";

const DEFAULT_STATUS = "submitted";
const BASE_PATH = "/admin/provider-applications";

export function AdminProviderApplicationsPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = useMemo(
    () => parseAdminQueueStatusQuery(new URLSearchParams(searchParams.toString()), DEFAULT_STATUS),
    [searchParams],
  );

  const { items, loading, refreshing, error, staleWhileError, bumpReload } = useAdminProviderApplicationsPage(statusFilter);
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

      queue="provider"

      titleId={titleId}

      titleKey="admin_provider_list_title"

      subtitleKey="admin_provider_list_subtitle_l5"

    >

      <div
        className={`${ADMIN_FILTER_CARD_CLASS} flex flex-wrap items-end gap-3`}
        data-tt-admin-queue-list-filter="provider"
        data-tt-admin-batch9-l5-sample="provider-queue"
      >

        <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>

          {t("admin_provider_list_filterStatus")}

          <select

            className={`mt-1 block ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}

            value={statusFilter}

            onChange={(e) => onStatusChange(e.target.value)}

          >

            <option value="">{t("admin_provider_list_filterAll")}</option>

            <option value="submitted">{t("admin_provider_list_statusSubmitted")}</option>

            <option value="reviewing">{t("admin_provider_list_statusReviewing")}</option>

            <option value="approved">{t("admin_provider_list_statusApproved")}</option>

            <option value="rejected">{t("admin_provider_list_statusRejected")}</option>

          </select>

        </label>

        <button

          type="button"

          className={ADMIN_PRIMARY_ACTION_BTN_CLASS}

          aria-label={t("admin_provider_list_refresh")}

          onClick={() => bumpReload()}

        >

          {t("admin_provider_list_refresh")}

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
        data-tt-admin-onboarding-queue-list="provider"
        data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
        empty={
          <AdminListPageEmptyState
            messageKey="admin_list_empty_provider"
            nextLinks={ADMIN_EMPTY_NEXT_PROVIDER_QUEUE_EMPTY}
          />
        }
      >
          <>
          <AdminOnboardingQueueSortToolbar
            sortKey={sort.key}
            sortDir={sort.dir}
            onSelect={(key) => toggle(key)}
          />

          <ul className="space-y-3">
            {sortedItems.map((row) => (
              <AdminOnboardingQueueRowCard
                key={row.user_id ?? ""}
                kind="provider"
                row={row}
                statusLabelKey="admin_provider_app_status"
                reviewLinkKey="admin_provider_list_reviewLink"
                reviewAriaKey="admin_provider_list_review_row_aria"
              />
            ))}
          </ul>          </>
      </AdminStandardListSection>

    </AdminQueueListPageChrome>

  );

}

