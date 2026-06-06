"use client";

import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import type { AdminReviewsPageViewModel } from "./useAdminReviewsPage";
import {
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_INLINE_LINK_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_HINT_CLASS,
  ADMIN_FILTER_TITLE_CLASS} from "@/lib/adminUi";
type Props = {
  vm: AdminReviewsPageViewModel;
  adminAppliedFiltersDescId: string;
  adminListApplyResetHintId: string;
};

export function AdminReviewsFiltersCard({ vm, adminAppliedFiltersDescId, adminListApplyResetHintId }: Props) {
  const { t } = useTranslation();
  const {
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftMax,
    setDraftMax,
    draftMin,
    setDraftMin,
    apply,
    presetLow,
    clearScores,
  } = vm;

  return (
    <div className={`mt-6 ${ADMIN_FILTER_CARD_CLASS} space-y-3`}>
      <form
        id="admin-reviews-filter-form"
        aria-label={t("admin_reviews_filters")}
        aria-describedby={[adminListApplyResetHintId, appliedFilters ? adminAppliedFiltersDescId : ""].filter(Boolean).join(" ")}
        onSubmit={apply}
      >
        <p className={ADMIN_FILTER_TITLE_CLASS}>{t("admin_reviews_filters")}</p>
        <p id={adminListApplyResetHintId} className={ADMIN_FILTER_HINT_CLASS}>
          {t("admin_list_filters_apply_reset_hint")}
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
            {t("admin_reviews_limit")}
            <input
              type="text"
              inputMode="numeric"
              value={draftLimit}
              onChange={(e) => setDraftLimit(e.target.value)}
              className={`ml-2 min-h-[44px] w-24 ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            />
          </label>
          <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
            {t("admin_reviews_maxScore")}
            <input
              type="text"
              inputMode="numeric"
              value={draftMax}
              onChange={(e) => setDraftMax(e.target.value)}
              className={`ml-2 min-h-[44px] w-20 ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              placeholder={t("admin_reviews_maxScorePh")}
            />
          </label>
          <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
            {t("admin_reviews_minScore")}
            <input
              type="text"
              inputMode="numeric"
              value={draftMin}
              onChange={(e) => setDraftMin(e.target.value)}
              className={`ml-2 min-h-[44px] w-20 ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              placeholder={t("admin_reviews_minScorePh")}
            />
          </label>
        </div>
        {appliedFilters && (
          <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline">
            {t("admin_reviews_applied")}: {formatAdminAppliedFiltersHuman(appliedFilters, t)}
          </AdminAppliedFiltersBanner>
        )}
      </form>
      <div className="flex flex-wrap items-center gap-2">
        <button
          form="admin-reviews-filter-form"
          type="submit"
          className={ADMIN_PRIMARY_ACTION_BTN_CLASS}
        >
          {t("admin_reviews_apply")}
        </button>
        <form
          className="inline"
          aria-describedby={adminListApplyResetHintId}
          onSubmit={(e) => {
            e.preventDefault();
            presetLow();
          }}
        >
          <button
            type="submit"
            className={`${touchTargetLink44Classes} text-small font-medium ${ADMIN_INLINE_LINK_CLASS}`}
          >
            {t("admin_reviews_presetLow")}
          </button>
        </form>
        <form
          className="inline"
          aria-describedby={adminListApplyResetHintId}
          onSubmit={(e) => {
            e.preventDefault();
            clearScores();
          }}
        >
          <button
            type="submit"
            className={`${touchTargetLink44Classes} text-small font-medium ${ADMIN_INLINE_LINK_CLASS}`}
          >
            {t("admin_reviews_clearScores")}
          </button>
        </form>
      </div>
    </div>
  );
}
