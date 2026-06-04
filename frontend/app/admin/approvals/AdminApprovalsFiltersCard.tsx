"use client";

import { useTranslation } from "@/components/LocaleProvider";
import type { AdminApprovalsPageViewModel } from "./useAdminApprovalsPage";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
} from "@/lib/adminUi";
type Props = {
  vm: AdminApprovalsPageViewModel;
  statusFilterId: string;
  approvalsListFilterHintId: string;
  adminListApplyResetHintId: string;
  adminAppliedFiltersDescId: string;
};

export function AdminApprovalsFiltersCard({
  vm,
  statusFilterId,
  approvalsListFilterHintId,
  adminListApplyResetHintId,
  adminAppliedFiltersDescId,
}: Props) {
  const { t } = useTranslation();
  const { loading, error, appliedFilters, draftLimit, setDraftLimit, draftStatus, setDraftStatus, apply, reset } = vm;

  return (
    <div className={`mt-5 ${ADMIN_FILTER_CARD_CLASS}`}>
      <form
        id="admin-approvals-filter-form"
        aria-label={t("admin_approvals_filters")}
        aria-describedby={
          [
            approvalsListFilterHintId,
            adminListApplyResetHintId,
            !loading && !error && appliedFilters ? adminAppliedFiltersDescId : "",
          ]
            .filter(Boolean)
            .join(" ")
        }
        onSubmit={apply}
      >
        <h2 className="text-body font-medium text-ink-800">{t("admin_approvals_filters")}</h2>
        <p id={approvalsListFilterHintId} className="mt-2 text-meta text-ink-600 leading-relaxed">
          {t("admin_approvals_list_filter_hint")}
        </p>
        <p id={adminListApplyResetHintId} className="mt-2 text-meta text-ink-600 leading-relaxed">
          {t("admin_list_filters_apply_reset_hint")}
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <label className="text-small text-ink-700" htmlFor={statusFilterId}>
            {t("admin_approvals_statusLabel")}
            <select
              id={statusFilterId}
              name="status"
              className={`mt-1 inline-flex w-full min-h-[44px] min-w-[10rem] items-center justify-start rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value)}
            >
              <option value="pending">{t("admin_approvals_optPending")}</option>
              <option value="approved">{t("admin_approvals_optApproved")}</option>
              <option value="rejected">{t("admin_approvals_optRejected")}</option>
              <option value="cancelled">{t("admin_approvals_optCancelled")}</option>
              <option value="">{t("admin_approvals_optAll")}</option>
            </select>
          </label>
          <label className="text-small text-ink-700">
            {t("admin_approvals_limitLabel")}
            <input
              name="limit"
              className={`mt-1 block min-h-[44px] w-24 rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              type="number"
              min={1}
              max={200}
              value={draftLimit}
              onChange={(e) => setDraftLimit(e.target.value)}
            />
          </label>
          <label className="min-w-[12rem] flex-1 text-small text-ink-700">
            {t("admin_approvals_search_label")}
            <input
              name="q"
              className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              type="search"
              value={vm.draftSearch}
              onChange={(e) => vm.setDraftSearch(e.target.value)}
              placeholder={t("admin_approvals_search_ph")}
            />
          </label>
        </div>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          form="admin-approvals-filter-form"
          className={ADMIN_PRIMARY_ACTION_BTN_CLASS}
          type="submit"
        >
          {t("admin_approvals_apply")}
        </button>
        <form
          className="inline"
          aria-describedby={adminListApplyResetHintId}
          onSubmit={(e) => {
            e.preventDefault();
            reset();
          }}
        >
          <button
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-3 py-2 text-small font-medium text-ink-700 hover:bg-ink-50 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            type="submit"
          >
            {t("admin_approvals_reset")}
          </button>
        </form>
      </div>
    </div>
  );
}
