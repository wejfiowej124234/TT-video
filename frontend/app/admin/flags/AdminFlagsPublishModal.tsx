"use client";

import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminDialogFocusPanel } from "@/components/admin/AdminDialogFocusPanel";
import { AdminDialogScrim } from "@/components/admin/AdminDialogScrim";
import { escrowModalPortalRootClass } from "@/components/market/marketStudioModalLayout";
import type { AdminFlagRegionMode } from "./adminFlagsPageTypes";
import type { AdminFlagsPageViewModel } from "./useAdminFlagsPage";
import {ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS } from "@/lib/adminUi";
type Props = Pick<
  AdminFlagsPageViewModel,
  | "t"
  | "publishRow"
  | "closePublish"
  | "submitPublish"
  | "publishDialogTitleId"
  | "publishDialogDescId"
  | "publishModalFilterHintId"
  | "pubEnabled"
  | "setPubEnabled"
  | "pubRollout"
  | "setPubRollout"
  | "pubRegionMode"
  | "setPubRegionMode"
  | "pubRegionText"
  | "setPubRegionText"
  | "pubVersion"
  | "setPubVersion"
  | "publishSubmitting"
  | "publishError"
  | "publishErrorKind"
>;

export function AdminFlagsPublishModal({
  t,
  publishRow,
  closePublish,
  submitPublish,
  publishDialogTitleId,
  publishDialogDescId,
  publishModalFilterHintId,
  pubEnabled,
  setPubEnabled,
  pubRollout,
  setPubRollout,
  pubRegionMode,
  setPubRegionMode,
  pubRegionText,
  setPubRegionText,
  pubVersion,
  setPubVersion,
  publishSubmitting,
  publishError,
  publishErrorKind,
}: Props) {
  if (!publishRow) return null;

  return (
    <div
      className={escrowModalPortalRootClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby={publishDialogTitleId}
      aria-describedby={publishDialogDescId}
    >
      <AdminDialogScrim onClose={closePublish} />
      <AdminDialogFocusPanel
        onClose={closePublish}
        trapId="flags-publish"
        className="relative z-10 max-w-md w-full rounded-[var(--radius-xl)] border border-ink-200 bg-white p-5 shadow-medium my-8"
      >
        <h2 id={publishDialogTitleId} className="text-body-l font-semibold text-ink-900">
          {t("admin_flags_publishTitle")}
        </h2>
        <p id={publishDialogDescId} className="mt-1 text-small text-ink-600">{t("admin_flags_publishSuperHint")}</p>
        <p className="mt-2 font-mono text-meta text-ink-700 break-all">{publishRow.flag_code ?? publishRow.id}</p>
        <p id={publishModalFilterHintId} className="mt-3 text-meta text-ink-600 leading-relaxed">
          {t("admin_flags_publish_filter_hint")}
        </p>

        <form
          aria-describedby={publishModalFilterHintId}
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            const sub = (e.nativeEvent as globalThis.SubmitEvent).submitter as HTMLButtonElement | null;
            if (sub?.name === "admin_modal_intent" && sub.value === "cancel") {
              closePublish();
              return;
            }
            void submitPublish();
          }}
        >
          <label className="mt-4 flex items-center gap-2 text-small text-ink-800">
            <input type="checkbox" name="enabled" checked={pubEnabled} onChange={(e) => setPubEnabled(e.target.checked)} />
            {t("admin_flags_publishEnabled")}
          </label>

          <label className="mt-3 block text-small text-ink-800">
            {t("admin_flags_publishRollout")}
            <input
              type="text"
              name="rollout_percent"
              inputMode="numeric"
              value={pubRollout}
              onChange={(e) => setPubRollout(e.target.value)}
              placeholder={t("admin_flags_publishRolloutPh")}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-ink-200 px-3 py-2 font-mono text-small"
            />
          </label>

          <label className="mt-3 block text-small text-ink-800">
            {t("admin_flags_publishRegionMode")}
            <select
              name="region_mode"
              value={pubRegionMode}
              onChange={(e) => setPubRegionMode(e.target.value as AdminFlagRegionMode)}
              className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-3 py-2 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            >
              <option value="unchanged">{t("admin_flags_publishRegionUnchanged")}</option>
              <option value="clear">{t("admin_flags_publishRegionClear")}</option>
              <option value="set">{t("admin_flags_publishRegionSet")}</option>
            </select>
          </label>
          {pubRegionMode === "set" ? (
            <label className="mt-3 block text-small text-ink-800">
              {t("admin_flags_publishRegionValue")}
              <input
                type="text"
                name="region"
                value={pubRegionText}
                onChange={(e) => setPubRegionText(e.target.value)}
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-ink-200 px-3 py-2 font-mono text-small"
              />
            </label>
          ) : null}

          <label className="mt-3 block text-small text-ink-800">
            {t("admin_flags_publishVer")}
            <input
              type="text"
              name="expected_version"
              inputMode="numeric"
              value={pubVersion}
              onChange={(e) => setPubVersion(e.target.value)}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-ink-200 px-3 py-2 font-mono text-small"
            />
          </label>

          {publishError && publishErrorKind ? (
            <AdminAlertError compact className="mt-3" message={publishError} errorKind={publishErrorKind} />
          ) : null}

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              type="submit"
              name="admin_modal_intent"
              value="cancel"
              formNoValidate
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-200 px-4 py-2 text-small text-ink-800 hover:bg-bg-console ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            >
              {t("admin_flags_publishCancel")}
            </button>
            <button
              type="submit"
              disabled={publishSubmitting}
              aria-busy={publishSubmitting ? true : undefined}
              className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
            >
              {publishSubmitting ? t("admin_flags_publishSubmitting") : t("admin_flags_publishSubmit")}
            </button>
          </div>
        </form>
      </AdminDialogFocusPanel>
    </div>
  );
}
