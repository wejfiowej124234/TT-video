"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

import { AdminReviewsFetchAlerts } from "./AdminReviewsFetchAlerts";
import { AdminReviewsFiltersCard } from "./AdminReviewsFiltersCard";
import { AdminReviewsTableSection } from "./AdminReviewsTableSection";
import { useAdminReviewsPage } from "./useAdminReviewsPage";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

/** Phase 5 / 07：低分评价运营抽样（GET /api/v1/admin/reviews） */
export function AdminReviewsPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();

  const vm = useAdminReviewsPage();
  const { loading, error, itemsNotArrayError, items, meta } = vm;

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_reviews_title")}
      subtitle={t("admin_reviews_subtitle")}
      headerAside={
        <>
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
      <AdminReviewsFiltersCard
        vm={vm}
        adminAppliedFiltersDescId={adminAppliedFiltersDescId}
        adminListApplyResetHintId={adminListApplyResetHintId}
      />

      {loading ? (
        <AdminListLoadingStatus message={t("admin_loading")} />
      ) : null}

      <AdminReviewsFetchAlerts error={error} itemsNotArrayError={itemsNotArrayError} />

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <AdminReviewsTableSection loading={loading} error={error} itemsNotArrayError={itemsNotArrayError} items={items} />
    </AdminListPageChrome>
  );
}
