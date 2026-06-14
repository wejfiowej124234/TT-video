"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { TT_IDENTITY_SLOT_SETTINGS_L5 } from "@/lib/me/identitySlotSettingsL5";
import { resolveIdentitySlotReviewStatusView } from "@/lib/me/identitySlotReviewStatusModel";

export function IdentitySlotReviewStatusPanel({
  applicationStatus,
  rejectionCodes,
  rejectionMessage,
}: {
  applicationStatus?: string | null;
  rejectionCodes?: string[] | null;
  rejectionMessage?: string | null;
}) {
  const { t } = useTranslation();
  const view = resolveIdentitySlotReviewStatusView({
    applicationStatus,
    rejectionCodes,
    rejectionMessage,
  });

  if (!view.showPanel) return null;

  const statusLabel = view.statusLabelKey
    ? t(view.statusLabelKey)
    : view.applicationStatus;

  return (
    <section
      className={TT_IDENTITY_SLOT_SETTINGS_L5.sectionCard}
      data-tt-identity-slot-review-status="1"
      aria-labelledby="identity-slot-review-status-title"
    >
      <h2 id="identity-slot-review-status-title" className={TT_IDENTITY_SLOT_SETTINGS_L5.sectionTitle}>
        {t("me_identities_review_status_title")}
      </h2>
      {view.applicationStatus ? (
        <p className="mt-3 text-meta text-slate-300/95">
          <span className="text-slate-400">{t("me_identities_review_status_label")}: </span>
          {statusLabel}
        </p>
      ) : null}
      {view.rejectionCodes.length ? (
        <ul className="list-inside list-disc space-y-1 text-meta text-danger/90" role="list">
          {view.rejectionCodes.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
      ) : null}
      {view.rejectionMessage ? (
        <p className="text-meta text-slate-400/95" role="note">
          {view.rejectionMessage}
        </p>
      ) : null}
    </section>
  );
}
