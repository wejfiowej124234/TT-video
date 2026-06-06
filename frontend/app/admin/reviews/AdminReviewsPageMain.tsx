"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

import { AdminReviewsFetchAlerts } from "./AdminReviewsFetchAlerts";
import { AdminReviewsFiltersCard } from "./AdminReviewsFiltersCard";
import { AdminReviewsTableSection } from "./AdminReviewsTableSection";
import { useAdminReviewsPage } from "./useAdminReviewsPage";
import { REVIEWS_LIST_RELATED_FOLD_LINKS } from "@/lib/admin/adminOpsListRelatedFoldLinks";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

/** Phase 5 / 07：低分评价运营抽样（GET /api/v1/admin/reviews） */
export function AdminReviewsPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();

  const vm = useAdminReviewsPage();
  const { loading, refreshing, error, itemsNotArrayError, items, meta } = vm;

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_reviews_title")}
      subtitle={t("admin_reviews_subtitle_l5")}
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={REVIEWS_LIST_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_ops_list_related_aria"
        foldSummaryKey="admin_ops_list_related_fold"
        dataTtFold="reviews-list"
      />
      <AdminReviewsFiltersCard
        vm={vm}
        adminAppliedFiltersDescId={adminAppliedFiltersDescId}
        adminListApplyResetHintId={adminListApplyResetHintId}
      />

      {loading && items.length === 0 ? (
        <AdminListLoadingStatus message={t("admin_loading")} />
      ) : null}

      <AdminReviewsFetchAlerts error={error} itemsNotArrayError={itemsNotArrayError} />

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <AdminReviewsTableSection
        loading={loading}
        refreshing={refreshing}
        error={error}
        itemsNotArrayError={itemsNotArrayError}
        items={items}
      />
    </AdminListPageChrome>
  );
}
