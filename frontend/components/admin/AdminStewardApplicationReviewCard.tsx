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
import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import {
 ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_FORM_CONTROL_SM_CLASS,
  ADMIN_INNER_DIVIDER_CLASS,
  ADMIN_SEMANTIC_APPROVE_BTN_CLASS,
  ADMIN_SEMANTIC_REJECT_BTN_CLASS,
  ADMIN_TEXT_MUTED_CLASS,
} from "@/lib/adminUi";

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
  const requestConfirm = useAdminL5ConfirmRequest();

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
          (status === "rejected" || status === "needs_more_info") && rejectionMessage.trim()
            ? rejectionMessage.trim()
            : undefined,
      });
      await load();
    } catch (e) {
      setReviewErr(mapApiReadError(e, t, "admin_steward_app_reviewFailed"));
    } finally {
      setReviewLoading(false);
    }
  };

  if (!userId) return null;

  // HU-364 · 无申请时不占用户详情三卡堆叠
  if (!loading && !error && !app?.status) return null;

  const payload = app?.payload;
  const legalName =
    payload && typeof payload.legal_name === "string" ? payload.legal_name : undefined;
  const actionable =
    app?.status !== "approved" &&
    app?.status !== "rejected" &&
    app?.status !== "stake_release_pending" &&
    Boolean(app?.status);

  return (
    <AdminDetailContentPanel
      as="section"
      aria-label={t("admin_steward_app_sectionAria")}
      data-testid="admin-steward-application-review"
      data-tt-admin-onboarding-review-card="steward"
    >
      <h2 className={`text-small font-semibold uppercase tracking-wide ${ADMIN_TEXT_MUTED_CLASS}`}>
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
      ) : (
        <div className="mt-3 space-y-3 text-body">
          <p>
            <span className={`text-meta ${ADMIN_TEXT_MUTED_CLASS}`}>{t("admin_steward_app_status")}: </span>
            <span className="font-mono text-meta">
              {app?.status === "needs_more_info"
                ? t("admin_steward_app_status_needs_more_info")
                : app?.status}
            </span>
          </p>
          {app?.jurisdictions?.length ? (
            <p>
              <span className={`text-meta ${ADMIN_TEXT_MUTED_CLASS}`}>{t("admin_steward_app_jurisdictions")}: </span>
              <span className="font-mono text-meta">{app.jurisdictions.join(", ")}</span>
            </p>
          ) : null}
          {app?.stake_quote?.cumulative_ttg_units_required != null ? (
            <p>
              <span className={`text-meta ${ADMIN_TEXT_MUTED_CLASS}`}>{t("admin_steward_app_ttg")}: </span>
              <span className="font-mono text-meta">
                {app.stake_quote.cumulative_ttg_units_required.toLocaleString()} TTG
              </span>
            </p>
          ) : null}
          {legalName ? (
            <p>
              <span className={`text-meta ${ADMIN_TEXT_MUTED_CLASS}`}>{t("admin_steward_app_legalName")}: </span>
              <span className="font-mono text-meta">{legalName}</span>
            </p>
          ) : null}
          {typeof payload?.motivation === "string" && payload.motivation.trim() ? (
            <div data-tt-admin-steward-motivation="1">
              <p className={`text-meta ${ADMIN_TEXT_MUTED_CLASS}`}>{t("admin_steward_app_motivation")}</p>
              <p className="mt-0.5 whitespace-pre-wrap text-small text-ink-800">{payload.motivation}</p>
            </div>
          ) : null}
          {typeof payload?.contact_email === "string" && payload.contact_email.trim() ? (
            <p data-tt-admin-steward-contact-email="1">
              <span className={`text-meta ${ADMIN_TEXT_MUTED_CLASS}`}>{t("admin_steward_app_contactEmail")}: </span>
              <span className="font-mono text-meta">{payload.contact_email}</span>
            </p>
          ) : null}
          {typeof payload?.country_code === "string" && payload.country_code.trim() ? (
            <p data-tt-admin-steward-country="1">
              <span className={`text-meta ${ADMIN_TEXT_MUTED_CLASS}`}>{t("admin_steward_app_country")}: </span>
              <span className="font-mono text-meta">{payload.country_code}</span>
            </p>
          ) : null}
          {/* HU-495/Q5 · 诚实空：主理人申请无证件/材料 URL 时明示，禁止假材料墙 */}
          <p
            className="text-small text-ink-600"
            data-tt-admin-steward-docs-empty="1"
            data-tt-admin-steward-materials="honest-empty"
          >
            {t("admin_steward_app_docsEmptyHonest")}
          </p>
          {app.wallet_address ? (
            <p className="break-all font-mono text-meta text-ink-800">{app.wallet_address}</p>
          ) : null}
          {app?.status === "rejected" && app.rejection_message ? (
            <p className="text-small text-ink-700 whitespace-pre-wrap" data-tt-admin-steward-rejection="1">
              <span className={`text-meta ${ADMIN_TEXT_MUTED_CLASS}`}>{t("admin_steward_app_rejectionMessage")}: </span>
              {app.rejection_message}
            </p>
          ) : null}
          {app?.status === "needs_more_info" && app.rejection_message ? (
            <p
              className="text-small text-ink-700 whitespace-pre-wrap"
              data-tt-admin-steward-needs-more-info="1"
            >
              <span className={`text-meta ${ADMIN_TEXT_MUTED_CLASS}`}>{t("admin_steward_app_needsMoreInfoNote")}: </span>
              {app.rejection_message}
            </p>
          ) : null}

          {actionable ? (
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
                className={ADMIN_PRIMARY_ACTION_BTN_CLASS}
                disabled={reviewLoading}
                data-tt-admin-action-needs-more-info="1"
                onClick={() =>
                  requestConfirm({
                    titleKey: "admin_l5_confirm_title_reject",
                    descKey: "admin_steward_app_confirm_needs_more_info",
                    danger: false,
                    confirmLabelKey: "admin_steward_app_actionNeedsMoreInfo",
                    onConfirm: () => submitReview("needs_more_info"),
                  })
                }
              >
                {t("admin_steward_app_actionNeedsMoreInfo")}
              </button>
              <button
                type="button"
                className={ADMIN_SEMANTIC_APPROVE_BTN_CLASS}
                disabled={reviewLoading}
                onClick={() =>
                  requestConfirm({
                    titleKey: "admin_l5_confirm_title_approve",
                    descKey: "admin_steward_app_confirm_approve",
                    danger: true,
                    confirmLabelKey: "admin_steward_app_actionApprove",
                    onConfirm: () => submitReview("approved"),
                  })
                }
              >
                {t("admin_steward_app_actionApprove")}
              </button>
              <button
                type="button"
                className={ADMIN_SEMANTIC_REJECT_BTN_CLASS}
                disabled={reviewLoading}
                onClick={() =>
                  requestConfirm({
                    titleKey: "admin_l5_confirm_title_reject",
                    descKey: "admin_steward_app_confirm_reject",
                    danger: true,
                    confirmLabelKey: "admin_steward_app_actionReject",
                    onConfirm: () => submitReview("rejected"),
                  })
                }
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
