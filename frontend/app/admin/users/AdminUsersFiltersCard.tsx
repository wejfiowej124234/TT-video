"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FILTER_INPUT_MD_CLASS,
  ADMIN_FILTER_ACTIONS_CLASS,
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_GRID_4_CLASS,
  ADMIN_FILTER_HINT_CLASS,
  ADMIN_FILTER_TITLE_CLASS,
} from "@/lib/adminUi";

export function AdminUsersFiltersCard({
  adminListApplyResetHintId,
  adminAppliedFiltersDescId,
  loading,
  error,
  appliedFilters,
  draftLimit,
  setDraftLimit,
  draftRole,
  setDraftRole,
  draftKyc,
  setDraftKyc,
  draftEmail,
  setDraftEmail,
  applyFilters,
  resetFilters,
  t,
}: {
  adminListApplyResetHintId: string;
  adminAppliedFiltersDescId: string;
  loading: boolean;
  error: AdminFetchErrorKind | null;
  appliedFilters: Record<string, unknown> | null;
  draftLimit: string;
  setDraftLimit: Dispatch<SetStateAction<string>>;
  draftRole: string;
  setDraftRole: Dispatch<SetStateAction<string>>;
  draftKyc: string;
  setDraftKyc: Dispatch<SetStateAction<string>>;
  draftEmail: string;
  setDraftEmail: Dispatch<SetStateAction<string>>;
  applyFilters: (e?: FormEvent) => void;
  resetFilters: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className={`mt-5 ${ADMIN_FILTER_CARD_CLASS}`}>
      <form
        id="admin-users-filter-form"
        aria-label={t("admin_users_filters_aria")}
        aria-describedby={
          [adminListApplyResetHintId, !loading && !error && appliedFilters ? adminAppliedFiltersDescId : ""]
            .filter(Boolean)
            .join(" ")
        }
        onSubmit={applyFilters}
      >
        <h2 className={ADMIN_FILTER_TITLE_CLASS}>{t("admin_users_filters_title")}</h2>
        <p id={adminListApplyResetHintId} className={ADMIN_FILTER_HINT_CLASS}>
          {t("admin_list_filters_apply_reset_hint")}
        </p>
        <div className={ADMIN_FILTER_GRID_4_CLASS} data-tt-admin-users-filters-grid="1">
          <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
            {t("admin_users_email_filter_label")}
            <input
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              type="search"
              value={draftEmail}
              onChange={(e) => setDraftEmail(e.target.value)}
              placeholder={t("admin_users_email_filter_ph")}
              autoComplete="off"
              data-tt-admin-users-email-filter="1"
              aria-label={t("admin_users_email_filter_label")}
            />
          </label>
          <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
            {t("admin_users_limit_label")}
            <input
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              type="number"
              min={1}
              max={500}
              value={draftLimit}
              onChange={(e) => setDraftLimit(e.target.value)}
            />
          </label>
          <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
            {t("admin_users_role_filter_label")}
            <input
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 font-mono text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftRole}
              onChange={(e) => setDraftRole(e.target.value)}
              placeholder={t("admin_users_role_filter_ph")}
            />
          </label>
          <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
            {t("admin_users_kyc_filter_label")}
            <input
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 font-mono text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftKyc}
              onChange={(e) => setDraftKyc(e.target.value)}
              placeholder={t("admin_users_kyc_filter_ph")}
            />
          </label>
        </div>
      </form>
      <div className={ADMIN_FILTER_ACTIONS_CLASS}>
        <button
          form="admin-users-filter-form"
          className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
          type="submit"
        >
          {t("admin_users_apply")}
        </button>
        <form
          className="inline"
          aria-describedby={adminListApplyResetHintId}
          onSubmit={(e) => {
            e.preventDefault();
            resetFilters();
          }}
        >
          <button
            className={`inline-flex min-h-[44px] items-center justify-center ${ADMIN_FILTER_RESET_BTN_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            type="submit"
          >
            {t("admin_users_reset")}
          </button>
        </form>
      </div>
    </div>
  );
}
