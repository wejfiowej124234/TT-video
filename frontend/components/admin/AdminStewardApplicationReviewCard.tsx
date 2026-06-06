"use client";

import { useCallback, useEffect, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import {
  getAdminUserStewardApplication,
  patchAdminStewardApplicationReview,
  type StewardApplicationReviewStatus,
} from "@/lib/apiClient/adminStewardApplication";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { AdminDetailContentPanel } from "@/components/admin/AdminDetailContentPanel";
import { ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_FORM_CONTROL_SM_CLASS,
  ADMIN_INNER_DIVIDER_CLASS,
  ADMIN_SEMANTIC_APPROVE_BTN_CLASS,
  ADMIN_SEMANTIC_REJECT_BTN_CLASS,} from "@/lib/adminUi";

type StewardApplicationPayload = {
  id?: string;
  status?: string;
  jurisdictions?: string[];
  wallet_address?: string;
  payload?: Record<string, unknown>;
  submitted_at?: string;
  stake_quote?: { cumulative_ttg_units_required?: number };
  rejection_codes?: string[];
  rejection_message?: string;
};

function applicationFromResponse(body: unknown): StewardApplicationPayload | null {
  if (!body || typeof body !== "object") return null;
  const app = (body as Record<string, unknown>).application;
  if (!app || typeof app !== "object") return null;
  return app as StewardApplicationPayload;
}

export function AdminStewardApplicationReviewCard({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [app, setApp] = useState<StewardApplicationPayload | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewErr, setReviewErr] = useState<string | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState("");

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const body = await getAdminUserStewardApplication(userId);
      setApp(applicationFromResponse(body));
    } catch (e) {
      setApp(null);
      setError(mapApiReadError(e, t, "admin_steward_app_loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitReview = async (status: StewardApplicationReviewStatus) => {
    setReviewLoading(true);
    setReviewErr(null);
    try {
      await patchAdminStewardApplicationReview(userId, {
        status,
        rejection_message:
          status === "rejected" && rejectionMessage.trim() ? rejectionMessage.trim() : undefined,
      });
      await load();
    } catch (e) {
      setReviewErr(mapApiReadError(e, t, "admin_steward_app_reviewFailed"));
    } finally {
      setReviewLoading(false);
    }
  };

  if (!userId) return null;

  const payload = app?.payload;
  const legalName =
    payload && typeof payload.legal_name === "string" ? payload.legal_name : undefined;

  return (
    <AdminDetailContentPanel
      as="section"
     
      aria-label={t("admin_steward_app_sectionAria")}
      data-testid="admin-steward-application-review"
    >
      <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
        {t("admin_steward_app_title")}
      </h2>
      {loading ? (
        <p className="mt-3 text-body text-ink-600" role="status">
          {t("admin_users_loading")}
        </p>
      ) : error ? (
        <p className="mt-3 text-small text-danger" role="alert">
          {error}
        </p>
      ) : !app?.status ? (
        <p className="mt-3 text-body text-ink-600">{t("admin_steward_app_none")}</p>
      ) : (
        <div className="mt-3 space-y-3 text-body">
          <p>
            <span className="text-meta text-ink-500">{t("admin_steward_app_status")}: </span>
            <span className="font-mono text-meta">{app.status}</span>
          </p>
          {app.jurisdictions?.length ? (
            <p>
              <span className="text-meta text-ink-500">{t("admin_steward_app_jurisdictions")}: </span>
              <span className="font-mono text-meta">{app.jurisdictions.join(", ")}</span>
            </p>
          ) : null}
          {app.stake_quote?.cumulative_ttg_units_required != null ? (
            <p>
              <span className="text-meta text-ink-500">{t("admin_steward_app_ttg")}: </span>
              <span className="font-mono text-meta">
                {app.stake_quote.cumulative_ttg_units_required.toLocaleString()} TTG
              </span>
            </p>
          ) : null}
          {legalName ? (
            <p>
              <span className="text-meta text-ink-500">{t("admin_steward_app_legalName")}: </span>
              <span className="font-mono text-meta">{legalName}</span>
            </p>
          ) : null}
          {app.wallet_address ? (
            <p className="break-all font-mono text-meta text-ink-800">{app.wallet_address}</p>
          ) : null}

          {app.status !== "approved" && app.status !== "rejected" ? (
            <div className={`mt-4 flex flex-wrap gap-2 ${ADMIN_INNER_DIVIDER_CLASS} pt-4`}>
              <button
                type="button"
                className={ADMIN_PRIMARY_ACTION_BTN_CLASS}
                disabled={reviewLoading}
                onClick={() => void submitReview("under_review")}
              >
                {t("admin_steward_app_actionReview")}
              </button>
              <button
                type="button"
                className={ADMIN_SEMANTIC_APPROVE_BTN_CLASS}
                disabled={reviewLoading}
                onClick={() => void submitReview("approved")}
              >
                {t("admin_steward_app_actionApprove")}
              </button>
              <button
                type="button"
                className={ADMIN_SEMANTIC_REJECT_BTN_CLASS}
                disabled={reviewLoading}
                onClick={() => void submitReview("rejected")}
              >
                {t("admin_steward_app_actionReject")}
              </button>
              <label className="block w-full text-small text-ink-700">
                {t("admin_steward_app_rejectionMessage")}
                <textarea
                  className={`mt-1 w-full ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1.5 text-meta`}
                  rows={2}
                  value={rejectionMessage}
                  onChange={(e) => setRejectionMessage(e.target.value)}
                />
              </label>
              {reviewErr ? (
                <p className="w-full text-small text-danger" role="alert">
                  {reviewErr}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </AdminDetailContentPanel>
  );
}
