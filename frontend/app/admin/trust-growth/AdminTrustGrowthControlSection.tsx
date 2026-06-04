"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { ADMIN_LINK_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS } from "@/lib/adminUi";
type AdminTrustGrowthControlSectionProps = {
  controlSectionId: string;
  draftFrozen: boolean;
  setDraftFrozen: (v: boolean) => void;
  draftForce: boolean;
  setDraftForce: (v: boolean) => void;
  capsText: string;
  setCapsText: (v: string) => void;
  saving: boolean;
  rollbackBusy: boolean;
  actionError: string | null;
  actionErrorKind: AdminFetchErrorKind | null;
  applyControl: () => Promise<void>;
  rollback: () => Promise<void>;
};

export function AdminTrustGrowthControlSection({
  controlSectionId,
  draftFrozen,
  setDraftFrozen,
  draftForce,
  setDraftForce,
  capsText,
  setCapsText,
  saving,
  rollbackBusy,
  actionError,
  actionErrorKind,
  applyControl,
  rollback,
}: AdminTrustGrowthControlSectionProps) {
  const { t } = useTranslation();

  return (
    <section
      className="rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4"
      aria-labelledby={controlSectionId}
    >
      <h2 id={controlSectionId} className="text-small font-semibold uppercase tracking-wide text-ink-500">
        {t("admin_trust_growth_section_control")}
      </h2>
      <p className="mt-2 text-meta text-ink-600">{t("admin_trust_growth_control_hint")}</p>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        <label className="flex cursor-pointer items-center gap-2 text-body text-ink-800">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-ink-300 text-ink-700 accent-ink-700"
            checked={draftFrozen}
            onChange={(e) => setDraftFrozen(e.target.checked)}
          />
          {t("admin_trust_growth_freeze")}
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-body text-ink-800">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-ink-300 text-ink-700 accent-ink-700"
            checked={draftForce}
            onChange={(e) => setDraftForce(e.target.checked)}
          />
          {t("admin_trust_growth_force_control")}
        </label>
      </div>

      <div className="mt-4">
        <label htmlFor="tg-caps" className="text-small font-medium text-ink-700">
          {t("admin_trust_growth_caps_label")}
        </label>
        <p className="text-meta text-ink-500">{t("admin_trust_growth_caps_hint")}</p>
        <textarea
          id="tg-caps"
          rows={5}
          className="mt-1 w-full max-w-xl rounded-[var(--radius-md)] border border-ink-200 bg-white p-3 font-mono text-meta text-ink-900"
          value={capsText}
          onChange={(e) => setCapsText(e.target.value)}
          spellCheck={false}
        />
      </div>

      {actionError && actionErrorKind ? (
        <AdminAlertError className="mt-3" message={actionError} errorKind={actionErrorKind} />
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS} disabled:opacity-50`}
          onClick={() => void applyControl()}
          disabled={saving || rollbackBusy}
        >
          {saving ? t("admin_trust_growth_saving") : t("admin_trust_growth_apply")}
        </button>
        <button
          type="button"
          className={`rounded-[var(--radius-md)] border border-warning/40 bg-warning/10 px-4 py-2 text-small font-medium text-ink-900 hover:bg-warning/15 disabled:opacity-50 ${ADMIN_LINK_FOCUS_CLASS}`}
          onClick={() => void rollback()}
          disabled={saving || rollbackBusy}
        >
          {rollbackBusy ? t("admin_trust_growth_rollbacking") : t("admin_trust_growth_rollback")}
        </button>
      </div>
    </section>
  );
}
