"use client";

import { useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailContentPanel } from "@/components/admin/AdminDetailContentPanel";
import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import {
  patchAdminGuideRegistration,
  type AdminGuideRegistrationStatus,
} from "@/lib/apiClient/adminGuideRegistration";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  ADMIN_FORM_CONTROL_SM_CLASS,
  ADMIN_INNER_DIVIDER_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_SEMANTIC_APPROVE_BTN_CLASS,
  ADMIN_SEMANTIC_REJECT_BTN_CLASS,
} from "@/lib/adminUi";

const REVIEWABLE = new Set(["pending", "pending_review", "active"]);

export function AdminGuideRegistrationReviewCard({
  guideId,
  status,
  onUpdated,
}: {
  guideId: string;
  status: string;
  onUpdated: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const requestConfirm = useAdminL5ConfirmRequest();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rejectionCodes, setRejectionCodes] = useState("DOC_BLUR");
  const [rejectionMessage, setRejectionMessage] = useState("");

  if (!guideId || !REVIEWABLE.has(status)) return null;

  const patch = async (next: AdminGuideRegistrationStatus) => {
    setBusy(true);
    setErr(null);
    try {
      const codes =
        next === "rejected"
          ? rejectionCodes
              .split(/[,;\s]+/)
              .map((c) => c.trim())
              .filter(Boolean)
          : undefined;
      await patchAdminGuideRegistration(guideId, {
        status: next,
        rejection_codes: codes,
        rejection_message:
          next === "rejected" && rejectionMessage.trim() ? rejectionMessage.trim() : undefined,
      });
      await onUpdated();
    } catch (e) {
      setErr(mapApiReadError(e, t, "admin_guide_reg_reviewFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminDetailContentPanel
      as="section"
      className="mt-6"
      aria-label={t("admin_guide_reg_sectionAria")}
      data-tt-admin-guide-registration-review="1"
    >
      <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
        {t("admin_guide_reg_title")}
      </h2>
      <div className={`mt-3 space-y-3 ${ADMIN_INNER_DIVIDER_CLASS} pt-3`}>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={ADMIN_PRIMARY_ACTION_BTN_CLASS}
            disabled={busy}
            onClick={() => void patch("pending_review")}
          >
            {t("admin_guide_reg_actionPendingReview")}
          </button>
          <button
            type="button"
            className={ADMIN_SEMANTIC_APPROVE_BTN_CLASS}
            disabled={busy}
            onClick={() =>
              requestConfirm({
                titleKey: "admin_l5_confirm_title_danger",
                descKey: "admin_guide_reg_confirm_approve",
                danger: true,
                confirmLabelKey: "admin_guide_reg_actionApprove",
                onConfirm: () => patch("active"),
              })
            }
          >
            {t("admin_guide_reg_actionApprove")}
          </button>
          <button
            type="button"
            className={ADMIN_SEMANTIC_REJECT_BTN_CLASS}
            disabled={busy}
            onClick={() => void patch("rejected")}
          >
            {t("admin_guide_reg_actionReject")}
          </button>
          {status === "active" ? (
            <button
              type="button"
              className={ADMIN_PRIMARY_ACTION_BTN_CLASS}
              disabled={busy}
              onClick={() => void patch("suspended")}
            >
              {t("admin_guide_reg_actionSuspend")}
            </button>
          ) : null}
        </div>
        <label className="block text-small text-ink-700">
          {t("admin_guide_app_rejectionCodes")}
          <input
            type="text"
            className={`mt-1 w-full ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1.5 font-mono text-meta`}
            value={rejectionCodes}
            onChange={(e) => setRejectionCodes(e.target.value)}
          />
        </label>
        <label className="block text-small text-ink-700">
          {t("admin_guide_app_rejectionMessage")}
          <textarea
            className={`mt-1 w-full ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1.5 text-meta`}
            rows={2}
            value={rejectionMessage}
            onChange={(e) => setRejectionMessage(e.target.value)}
          />
        </label>
        {err ? (
          <p className="text-small text-danger" role="alert">
            {err}
          </p>
        ) : null}
      </div>
    </AdminDetailContentPanel>
  );
}
