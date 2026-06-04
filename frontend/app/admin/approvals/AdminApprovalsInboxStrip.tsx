"use client";



import Link from "next/link";



import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_EMPTY_NEXT_APPROVALS_FILTERED_EMPTY } from "@/lib/admin/adminListEmptyStateNextLinks";
import { AdminInboxStripEmptyNextLinks } from "@/components/admin/AdminInboxStripEmptyNextLinks";

import {

  ADMIN_HOME_WIDGET_CARD_CLASS,

  ADMIN_LINK_FOCUS_CLASS,

  ADMIN_PRIMARY_ACTION_BTN_CLASS,

} from "@/lib/adminUi";



import type { AdminApprovalsPageViewModel } from "./useAdminApprovalsPage";



type Props = { vm: AdminApprovalsPageViewModel };



export function AdminApprovalsInboxStrip({ vm }: Props) {

  const { t } = useTranslation();

  const { loading, error, pendingInView, filteredItems, listQ } = vm;



  if (loading || error) return null;



  const pendingCount = pendingInView.length;

  const totalShown = filteredItems.length;

  const onPendingFilter = (listQ.status ?? "pending") === "pending";



  return (

    <section

      className={`mt-5 ${ADMIN_HOME_WIDGET_CARD_CLASS}`}

      aria-label={t("admin_approvals_inbox_aria")}

      data-tt-admin-approvals-inbox="1"

      data-tt-admin-approvals-inbox-pending-filter={onPendingFilter ? "1" : undefined}
      data-tt-admin-approvals-inbox-empty={totalShown === 0 ? "1" : undefined}

    >

      <div className="flex flex-wrap items-start justify-between gap-3">

        <div>

          <p className="text-small font-semibold text-ink-900">{t("admin_approvals_inbox_title")}</p>

          {!onPendingFilter ? (

            <p className="mt-1 text-meta text-ink-700" data-tt-admin-approvals-inbox-counts="1">

              {t("admin_approvals_inbox_counts", {

                pending: String(pendingCount),

                shown: String(totalShown),

              })}

            </p>

          ) : (

            <p className="mt-1 text-meta text-ink-600" data-tt-admin-approvals-inbox-pending-only="1">

              {t("admin_approvals_inbox_pending_filter", { shown: String(totalShown) })}

            </p>

          )}

          <p className="mt-1 text-meta text-ink-600">{t("admin_approvals_inbox_workflow_hint")}</p>

        </div>

        <div className="flex flex-wrap gap-2">

          <Link

            href="/admin/permissions"

            className={`inline-flex min-h-[44px] items-center rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 ${ADMIN_LINK_FOCUS_CLASS}`}

          >

            {t("admin_approvals_link_permissions")}

          </Link>

          {!onPendingFilter && pendingCount > 0 ? (

            <button

              type="button"

              className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS} ${ADMIN_LINK_FOCUS_CLASS}`}

              onClick={() => vm.setStatusQuick("pending")}

            >

              {t("admin_approvals_inbox_show_pending")}

            </button>

          ) : null}

        </div>

      </div>

      {onPendingFilter && totalShown === 0 ? (
        <AdminInboxStripEmptyNextLinks
          nextLinks={ADMIN_EMPTY_NEXT_APPROVALS_FILTERED_EMPTY}
          dataAttr="approvals"
        />
      ) : null}

    </section>

  );

}

