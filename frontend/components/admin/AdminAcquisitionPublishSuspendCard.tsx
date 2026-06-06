"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import { useTranslation } from "@/components/LocaleProvider";
import {
  patchAdminUserAcquisitionPublishSuspend,
  type AdminAcquisitionPublishSuspendResult,
} from "@/lib/apiClient/adminAcquisitionPublishSuspend";
import {
  defaultSuspendUntilLocal,
  localDatetimeToRfc3339,
} from "@/lib/adminAcquisitionSuspendUtils";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { AdminDetailContentPanel } from "@/components/admin/AdminDetailContentPanel";
import { ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FORM_CONTROL_SM_CLASS,
  ADMIN_INNER_DIVIDER_CLASS,
  ADMIN_SEMANTIC_REJECT_BTN_CLASS,
  ADMIN_ACQUISITION_SUSPEND_ACTIVE_STATUS_CLASS,
  ADMIN_ACQUISITION_SUSPEND_CLEAR_STATUS_CLASS,} from "@/lib/adminUi";
import { travelFocusRingCoreOffset2WhiteClasses } from "@/lib/travelLinkFocus";

export type AdminAcquisitionPublishSuspendSnapshot = {
  acquisition_publish_suspended?: boolean;
  acquisition_publish_suspended_until?: string | null;
};

export function AdminAcquisitionPublishSuspendCard({
  userId,
  initialSnapshot = null,
}: {
  userId: string;
  initialSnapshot?: AdminAcquisitionPublishSuspendSnapshot | null;
}) {
  const { t } = useTranslation();
  const requestConfirm = useAdminL5ConfirmRequest();
  const [suspendUntilLocal, setSuspendUntilLocal] = useState(defaultSuspendUntilLocal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<AdminAcquisitionPublishSuspendResult | null>(null);

  useEffect(() => {
    if (initialSnapshot == null) return;
    if (typeof initialSnapshot.acquisition_publish_suspended !== "boolean") return;
    setSnapshot({
      acquisition_publish_suspended: initialSnapshot.acquisition_publish_suspended,
      acquisition_publish_suspended_until:
        initialSnapshot.acquisition_publish_suspended_until ?? null,
    });
  }, [initialSnapshot]);

  const suspended = snapshot?.acquisition_publish_suspended === true;
  const suspendedUntilDisplay = useMemo(() => {
    const raw = snapshot?.acquisition_publish_suspended_until;
    if (typeof raw !== "string" || !raw.trim()) return null;
    return raw;
  }, [snapshot?.acquisition_publish_suspended_until]);

  const applyPatch = useCallback(
    async (body: { suspended_until: string | null }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await patchAdminUserAcquisitionPublishSuspend(userId, body);
        setSnapshot(result);
      } catch (e) {
        setError(mapApiReadError(e, t, "admin_acquisition_suspend_patchFailed"));
      } finally {
        setLoading(false);
      }
    },
    [t, userId],
  );

  const handleSuspend = () => {
    const iso = localDatetimeToRfc3339(suspendUntilLocal);
    if (!iso) {
      setError(t("admin_acquisition_suspend_invalidUntil"));
      return;
    }
    requestConfirm({
      titleKey: "admin_l5_confirm_title_danger",
      descKey: "admin_l5_confirm_desc_acquisition_suspend",
      danger: true,
      onConfirm: () => void applyPatch({ suspended_until: iso }),
    });
  };

  const handleLift = () => {
    requestConfirm({
      titleKey: "admin_l5_confirm_title_write",
      descKey: "admin_l5_confirm_desc_acquisition_lift",
      onConfirm: () => void applyPatch({ suspended_until: null }),
    });
  };

  if (!userId) return null;

  return (
    <AdminDetailContentPanel
      as="section"
      id="admin-acquisition-suspend"
     
      aria-label={t("admin_acquisition_suspend_sectionAria")}
      data-testid="admin-acquisition-publish-suspend"
    >
      <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
        {t("admin_acquisition_suspend_title")}
      </h2>
      <p className="mt-2 text-body text-ink-600 leading-snug">{t("admin_acquisition_suspend_caption")}</p>

      {snapshot != null ? (
        <div
          className={
            suspended
              ? ADMIN_ACQUISITION_SUSPEND_ACTIVE_STATUS_CLASS
              : ADMIN_ACQUISITION_SUSPEND_CLEAR_STATUS_CLASS
          }
          role="status"
        >
          {suspended
            ? t("admin_acquisition_suspend_statusActive", {
                until: suspendedUntilDisplay ?? t("admin_em_dash"),
              })
            : t("admin_acquisition_suspend_statusClear")}
        </div>
      ) : (
        <p className="mt-3 text-meta text-ink-500">{t("admin_acquisition_suspend_statusUnknown")}</p>
      )}

      <div className={`mt-4 space-y-3 ${ADMIN_INNER_DIVIDER_CLASS} pt-4`}>
        <label className="block text-small text-ink-700">
          {t("admin_acquisition_suspend_untilLabel")}
          <input
            type="datetime-local"
            className={`mt-1 w-full max-w-md ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1.5 font-mono text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            value={suspendUntilLocal}
            onChange={(e) => setSuspendUntilLocal(e.target.value)}
            disabled={loading}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`${ADMIN_SEMANTIC_REJECT_BTN_CLASS} ${travelFocusRingCoreOffset2WhiteClasses}`}
            disabled={loading}
            onClick={handleSuspend}
          >
            {t("admin_acquisition_suspend_actionSuspend")}
          </button>
          <button
            type="button"
            className={`${ADMIN_FILTER_RESET_BTN_CLASS} disabled:opacity-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
            disabled={loading}
            onClick={handleLift}
          >
            {t("admin_acquisition_suspend_actionLift")}
          </button>
        </div>
        {error ? (
          <p className="text-small text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </AdminDetailContentPanel>
  );
}
