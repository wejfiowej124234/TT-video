"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import {
  patchAdminUserAcquisitionPublishSuspend,
  type AdminAcquisitionPublishSuspendResult,
} from "@/lib/apiClient/adminAcquisitionPublishSuspend";
import {
  defaultSuspendUntilLocal,
  localDatetimeToRfc3339,
} from "@/lib/adminAcquisitionSuspendUtils";
import { ADMIN_FORM_FIELD_FOCUS_CLASS } from "@/lib/adminUi";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { travelFocusRingCoreOffset2WhiteClasses } from "@/lib/travelLinkFocus";

export type AdminAcquisitionPublishSuspendModalUser = {
  id: string;
  email: string;
  acquisition_publish_suspended?: boolean;
  acquisition_publish_suspended_until?: string | null;
};

export function AdminAcquisitionPublishSuspendModal({
  user,
  onClose,
  onSuccess,
}: {
  user: AdminAcquisitionPublishSuspendModalUser | null;
  onClose: () => void;
  onSuccess: (userId: string, result: AdminAcquisitionPublishSuspendResult) => void;
}) {
  const { t } = useTranslation();
  const titleId = useId();
  const descId = useId();
  const [suspendUntilLocal, setSuspendUntilLocal] = useState(defaultSuspendUntilLocal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<AdminAcquisitionPublishSuspendResult | null>(null);

  useEffect(() => {
    if (!user) return;
    setSuspendUntilLocal(defaultSuspendUntilLocal());
    setError(null);
    setLoading(false);
    if (typeof user.acquisition_publish_suspended === "boolean") {
      setSnapshot({
        acquisition_publish_suspended: user.acquisition_publish_suspended,
        acquisition_publish_suspended_until: user.acquisition_publish_suspended_until ?? null,
      });
    } else {
      setSnapshot(null);
    }
  }, [user]);

  const suspended = snapshot?.acquisition_publish_suspended === true;
  const suspendedUntilDisplay = useMemo(() => {
    const raw = snapshot?.acquisition_publish_suspended_until;
    if (typeof raw !== "string" || !raw.trim()) return null;
    return raw;
  }, [snapshot?.acquisition_publish_suspended_until]);

  const applyPatch = useCallback(
    async (body: { suspended_until: string | null }) => {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        const result = await patchAdminUserAcquisitionPublishSuspend(user.id, body);
        setSnapshot(result);
        onSuccess(user.id, result);
      } catch (e) {
        setError(mapApiReadError(e, t, "admin_acquisition_suspend_patchFailed"));
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, t, user?.id],
  );

  const handleSuspend = () => {
    const iso = localDatetimeToRfc3339(suspendUntilLocal);
    if (!iso) {
      setError(t("admin_acquisition_suspend_invalidUntil"));
      return;
    }
    void applyPatch({ suspended_until: iso });
  };

  if (!user) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      data-testid="admin-acquisition-publish-suspend-modal"
    >
      <div className="max-w-md w-full rounded-[var(--radius-xl)] border border-ink-200 bg-white p-5 shadow-medium">
        <h2 id={titleId} className="text-body-l font-semibold text-ink-900">
          {t("admin_acquisition_suspend_modalTitle")}
        </h2>
        <p id={descId} className="mt-1 text-small text-ink-600">
          {t("admin_acquisition_suspend_modalSubtitle")}
        </p>
        <p className="mt-2 font-mono text-meta text-ink-800 break-all">{user.email}</p>

        {snapshot != null ? (
          <div
            className={`mt-3 rounded-[var(--radius-md)] border px-3 py-2.5 text-meta ${
              suspended
                ? "border-danger/30 bg-danger/5 text-danger"
                : "border-success/30 bg-success/10 text-success"
            }`}
            role="status"
          >
            {suspended
              ? t("admin_acquisition_suspend_statusActive", {
                  until: suspendedUntilDisplay ?? t("admin_em_dash"),
                })
              : t("admin_acquisition_suspend_statusClear")}
          </div>
        ) : null}

        <div className="mt-4 space-y-3 border-t border-ink-100 pt-4">
          <label className="block text-small text-ink-700">
            {t("admin_acquisition_suspend_untilLabel")}
            <input
              type="datetime-local"
              className={`mt-1 w-full rounded border border-ink-200 px-2 py-1.5 font-mono text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={suspendUntilLocal}
              onChange={(e) => setSuspendUntilLocal(e.target.value)}
              disabled={loading}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded-[var(--radius-sm)] bg-danger px-3 py-2 text-small font-medium text-white hover:opacity-90 disabled:opacity-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              disabled={loading}
              onClick={handleSuspend}
            >
              {t("admin_acquisition_suspend_actionSuspend")}
            </button>
            <button
              type="button"
              className={`rounded-[var(--radius-sm)] border border-ink-200 bg-white px-3 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              disabled={loading}
              onClick={() => void applyPatch({ suspended_until: null })}
            >
              {t("admin_acquisition_suspend_actionLift")}
            </button>
            <button
              type="button"
              className={`rounded-[var(--radius-sm)] border border-ink-200 bg-white px-3 py-2 text-small font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              disabled={loading}
              onClick={onClose}
            >
              {t("admin_acquisition_suspend_modalClose")}
            </button>
          </div>
          {error ? (
            <p className="text-small text-danger" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
