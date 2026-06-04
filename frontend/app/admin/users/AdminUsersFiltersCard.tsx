"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import {ADMIN_FILTER_CARD_CLASS, ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS } from "@/lib/adminUi";
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
        <h2 className="text-body font-medium text-ink-800">{t("admin_users_filters_title")}</h2>
        <p id={adminListApplyResetHintId} className="mt-2 text-meta text-ink-600 leading-relaxed">
          {t("admin_list_filters_apply_reset_hint")}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="text-small text-ink-700">
            {t("admin_users_limit_label")}
            <input
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              type="number"
              min={1}
              max={500}
              value={draftLimit}
              onChange={(e) => setDraftLimit(e.target.value)}
            />
          </label>
          <label className="text-small text-ink-700">
            {t("admin_users_role_filter_label")}
            <input
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 font-mono text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftRole}
              onChange={(e) => setDraftRole(e.target.value)}
              placeholder={t("admin_users_role_filter_ph")}
            />
          </label>
          <label className="text-small text-ink-700">
            {t("admin_users_kyc_filter_label")}
            <input
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 font-mono text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftKyc}
              onChange={(e) => setDraftKyc(e.target.value)}
              placeholder={t("admin_users_kyc_filter_ph")}
            />
          </label>
        </div>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
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
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-3 py-2 text-small font-medium text-ink-700 hover:bg-ink-50 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            type="submit"
          >
            {t("admin_users_reset")}
          </button>
        </form>
      </div>
    </div>
  );
}
