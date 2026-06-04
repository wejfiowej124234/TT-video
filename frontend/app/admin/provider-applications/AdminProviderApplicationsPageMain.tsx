"use client";



import Link from "next/link";

import { useRouter, useSearchParams } from "next/navigation";

import { useCallback, useEffect, useId, useMemo, useState } from "react";



import { useTranslation } from "@/components/LocaleProvider";

import { AdminListFetchError } from "@/components/admin/AdminListFetchError";

import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";

import { AdminQueueListPageChrome } from "@/components/admin/AdminQueueListPageChrome";

import {

  buildAdminQueueListPath,

  parseAdminQueueStatusQuery,

} from "@/lib/admin/adminQueueListPageModel";

import { fetchAdminQueueList } from "@/lib/admin/fetchAdminQueueList";
import { ADMIN_EMPTY_NEXT_PROVIDER_QUEUE_EMPTY } from "@/lib/admin/adminListEmptyStateNextLinks";

import { type AdminFetchErrorKind, adminErrorUserText } from "@/lib/adminFetchDisplay";

import { routes } from "@/lib/api/routes";

import { formatRelativeAge } from "@/lib/admin/formatRelativeAge";
import { sortOnboardingQueueItems, type OnboardingQueueSortKey } from "@/lib/admin/sortOnboardingQueueItems";
import { useAdminTableSort } from "@/lib/admin/useAdminTableSort";

import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminOnboardingQueueSortToolbar } from "@/components/admin/AdminOnboardingQueueSortToolbar";

import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_QUEUE_LIST_ROW_CARD_CLASS,
  adminTableInlineLinkClass,
} from "@/lib/adminUi";



const DEFAULT_STATUS = "submitted";

const BASE_PATH = "/admin/provider-applications";



type ListItem = {

  user_id?: string;

  email?: string | null;

  user_role?: string;

  application?: {

    status?: string;

    shop_name?: string;

    legal_name?: string;

    submitted_at?: string;

  };

};



export function AdminProviderApplicationsPageMain() {

  const { t } = useTranslation();

  const titleId = useId();

  const router = useRouter();

  const searchParams = useSearchParams();

  const statusFilter = useMemo(

    () => parseAdminQueueStatusQuery(new URLSearchParams(searchParams.toString()), DEFAULT_STATUS),

    [searchParams],

  );

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<AdminFetchErrorKind | null>(null);

  const [items, setItems] = useState<ListItem[]>([]);



  const load = useCallback(async () => {

    setLoading(true);

    setError(null);

    const q = statusFilter.trim() ? `?status=${encodeURIComponent(statusFilter.trim())}` : "";

    const { items: rows, errorKind } = await fetchAdminQueueList<{ items?: ListItem[] }>(

      "AdminProviderApplicationsPage.load",

      `${routes.adminProviderApplications}${q}`,

    );

    if (errorKind) {

      setError(errorKind);

      setItems([]);

    } else {

      setItems((rows as ListItem[]) ?? []);

    }

    setLoading(false);

  }, [statusFilter]);



  useEffect(() => {

    void load();

  }, [load]);



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

      subtitleKey="admin_provider_list_subtitle"

    >

      <div className={`${ADMIN_FILTER_CARD_CLASS} flex flex-wrap items-end gap-3`} data-tt-admin-queue-list-filter="provider">

        <label className="text-small text-ink-700">

          {t("admin_provider_list_filterStatus")}

          <select

            className={`mt-1 block rounded border border-ink-200 px-2 py-1.5 text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}

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

          onClick={() => void load()}

        >

          {t("admin_provider_list_refresh")}

        </button>

      </div>



      <section aria-live="polite" data-tt-admin-onboarding-queue-list="provider">

        {loading ? (
          <AdminListLoadingStatus message={t("admin_users_loading")} className="text-body text-ink-600" />
        ) : error ? (

          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />

        ) : items.length === 0 ? (

          <AdminListPageEmptyState

            messageKey="admin_list_empty_provider"

            nextLinks={ADMIN_EMPTY_NEXT_PROVIDER_QUEUE_EMPTY}

          />

        ) : (

          <>
          <AdminOnboardingQueueSortToolbar
            sortKey={sort.key}
            sortDir={sort.dir}
            onSelect={(key) => toggle(key)}
          />

          <ul className="space-y-3">

            {sortedItems.map((row) => {

              const uid = row.user_id ?? "";

              const app = row.application;

              return (

                <li key={uid} className={ADMIN_QUEUE_LIST_ROW_CARD_CLASS}>

                  <div className="flex flex-wrap items-start justify-between gap-2">

                    <div>

                      <p className="font-mono text-meta text-ink-800 break-all">{row.email ?? uid}</p>

                      <p className="mt-1 text-small text-ink-600">

                        {t("admin_provider_app_status")}:{" "}

                        <span className="font-mono">{app?.status ?? "—"}</span>

                        {app?.shop_name ? (

                          <>

                            {" · "}

                            {String(app.shop_name)}

                          </>

                        ) : null}

                        {app?.submitted_at ? (

                          <>

                            {" · "}

                            {t("admin_queue_wait_age", {

                              age: formatRelativeAge(app.submitted_at),

                            })}

                          </>

                        ) : null}

                      </p>

                      {app?.submitted_at ? (

                        <p className="text-meta text-ink-500">{app.submitted_at}</p>

                      ) : null}

                    </div>

                    <Link

                      href={`/admin/users/${encodeURIComponent(uid)}`}

                      className={`${adminTableInlineLinkClass()}`}

                      aria-label={t("admin_provider_list_review_row_aria", { id: uid })}

                    >

                      {t("admin_provider_list_reviewLink")}

                    </Link>

                  </div>

                </li>

              );

            })}

          </ul>
          </>

        )}

      </section>

    </AdminQueueListPageChrome>

  );

}

