"use client";

import { useCallback, useEffect, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import {
  getAdminUserStewardApplication,
  patchAdminStewardApplicationReview,
  type StewardApplicationReviewStatus,
} from "@/lib/apiClient/adminStewardApplication";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { ADMIN_FILTER_CARD_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS } from "@/lib/adminUi";

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
    <section
      className={`${ADMIN_FILTER_CARD_CLASS} shadow-soft`}
      aria-label={t("admin_steward_app_sectionAria") ?? "Steward application review"}
      data-testid="admin-steward-application-review"
    >
      <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
        {t("admin_steward_app_title") ?? "区域主理人申请"}
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
        <p className="mt-3 text-body text-ink-600">{t("admin_steward_app_none") ?? "无申请记录"}</p>
      ) : (
        <div className="mt-3 space-y-3 text-body">
          <p>
            <span className="text-meta text-ink-500">{t("admin_steward_app_status") ?? "状态"}: </span>
            <span className="font-mono text-meta">{app.status}</span>
          </p>
          {app.jurisdictions?.length ? (
            <p>
              <span className="text-meta text-ink-500">{t("admin_steward_app_jurisdictions") ?? "辖区"}: </span>
              <span className="font-mono text-meta">{app.jurisdictions.join(", ")}</span>
            </p>
          ) : null}
          {app.stake_quote?.cumulative_ttg_units_required != null ? (
            <p>
              <span className="text-meta text-ink-500">{t("admin_steward_app_ttg") ?? "TTG 质押"}: </span>
              <span className="font-mono text-meta">
                {app.stake_quote.cumulative_ttg_units_required.toLocaleString()} TTG
              </span>
            </p>
          ) : null}
          {legalName ? (
            <p>
              <span className="text-meta text-ink-500">{t("admin_steward_app_legalName") ?? "主体"}: </span>
              <span className="font-mono text-meta">{legalName}</span>
            </p>
          ) : null}
          {app.wallet_address ? (
            <p className="break-all font-mono text-meta text-ink-800">{app.wallet_address}</p>
          ) : null}

          {app.status !== "approved" && app.status !== "rejected" ? (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-100 pt-4">
              <button
                type="button"
                className={ADMIN_PRIMARY_ACTION_BTN_CLASS}
                disabled={reviewLoading}
                onClick={() => void submitReview("under_review")}
              >
                {t("admin_steward_app_actionReview") ?? "标记审核中"}
              </button>
              <button
                type="button"
                className="rounded-[var(--radius-sm)] bg-success px-3 py-2 text-small font-medium text-white disabled:opacity-50"
                disabled={reviewLoading}
                onClick={() => void submitReview("approved")}
              >
                {t("admin_steward_app_actionApprove") ?? "批准"}
              </button>
              <button
                type="button"
                className="rounded-[var(--radius-sm)] bg-danger px-3 py-2 text-small font-medium text-white disabled:opacity-50"
                disabled={reviewLoading}
                onClick={() => void submitReview("rejected")}
              >
                {t("admin_steward_app_actionReject") ?? "驳回"}
              </button>
              <label className="block w-full text-small text-ink-700">
                {t("admin_steward_app_rejectionMessage") ?? "驳回说明"}
                <textarea
                  className="mt-1 w-full rounded border border-ink-200 px-2 py-1.5 text-meta"
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
    </section>
  );
}
