"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { ADMIN_LINK_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_FORM_CONTROL_MD_CLASS,
  ADMIN_FORM_CHECKBOX_CLASS,
  ADMIN_WARNING_SOFT_BTN_CLASS,} from "@/lib/adminUi";
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
  applyControl: () => void;
  rollback: () => void;
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
    <AdminWarmL5Surface
      as="section"
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
            className={ADMIN_FORM_CHECKBOX_CLASS}
            checked={draftFrozen}
            onChange={(e) => setDraftFrozen(e.target.checked)}
          />
          {t("admin_trust_growth_freeze")}
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-body text-ink-800">
          <input
            type="checkbox"
            className={ADMIN_FORM_CHECKBOX_CLASS}
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
          className={`mt-1 w-full max-w-xl ${ADMIN_FORM_CONTROL_MD_CLASS} p-3 font-mono text-meta text-ink-900`}
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
          className={`${ADMIN_WARNING_SOFT_BTN_CLASS} disabled:opacity-50 ${ADMIN_LINK_FOCUS_CLASS}`}
          onClick={() => void rollback()}
          disabled={saving || rollbackBusy}
        >
          {rollbackBusy ? t("admin_trust_growth_rollbacking") : t("admin_trust_growth_rollback")}
        </button>
      </div>
    </AdminWarmL5Surface>
  );
}
