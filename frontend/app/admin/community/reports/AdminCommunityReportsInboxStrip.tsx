"use client";

import type { LocaleTranslateFn } from "@/lib/i18n";
import { AdminInboxStripEmptyNextLinks } from "@/components/admin/AdminInboxStripEmptyNextLinks";
import { ADMIN_EMPTY_NEXT_COMMUNITY_REPORTS_EMPTY } from "@/lib/admin/adminListEmptyStateNextLinks";
import { ADMIN_HOME_WIDGET_CARD_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS } from "@/lib/adminUi";

type Props = {
  t: LocaleTranslateFn;
  openCount: number;
  totalShown: number;
  onShowOpen: () => void;
  listStatus: string;
};

export function AdminCommunityReportsInboxStrip({
  t,
  openCount,
  totalShown,
  onShowOpen,
  listStatus,
}: Props) {
  const onOpenFilter = listStatus === "open";

  return (
    <section
      className={`mt-4 ${ADMIN_HOME_WIDGET_CARD_CLASS}`}
      aria-label={t("admin_reports_inbox_aria")}
      data-tt-admin-reports-inbox="1"
      data-tt-admin-reports-inbox-open-filter={onOpenFilter ? "1" : undefined}
      data-tt-admin-reports-inbox-empty={totalShown === 0 ? "1" : undefined}
    >
      <p className="text-small font-semibold text-ink-900">{t("admin_reports_inbox_title")}</p>
      {!onOpenFilter ? (
        <p className="mt-1 text-meta text-ink-700" data-tt-admin-reports-inbox-counts="1">
          {t("admin_reports_inbox_counts", {
            open: String(openCount),
            shown: String(totalShown),
          })}
        </p>
      ) : (
        <p className="mt-1 text-meta text-ink-600" data-tt-admin-reports-inbox-open-only="1">
          {t("admin_reports_inbox_open_filter", { shown: String(totalShown) })}
        </p>
      )}
      <p className="mt-1 text-meta text-ink-600">{t("admin_reports_wizard_flow_hint")}</p>
      {listStatus !== "open" && openCount > 0 ? (
        <button
          type="button"
          className={`mt-3 ${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
          onClick={onShowOpen}
        >
          {t("admin_reports_inbox_show_open")}
        </button>
      ) : null}
      {onOpenFilter && totalShown === 0 ? (
        <AdminInboxStripEmptyNextLinks
          nextLinks={ADMIN_EMPTY_NEXT_COMMUNITY_REPORTS_EMPTY}
          dataAttr="reports"
        />
      ) : null}
    </section>
  );
}
