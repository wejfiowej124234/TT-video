"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
import { ADMIN_FILTER_CARD_CLASS, ADMIN_FORM_FIELD_FOCUS_CLASS } from "@/lib/adminUi";
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
    void applyPatch({ suspended_until: iso });
  };

  if (!userId) return null;

  return (
    <section
      id="admin-acquisition-suspend"
      className={`${ADMIN_FILTER_CARD_CLASS} shadow-soft`}
      aria-label={t("admin_acquisition_suspend_sectionAria")}
      data-testid="admin-acquisition-publish-suspend"
    >
      <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
        {t("admin_acquisition_suspend_title")}
      </h2>
      <p className="mt-2 text-body text-ink-600 leading-snug">{t("admin_acquisition_suspend_caption")}</p>

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
      ) : (
        <p className="mt-3 text-meta text-ink-500">{t("admin_acquisition_suspend_statusUnknown")}</p>
      )}

      <div className="mt-4 space-y-3 border-t border-ink-100 pt-4">
        <label className="block text-small text-ink-700">
          {t("admin_acquisition_suspend_untilLabel")}
          <input
            type="datetime-local"
            className={`mt-1 w-full max-w-md rounded border border-ink-200 px-2 py-1.5 font-mono text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
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
        </div>
        {error ? (
          <p className="text-small text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
